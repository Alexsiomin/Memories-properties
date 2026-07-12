
ALTER TABLE public.developers
  ADD COLUMN feed_format TEXT NOT NULL DEFAULT 'auto';
