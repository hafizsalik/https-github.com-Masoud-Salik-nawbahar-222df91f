
-- 1) article_dismissals table
CREATE TABLE public.article_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  article_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX idx_article_dismissals_user ON public.article_dismissals(user_id);

ALTER TABLE public.article_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
  ON public.article_dismissals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissals"
  ON public.article_dismissals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissals"
  ON public.article_dismissals FOR DELETE
  USING (auth.uid() = user_id);

-- 2) Trigger: on report insert, notify all admins
CREATE OR REPLACE FUNCTION public.handle_article_report_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, article_id)
  SELECT ur.user_id, NEW.reporter_id, 'report', NEW.article_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND ur.user_id <> NEW.reporter_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_article_report_notify ON public.reported_articles;
CREATE TRIGGER trg_article_report_notify
  AFTER INSERT ON public.reported_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_article_report_notification();
