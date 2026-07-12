
CREATE TABLE public.assistant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  system_prompt text NOT NULL DEFAULT '',
  greeting text NOT NULL DEFAULT 'Hello! I''m the SIOMIN Concierge. How can I help you find your next property?',
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  temperature numeric NOT NULL DEFAULT 0.7,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assistant settings"
  ON public.assistant_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins update assistant settings"
  ON public.assistant_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert assistant settings"
  ON public.assistant_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER assistant_settings_updated_at
  BEFORE UPDATE ON public.assistant_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.assistant_settings (singleton, system_prompt, greeting)
VALUES (true, 'You are the SIOMIN Concierge — a warm, discreet, knowledgeable real-estate advisor for SIOMIN, a private property firm focused on Cyprus and select European markets. Help visitors find properties, explain regions, discuss budgets, and request tours. Use the search_properties tool when relevant. Be concise, friendly, and professional.', 'Hello! I''m the SIOMIN Concierge. How can I help you find your next property?');
