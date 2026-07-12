CREATE TABLE public.assistant_memory (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_memory TO authenticated;
GRANT ALL ON public.assistant_memory TO service_role;
ALTER TABLE public.assistant_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own assistant memory" ON public.assistant_memory FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_assistant_memory_updated_at BEFORE UPDATE ON public.assistant_memory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();