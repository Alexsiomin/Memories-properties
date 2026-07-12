ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS preferred_categories text[] NOT NULL DEFAULT '{}';

UPDATE public.clients
  SET preferred_categories = ARRAY[preferred_category]
  WHERE preferred_category IS NOT NULL
    AND preferred_category <> ''
    AND (preferred_categories IS NULL OR array_length(preferred_categories, 1) IS NULL);