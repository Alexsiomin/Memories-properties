import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type JourneySnapshot = {
  recentlyViewed?: { id: string; title: string; slug: string | null }[];
  lastSearch?: { region?: string | null; category?: string | null; minPrice?: number | null; maxPrice?: number | null; beds?: number | null } | null;
  referral?: { referrer?: string | null; source?: string | null; medium?: string | null; campaign?: string | null } | null;
  visitCount?: number;
} | null | undefined;

/** Compact, human-readable summary of a lead's on-site journey before they enquired. */
const JourneyContext = ({ journey }: { journey: JourneySnapshot }) => {
  if (!journey) return <span className="text-foreground/30">—</span>;
  const parts: string[] = [];
  if (journey.visitCount) parts.push(`Visit #${journey.visitCount}`);
  if (journey.referral?.source) parts.push(`via ${journey.referral.source}`);
  else if (journey.referral?.referrer) {
    try { parts.push(`from ${new URL(journey.referral.referrer).hostname}`); } catch { /* ignore */ }
  }
  if (journey.lastSearch) {
    const s = journey.lastSearch;
    const bits = [s.region, s.category, s.minPrice || s.maxPrice ? `€${s.minPrice ?? '0'}-${s.maxPrice ?? '∞'}` : null, s.beds ? `${s.beds}+ bds` : null].filter(Boolean);
    if (bits.length) parts.push(`searched ${bits.join(' ')}`);
  }
  return (
    <div className="text-xs space-y-1 max-w-xs">
      {parts.length > 0 && <p className="text-foreground/70">{parts.join(' · ')}</p>}
      {journey.recentlyViewed && journey.recentlyViewed.length > 0 && (
        <p className="text-foreground/50">
          Viewed:{' '}
          {journey.recentlyViewed.slice(0, 3).map((v, i) => (
            <span key={v.id}>
              {i > 0 && ', '}
              <Link to={`/properties/${v.slug ?? v.id}`} target="_blank" className="underline hover:text-foreground">
                {v.title}
              </Link>
            </span>
          ))}
          {journey.recentlyViewed.length > 3 ? ` +${journey.recentlyViewed.length - 3} more` : ''}
        </p>
      )}
      {!parts.length && !journey.recentlyViewed?.length && <span className="text-foreground/30">—</span>}
    </div>
  );
};

type TourRequest = {
  id: string;
  property_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  preferred_date: string;
  preferred_time: string;
  tour_type: string;
  message: string | null;
  status: string;
  created_at: string;
  metadata?: { journey?: JourneySnapshot } | null;
};

type Enquiry = {
  id: string;
  user_id: string | null;
  first_name: string;
  email: string | null;
  phone: string | null;
  property_type: string | null;
  region: string | null;
  message: string | null;
  created_at: string;
  metadata?: { journey?: JourneySnapshot } | null;
};

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  status: string;
  metadata: { source?: string; source_path?: string; journey?: JourneySnapshot } | null;
  created_at: string;
};

