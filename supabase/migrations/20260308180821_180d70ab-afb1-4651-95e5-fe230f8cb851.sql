CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  message text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (even anonymous) can submit a contact message
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

-- Only admins can view messages
CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));