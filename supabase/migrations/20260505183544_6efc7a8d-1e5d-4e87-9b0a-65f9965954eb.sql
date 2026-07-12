DELETE FROM public.insights WHERE section = 'selectivity';
INSERT INTO public.insights (section, label, value, sub, sort_order, is_active) VALUES
  ('selectivity', 'District', 'Germasogeia', NULL, 1, true),
  ('selectivity', 'City', 'Limassol', NULL, 2, true),
  ('selectivity', 'Type', 'Seafront villa', NULL, 3, true),
  ('selectivity', 'Price', '€12.4M', NULL, 4, true),
  ('selectivity', 'Date', 'Q1 2026', NULL, 5, true);