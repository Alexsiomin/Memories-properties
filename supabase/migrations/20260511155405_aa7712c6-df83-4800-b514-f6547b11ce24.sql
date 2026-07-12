ALTER TABLE public.clients
  ADD COLUMN min_size NUMERIC,
  ADD COLUMN min_plot_size NUMERIC,
  ADD COLUMN must_have_features TEXT[] NOT NULL DEFAULT '{}';