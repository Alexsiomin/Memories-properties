ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS share_title text,
  ADD COLUMN IF NOT EXISTS share_description text,
  ADD COLUMN IF NOT EXISTS share_image text;