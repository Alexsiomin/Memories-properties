UPDATE public.properties
SET title = TRIM(BOTH ' ' FROM (
  COALESCE(NULLIF(regexp_replace(reference_code, '^[0-9A-Z]*?([A-Z][a-zA-Z]+)$', '\1'), reference_code), '')
  || ' ' || COALESCE(category, '')
))
WHERE title ~ '^[0-9]+ Bedrooms? - .* - For Sale - .+$'
  AND reference_code IS NOT NULL
  AND category IS NOT NULL;