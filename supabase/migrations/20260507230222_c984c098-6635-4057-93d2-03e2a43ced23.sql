UPDATE public.properties
SET price = 'Price on request'
WHERE (price_value = 0 OR price IS NULL OR trim(price) = '');