export default function AdminEmails() {
  const [rows, setRows] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(true);

  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const [propertyMap, setPropertyMap] = useState<Record<string, { title: string; slug: string }>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tour_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Failed to load', description: error.message });
    const tourRows = (data ?? []) as TourRequest[];
    setRows(tourRows);

    const ids = [...new Set(tourRows.map((r) => r.property_id).filter(Boolean))];
    if (ids.length) {
      const { data: props } = await supabase
        .from('properties')
        .select('id, title, slug')
        .in('id', ids);
      const map: Record<string, { title: string; slug: string }> = {};
      (props ?? []).forEach((p: any) => { map[p.id] = { title: p.title, slug: p.slug }; });
      setPropertyMap(map);
    }
    setLoading(false);
  };

  const loadEnquiries = async () => {
    setEnquiriesLoading(true);
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Failed to load enquiries', description: error.message });
    setEnquiries((data ?? []) as Enquiry[]);
    setEnquiriesLoading(false);
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('type', 'contact')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Failed to load contacts', description: error.message });
    setContacts((data ?? []) as ContactSubmission[]);
    setContactsLoading(false);
  };

  useEffect(() => { load(); loadEnquiries(); loadContacts(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('tour_requests').update({ status }).eq('id', id);
    if (error) return toast({ title: 'Update failed', description: error.message });
    toast({ title: `Marked ${status}` });
    load();
  };

  const counts = {
    pending: rows.filter((r) => r.status === 'pending').length,
    confirmed: rows.filter((r) => r.status === 'confirmed').length,
    declined: rows.filter((r) => r.status === 'declined').length,
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-4xl">Emails & Tour requests</h1>
        <Link to="/admin/emails/templates">
          <Button variant="outline">Edit email templates</Button>
        </Link>
      </div>
      <p className="text-base text-foreground/70 mb-8">
        Every "Tour this home" submission appears here. Notification emails will activate once your sender
        domain is verified.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="border border-foreground/15 p-5">
          <div className="text-xs uppercase tracking-widest text-foreground/60">Pending</div>
          <div className="text-3xl mt-1">{counts.pending}</div>
        </div>
        <div className="border border-foreground/15 p-5">
          <div className="text-xs uppercase tracking-widest text-foreground/60">Confirmed</div>
          <div className="text-3xl mt-1">{counts.confirmed}</div>
        </div>
        <div className="border border-foreground/15 p-5">
          <div className="text-xs uppercase tracking-widest text-foreground/60">Declined</div>
          <div className="text-3xl mt-1">{counts.declined}</div>
        </div>
      </div>

      <h2 className="text-2xl mb-4">Tour requests</h2>
      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-foreground/60">No tour requests yet.</p>
      ) : (
        <div className="border border-foreground/15">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Preferred</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{r.full_name}</TableCell>
                  <TableCell className="text-xs">
                    <div>{r.email}</div>
                    {r.phone && <div className="text-foreground/60">{r.phone}</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {propertyMap[r.property_id] ? (
                      <Link
                        to={`/properties/${propertyMap[r.property_id].slug}`}
                        target="_blank"
                        className="text-accent underline underline-offset-2"
                      >
                        {propertyMap[r.property_id].title}
                      </Link>
                    ) : (
                      <span className="text-foreground/50">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.preferred_date} · {r.preferred_time}
                  </TableCell>
                  <TableCell className="text-xs uppercase">{r.tour_type}</TableCell>
                  <TableCell>
                    <JourneyContext journey={r.metadata?.journey} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        r.status === 'confirmed'
                          ? 'bg-accent/15 text-accent'
                          : r.status === 'declined'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-foreground/10 text-foreground/70'
                      }`}
                    >
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {r.status !== 'confirmed' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'confirmed')}>
                        Confirm
                      </Button>
                    )}
                    {r.status !== 'declined' && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, 'declined')}>
                        Decline
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-12 border border-foreground/15 p-6 bg-foreground/5">
        <h2 className="text-xl mb-2">Notification emails</h2>
        <p className="text-sm text-foreground/70 mb-3">
          To send automatic emails (admin notification + customer confirmation) when someone requests a tour,
          finish setting up your sender email domain. Once verified, I'll wire up the templates and triggers.
        </p>
        <p className="text-xs text-foreground/60">Status: <strong>No sender domain configured</strong></p>
      </div>

      <h2 className="text-2xl mt-12 mb-4">Enquiries</h2>
      {enquiriesLoading ? (
        <p>Loading…</p>
      ) : enquiries.length === 0 ? (
        <p className="text-foreground/60">No enquiries yet.</p>
      ) : (
        <div className="border border-foreground/15">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Property Type</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{e.first_name}</TableCell>
                  <TableCell className="text-xs">{e.email ?? '-'}</TableCell>
                  <TableCell className="text-xs">{e.phone ?? '-'}</TableCell>
                  <TableCell className="text-xs">{e.property_type ?? '-'}</TableCell>
                  <TableCell className="text-xs">{e.region ?? '-'}</TableCell>
                  <TableCell className="text-xs max-w-md whitespace-pre-wrap">{e.message ?? '-'}</TableCell>
                  <TableCell>
                    <JourneyContext journey={e.metadata?.journey} />
                  </TableCell>
                  <TableCell className="text-xs text-foreground/50">{e.user_id ? e.user_id.slice(0, 8) + '…' : 'Guest'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <h2 className="text-2xl mt-12 mb-4">Contact form submissions</h2>
      {contactsLoading ? (
        <p>Loading…</p>
      ) : contacts.length === 0 ? (
        <p className="text-foreground/60">No contact submissions yet.</p>
      ) : (
        <div className="border border-foreground/15">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="text-xs">
                    <div>{c.email}</div>
                    {c.phone && <div className="text-foreground/60">{c.phone}</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{c.metadata?.source ?? '-'}</div>
                    {c.metadata?.source_path && (
                      <div className="text-foreground/60">{c.metadata.source_path}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{c.subject ?? '-'}</TableCell>
                  <TableCell className="text-xs max-w-md whitespace-pre-wrap">{c.message ?? '-'}</TableCell>
                  <TableCell>
                    <JourneyContext journey={c.metadata?.journey} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
