-- Add a metadata JSONB column to enquiries and tour_requests, mirroring the
-- pattern already used on contact_submissions. This stores an optional,
-- consent-gated snapshot of the visitor's on-site journey (recently viewed
-- properties, last search filters, referral source, visit count) captured
-- client-side and attached at submission time — giving the team useful
-- context on each lead without any new tracking beyond what visitors have
-- already consented to via the cookie banner.

alter table public.enquiries
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.tour_requests
  add column if not exists metadata jsonb not null default '{}'::jsonb;
