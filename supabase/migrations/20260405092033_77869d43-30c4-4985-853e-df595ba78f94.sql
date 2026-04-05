CREATE TABLE public.reported_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, article_id)
);

ALTER TABLE public.reported_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report articles" ON public.reported_articles
  FOR INSERT TO public WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reported articles" ON public.reported_articles
  FOR SELECT TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete article reports" ON public.reported_articles
  FOR DELETE TO public USING (has_role(auth.uid(), 'admin'));