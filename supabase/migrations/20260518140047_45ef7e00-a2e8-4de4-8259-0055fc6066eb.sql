CREATE TABLE public.assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_messages_user ON public.assistant_messages(user_id, created_at);

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own assistant messages"
  ON public.assistant_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own assistant messages"
  ON public.assistant_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own assistant messages"
  ON public.assistant_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);