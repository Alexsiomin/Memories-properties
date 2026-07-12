UPDATE public.properties
SET
  location = regexp_replace(location, '\mPafos\M', 'Paphos', 'gi'),
  region   = regexp_replace(region,   '\mPafos\M', 'Paphos', 'gi'),
  city     = regexp_replace(city,     '\mPafos\M', 'Paphos', 'gi'),
  title    = regexp_replace(title,     '\mPafos\M', 'Paphos', 'gi')
WHERE location ~* '\mPafos\M'
   OR region   ~* '\mPafos\M'
   OR city     ~* '\mPafos\M'
   OR title    ~* '\mPafos\M';