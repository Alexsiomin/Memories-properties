import { useEffect, useState } from 'react';
import { Settings2, X } from 'lucide-react';
import cookieIcon from '@/assets/cookie-icon.png';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import {
  CONSENT_EVENT,
  DEFAULT_CONSENT,
  getConsent,
  saveConsent,
  type CookieConsent as ConsentRecord,
} from '@/lib/cookie-consent';

interface CategoryDef {
  key: 'necessary' | 'functional' | 'analytics' | 'marketing';
  label: string;
  description: string;
  required?: boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'necessary',
    label: 'Strictly necessary',
    description: 'Required for sign-in, security and core site features. Always on.',
    required: true,
  },
  {
    key: 'functional',
    label: 'Functional',
    description: 'Remembers your preferences such as currency, saved filters and theme.',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Helps us understand how the site is used so we can improve it.',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description: 'Used to measure the effectiveness of campaigns and tailor content.',
  },
];

const CookieConsent = () => {
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [draft, setDraft] = useState<ConsentRecord>(DEFAULT_CONSENT);

  // Show banner if no stored consent; expose a global to re-open from elsewhere
  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      setOpen(true);
      setDraft(DEFAULT_CONSENT);
    }
    const openHandler = () => {
      const current = getConsent() ?? DEFAULT_CONSENT;
      setDraft(current);
      setShowPrefs(true);
      setOpen(true);
    };
    window.addEventListener('memories:open-consent', openHandler);
    return () => window.removeEventListener('memories:open-consent', openHandler);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const sync = () => {
      const c = getConsent();
      if (c) setOpen(false);
    };
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const acceptAll = () => {
    saveConsent({ functional: true, analytics: true, marketing: true });
    setOpen(false);
    setShowPrefs(false);
  };

  const rejectAll = () => {
    saveConsent({ functional: false, analytics: false, marketing: false });
    setOpen(false);
    setShowPrefs(false);
  };

  const saveCustom = () => {
    saveConsent({
      functional: draft.functional,
      analytics: draft.analytics,
      marketing: draft.marketing,
    });
    setOpen(false);
    setShowPrefs(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop only shown when preferences panel is open */}
      {showPrefs && (
        <div
          className="fixed inset-0 z-[120] bg-foreground/50 backdrop-blur-sm"
          onClick={() => setShowPrefs(false)}
          aria-hidden
        />
      )}

      <div
        role="dialog"
        aria-modal={showPrefs}
        aria-labelledby="cookie-consent-title"
        className={
          showPrefs
            ? 'fixed z-[121] inset-x-4 bottom-4 md:inset-auto md:bottom-6 md:right-6 md:w-[560px] max-h-[85vh] flex flex-col bg-menu border-0 rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden text-menu-foreground'
            : 'fixed z-[121] inset-x-4 bottom-4 md:inset-auto md:bottom-6 md:right-6 md:w-[560px] bg-menu border-0 rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] text-menu-foreground'
        }
      >
        {!showPrefs ? (
          <div className="p-3 md:p-5">
            <div className="flex items-start gap-2.5 md:gap-3">
              <div className="hidden md:flex w-9 h-9 rounded-full bg-accent/10 items-center justify-center shrink-0">
                <img src={cookieIcon} alt="Cookie" className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="cookie-consent-title" className="font-montserrat font-extrabold uppercase tracking-[0.18em] text-xs md:text-sm text-menu-foreground flex items-center gap-2">
                  <img src={cookieIcon} alt="Cookie" className="md:hidden w-3.5 h-3.5" />
                  Designed in Cyprus with AI and Love
                </h2>
                <p className="mt-1.5 text-[11px] md:text-xs text-menu-foreground/70 leading-snug md:leading-relaxed">
                  We use cookies to run the site and (with your consent) measure traffic.{' '}
                  <Link to="/cookies" className="text-accent hover:underline">Cookie Policy</Link>.
                </p>
                <div className="mt-2.5 md:mt-4 flex flex-wrap gap-1.5 md:gap-2">
                  <Button size="sm" onClick={acceptAll} className="h-8 md:h-9 px-3 text-[11px] uppercase tracking-[0.14em] font-semibold bg-menu-foreground text-menu hover:bg-menu-foreground/90">Accept all</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDraft(getConsent() ?? DEFAULT_CONSENT);
                      setShowPrefs(true);
                    }}
                    className="h-8 md:h-9 px-2 md:px-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-menu-foreground hover:bg-menu-foreground/10 hover:text-menu-foreground"
                  >
                    <Settings2 size={14} className="mr-1" />
                    Preferences
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-menu-foreground/10">
              <div className="flex items-center gap-2">
                <img src={cookieIcon} alt="Cookie" className="w-4 h-4" />
                <h2 id="cookie-consent-title" className="font-montserrat font-extrabold uppercase tracking-[0.18em] text-xs md:text-sm text-menu-foreground">
                  Cookie preferences
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPrefs(false)}
                aria-label="Close"
                className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-menu-foreground/10 transition-colors text-menu-foreground/70"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-xs text-menu-foreground/70 leading-relaxed">
                Choose which categories you allow. You can change this any time from the footer link.
              </p>

              {CATEGORIES.map((cat) => (
                <div
                  key={cat.key}
                  className="flex items-start gap-3 p-3 rounded-lg border border-menu-foreground/10 bg-menu-foreground/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-menu-foreground">{cat.label}</p>
                      {cat.required && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent">
                          Always on
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-menu-foreground/65 mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <Switch
                    checked={cat.required ? true : !!draft[cat.key]}
                    disabled={cat.required}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({ ...d, [cat.key]: v }))
                    }
                    aria-label={`${cat.label} cookies`}
                  />
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-menu-foreground/10 flex flex-wrap items-center justify-between gap-2 bg-menu">
              <Link to="/cookies" className="text-xs text-menu-foreground/60 hover:text-accent">
                Read full Cookie Policy
              </Link>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={rejectAll} className="text-[11px] uppercase tracking-[0.14em] font-semibold border-menu-foreground/20 bg-transparent text-menu-foreground hover:bg-menu-foreground/10 hover:text-menu-foreground">Reject all</Button>
                <Button size="sm" variant="outline" onClick={acceptAll} className="text-[11px] uppercase tracking-[0.14em] font-semibold border-menu-foreground/20 bg-transparent text-menu-foreground hover:bg-menu-foreground/10 hover:text-menu-foreground">Accept all</Button>
                <Button size="sm" onClick={saveCustom} className="text-[11px] uppercase tracking-[0.14em] font-semibold bg-menu-foreground text-menu hover:bg-menu-foreground/90">Save choices</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CookieConsent;
