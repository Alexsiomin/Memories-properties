-- Restrict anonymous access to sensitive assistant_settings columns.
-- Anonymous visitors only need greeting + enabled for the concierge widget;
-- system_prompt / model / temperature must stay private.
REVOKE ALL ON public.assistant_settings FROM anon;
GRANT SELECT (singleton, greeting, enabled) ON public.assistant_settings TO anon;