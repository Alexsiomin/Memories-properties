ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS furnished text,
  ADD COLUMN IF NOT EXISTS energy_rating text,
  ADD COLUMN IF NOT EXISTS available_from date,
  ADD COLUMN IF NOT EXISTS deposit_value numeric,
  ADD COLUMN IF NOT EXISTS floor integer,
  ADD COLUMN IF NOT EXISTS total_floors integer,
  ADD COLUMN IF NOT EXISTS orientation text,
  ADD COLUMN IF NOT EXISTS pet_friendly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS heating text,
  ADD COLUMN IF NOT EXISTS cooling text,
  ADD COLUMN IF NOT EXISTS condition text;