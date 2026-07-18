import { ReactNode, Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import RouteLoader from '@/components/RouteLoader';
import { useAuth } from '@/hooks/use-auth';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Building2, Plus, Upload, HelpCircle, BarChart3, Users, Shield, UserCircle, Mail, Contact, Bot, Type, Search, Lock, Newspaper, Pencil, LineChart } from 'lucide-react';

export const ADMIN_NAV = [
  { to: '/admin', title: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/properties', title: 'Manage properties', icon: Building2 },
  { to: '/admin/properties/new', title: 'Add a listing', icon: Plus },
  { to: '/admin/projects/new', title: 'Add project (bulk)', icon: Plus },
  { to: '/admin/projects/edit', title: 'Edit project (bulk)', icon: Pencil },
  { to: '/admin/projects/new?sold=1', title: 'Add sold project (bulk)', icon: Plus },
  { to: '/admin/sold', title: 'Sold properties', icon: Building2 },
  { to: '/admin/properties#import', title: 'Import from XML', icon: Upload },
  { to: '/admin/clients', title: 'Clients', icon: Contact },
  { to: '/admin/faqs', title: 'Manage FAQs', icon: HelpCircle },
  { to: '/admin/blog', title: 'Manage blog', icon: Newspaper },
  { to: '/admin/brand-words', title: 'Brand words', icon: Type },
  { to: '/admin/insights', title: 'Manage insights', icon: BarChart3 },
  { to: '/admin/developers', title: 'Manage developers', icon: Users },
  { to: '/admin/emails', title: 'Emails & tours', icon: Mail },
  { to: '/admin/analytics', title: 'Analytics', icon: LineChart },
  { to: '/admin/assistant', title: 'AI Concierge', icon: Bot },
  { to: '/admin/seo', title: 'SEO manager', icon: Search },
  { to: '/admin/auth-modal', title: 'Sign-in popup', icon: Lock },
  { to: '/admin/users-list', title: 'Users', icon: UserCircle },
  { to: '/admin/users', title: 'Manage admins', icon: Shield },
];

const LAST_VISIT_KEY = 'mp:lastEmailsVisit';

function useUnreadEmails() {
  const [count, setCount] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    const isOnEmails = pathname === '/admin/emails' || pathname.startsWith('/admin/emails/');
    if (isOnEmails) {
      localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
      setCount(0);
      return;
    }

    const lastVisit = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0', 10);
    const since = new Date(lastVisit || 0).toISOString();

    let cancelled = false;
    (async () => {
      const [tours, enquiries, contacts] = await Promise.all([
        supabase.from('tour_requests').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('enquiries').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('type', 'contact').gte('created_at', since),
      ]);
      if (cancelled) return;
      const total = (tours.count ?? 0) + (enquiries.count ?? 0) + (contacts.count ?? 0);
      setCount(total);
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  return count;
}

export default function AdminLayout({ children }: { children?: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { pathname, hash, search } = useLocation();
  const [searchParams] = useSearchParams();
  const unreadEmails = useUnreadEmails();

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) {
    if (searchParams.get('auth') === '1') {
      return <div className="min-h-screen" />;
    }
    const next = new URLSearchParams(searchParams);
    next.set('auth', '1');
    return <Navigate to={`${pathname}?${next.toString()}${hash}`} replace />;
  }
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  const currentPath = pathname + search + hash;
  const isItemActive = (to: string, exact?: boolean) => {
    if (to.includes('#')) return currentPath === to;
    if (to.includes('?')) return pathname + search === to;
    if (exact) return pathname === to;
    if (search) return false;
    return pathname === to || pathname.startsWith(to + '/');
  };

  return (
    <SidebarProvider>
      <div className="light-panel flex w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden">
        <Sidebar collapsible="icon">
          <SidebarContent className="sticky top-0 max-h-screen overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ADMIN_NAV.map((c) => {
                    const active = isItemActive(c.to, c.exact);
                    const isEmails = c.to === '/admin/emails';
                    return (
                      <SidebarMenuItem key={c.to}>
                        <SidebarMenuButton asChild tooltip={c.title} isActive={active}>
                          <NavLink to={c.to} className="flex items-center gap-2 text-lg">
                            <c.icon className="h-4 w-4" />
                            <span className="relative">
                              {c.title}
                              {isEmails && unreadEmails > 0 && (
                                <span className="absolute -top-1 -right-2.5 w-2 h-2 rounded-full bg-accent" />
                              )}
                            </span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="h-12 flex items-center border-b border-foreground/10 shrink-0">
            <SidebarTrigger className="ml-2" />
          </header>
          <main className="flex-1 overflow-y-auto">
            <Suspense fallback={<RouteLoader />}>
              {children ?? <Outlet />}
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
