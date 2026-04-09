-- Accent+case insensitive patient search via generated column + GIN trigram index.
--
-- Problem: Postgres ilike is case-insensitive but NOT accent-insensitive, so a search
-- for "garcia" does not match "García". For Argentine names this is almost every patient.
--
-- Fix: normalize at write time (unaccent + lower) via a STORED generated column, then
-- ilike against that. A GIN trigram index makes leading-wildcard ilike fast.

-- 1. Required extensions (idempotent).
--    unaccent strips diacritics (García -> Garcia).
--    pg_trgm enables trigram GIN indexes that accelerate '%foo%' ilike queries.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Immutable wrapper around unaccent so it can be used inside generated columns.
--    The built-in unaccent() is declared STABLE (its dictionary can theoretically
--    change at runtime), which disqualifies it from STORED generated column
--    expressions. Wrapping it in a SQL function that names the dictionary explicitly
--    lets us mark it IMMUTABLE, satisfying Postgres' requirements for GENERATED.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

-- 3. Generated column: pre-normalized searchable text.
--    lower() handles case; immutable_unaccent() handles diacritics.
--    coalesce() prevents NULL inputs from wiping the whole concatenation.
--    STORED means it is physically written on each insert/update, so reads are
--    as fast as a regular column.
ALTER TABLE public.clinic_patients
  ADD COLUMN IF NOT EXISTS search_text text
  GENERATED ALWAYS AS (
    lower(public.immutable_unaccent(
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '')  || ' ' ||
      coalesce(dni, '')
    ))
  ) STORED;

-- 4. GIN trigram index so '%foo%' ilike queries can use an index instead of seq scan.
--    Without this, every search would be a full table scan, which matters once a
--    clinic grows past a few thousand patients.
CREATE INDEX IF NOT EXISTS idx_clinic_patients_search_text_trgm
  ON public.clinic_patients
  USING gin (search_text gin_trgm_ops);
