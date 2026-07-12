ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'sale';