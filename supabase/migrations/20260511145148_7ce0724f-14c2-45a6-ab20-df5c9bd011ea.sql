
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active templates viewable by everyone"
  ON public.email_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins view all templates"
  ON public.email_templates FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert templates"
  ON public.email_templates FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update templates"
  ON public.email_templates FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete templates"
  ON public.email_templates FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER email_templates_set_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.email_templates (key, name, description, subject, body) VALUES
('tour_admin_notification',
 'Tour request — admin notification',
 'Sent to the admin every time a customer requests a tour. Available variables: {{full_name}}, {{email}}, {{phone}}, {{property_id}}, {{preferred_date}}, {{preferred_time}}, {{tour_type}}, {{message}}.',
 'New tour request from {{full_name}}',
 E'A new tour has been requested.\n\nName: {{full_name}}\nEmail: {{email}}\nPhone: {{phone}}\n\nProperty: {{property_id}}\nDate: {{preferred_date}} at {{preferred_time}}\nType: {{tour_type}}\n\nMessage:\n{{message}}'),
('tour_customer_confirmation',
 'Tour request — customer confirmation',
 'Sent to the customer to confirm we received their tour request. Available variables: {{full_name}}, {{preferred_date}}, {{preferred_time}}, {{tour_type}}.',
 'We received your tour request',
 E'Hi {{full_name}},\n\nThanks for requesting a tour with SIOMIN. We have received your request for {{preferred_date}} at {{preferred_time}} ({{tour_type}}) and an advisor will reach out shortly to confirm.\n\nWarm regards,\nThe SIOMIN team');
