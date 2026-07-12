import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import conciergeAgentAsset from '@/assets/concierge-agent.jpg.asset.json';
const conciergeAgent = conciergeAgentAsset.url;

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_GREETING =
  "Hello — I'm OLIVIA. I can help you explore villas, apartments and plots across Cyprus. Tell me what you're looking for — a region, a budget, or a particular lifestyle.";

const SUGGESTED_QUESTIONS = [
  'Show me villas in Limassol',
  'Apartments under €500k',
  'Best areas for families',
  'Investment opportunities',
];

export default function ConciergeWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [greeting, setGreeting] = useState<string>(DEFAULT_GREETING);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: DEFAULT_GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history when opened (signed-in users only)
  // Load admin-managed greeting + enabled state once
  useEffect(() => {
    (async () => {
      const { data: rows } = await (supabase as any).rpc('get_assistant_public');
      const data = Array.isArray(rows) ? rows[0] : rows;
      if (data) {
        const g = data.greeting?.trim() || DEFAULT_GREETING;
        setGreeting(g);
        setEnabled(data.enabled !== false);
        setMessages((prev) => (prev.length <= 1 ? [{ role: 'assistant', content: g }] : prev));
      }
    })();
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Lock body scroll when chat is open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = original;
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Allow other components (e.g. the header) to open the concierge
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-concierge', handler);
    return () => window.removeEventListener('open-concierge', handler);
  }, []);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    if (!user) {
      toast.error('Please sign in to chat with the concierge.');
      const sp = new URLSearchParams(location.search);
      sp.set('auth', '1');
      navigate({ pathname: location.pathname, search: `?${sp.toString()}` });
      return;
    }
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Please sign in again.');

      abortRef.current = new AbortController();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: next
              .filter((_, i) => i !== 0 || messages.length > 1)
              .map(({ role, content }) => ({ role, content })),
          }),
          signal: abortRef.current.signal,
        },
      );

      if (!res.ok) {
        let msg = 'something went wrong';
        try {
          const j = await res.json();
          msg = j.error ?? msg;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      // Stream the assistant reply token-by-token
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setMessages([...next, { role: 'assistant', content: '' }]);
      if (reader) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages([...next, { role: 'assistant', content: acc }]);
        }
      }
      if (!acc.trim()) {
        setMessages([...next, { role: 'assistant', content: 'Sorry — I had trouble responding. Please try again.' }]);
      }
    } catch (e: any) {
      setMessages([...next, { role: 'assistant', content: `Sorry — ${e.message ?? 'something went wrong'}. Please try again.` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const clear = async () => {
    if (!user) return;
    await supabase.from('assistant_messages').delete().eq('user_id', user.id);
    setMessages([{ role: 'assistant', content: greeting }]);
    toast.success('Conversation cleared');
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open concierge chat"
          className="fixed bottom-6 right-4 md:bottom-10 md:right-6 z-[100] h-14 w-14 rounded-full bg-menu text-menu-foreground shadow-[0_15px_40px_-10px_hsl(var(--menu)/0.5)] hidden md:flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="OLIVIA"
          className="fixed z-[101] inset-x-0 bottom-0 h-[min(640px,80dvh)] md:left-auto md:bottom-6 md:right-6 md:w-[480px] md:rounded-2xl flex flex-col bg-background border border-border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-menu/10 flex items-center justify-center shrink-0">
                <img
                  src={conciergeAgent}
                  alt="OLIVIA"
                  loading="lazy"
                  width={512}
                  height={512}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground leading-tight text-lg">​OLIVIA</p>
                <p className="text-foreground/55 leading-tight text-base">AI Real Estate Support</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && messages.length > 1 && (
                <button
                  type="button"
                  onClick={clear}
                  aria-label="Clear conversation"
                  className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-muted text-foreground/60"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  abortRef.current?.abort();
                  abortRef.current = null;
                  setOpen(false);
                  setInput('');
                  setLoaded(false);
                  setLoading(false);
                  setMessages([{ role: 'assistant', content: greeting }]);
                }}
                aria-label="Close"
                className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-muted text-foreground/60"
              >
                <X size={16} className="w-[30px] h-[30px]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-200">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-md bg-menu text-menu-foreground px-3.5 py-2 leading-relaxed text-base shadow-sm'
                      : 'max-w-[90%] rounded-2xl rounded-bl-md bg-white text-foreground px-3.5 py-2 leading-relaxed text-base shadow-sm border border-slate-100'
                  }
                >
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0 prose-a:text-menu prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground text-foreground">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            if (href?.startsWith('/')) {
                              return (
                                <Link to={href} onClick={() => setOpen(false)} className="text-menu hover:underline">
                                  {children}
                                </Link>
                              );
                            }
                            return (
                              <a href={href} target="_blank" rel="noreferrer" className="text-menu hover:underline">
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 text-xs text-foreground/55">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Suggested questions */}
          {!loading && messages.length === 1 && (
            <div className="flex flex-wrap gap-2 px-4 py-3 bg-slate-200 border-t border-slate-300">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="text-sm px-5 py-2.5 rounded-full bg-white border border-slate-200 text-foreground hover:bg-menu hover:text-menu-foreground hover:border-menu transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-border bg-background p-3">
            {!user ? (
              <div className="text-xs text-foreground/65 text-center py-2">
                <button
                  type="button"
                  onClick={() => {
                    const sp = new URLSearchParams(location.search);
                    sp.set('auth', '1');
                    navigate({ pathname: location.pathname, search: `?${sp.toString()}` });
                  }}
                  className="text-menu hover:underline font-medium"
                >
                  Sign in
                </button>{' '}
                to chat with the concierge.
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Ask about a region, budget, lifestyle…"
                  className={`flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-menu/30 max-h-32 ${input.trim() ? 'border-blue-500' : 'border-border'}`}
                  disabled={loading}
                />
                <Button
                  size="icon"
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="h-9 w-9 shrink-0"
                  aria-label="Send"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
