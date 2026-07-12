DELETE FROM public.insights WHERE section = 'selectivity';
INSERT INTO public.insights (section, label, value, sub, numeric_value, category, sort_order, is_active) VALUES
  ('selectivity', 'Germasogeia', 'Limassol', 'Seafront villa', 12.4, 'Q1 2026', 1, true),
  ('selectivity', 'Pernera', 'Paralimni', 'Beachfront apartment', 3.8, 'Q1 2026', 2, true),
  ('selectivity', 'Mykonos Town', 'Mykonos', 'Cycladic estate', 18.5, 'Q4 2025', 3, true);