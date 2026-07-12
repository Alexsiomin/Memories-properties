-- Add a separate column for the external feed reference, so our reference_code stays our own unique system ID.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS external_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS properties_external_ref_per_developer
  ON public.properties (developer_id, external_ref)
  WHERE external_ref IS NOT NULL;

-- Backfill: for rows that were imported from a feed (have a developer_id) and whose
-- reference_code looks like an external code (not our generated AAAA-99999 format),
-- move it into external_ref and clear reference_code so the trigger can mint a fresh one.
UPDATE public.properties
SET external_ref = reference_code,
    reference_code = NULL
WHERE developer_id IS NOT NULL
  AND reference_code IS NOT NULL
  AND reference_code !~ '^[A-Z]{4}-[0-9]{5}$';
