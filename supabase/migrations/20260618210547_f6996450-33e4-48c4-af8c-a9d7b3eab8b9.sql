UPDATE public.properties
SET title = regexp_replace(title, '^Zephyros VIllage 3', 'Zephyros Village 3')
WHERE title LIKE 'Zephyros VIllage 3%';