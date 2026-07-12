ALTER TABLE public.properties ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
CREATE INDEX idx_properties_client_id ON public.properties(client_id);