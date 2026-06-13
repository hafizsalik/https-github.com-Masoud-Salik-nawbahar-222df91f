
-- 1) Add auto_hidden flag on comments
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS auto_hidden boolean NOT NULL DEFAULT false;

-- 2) Trigger: on new comment report, ack the reporter + auto-hide if >=3 unique reporters in 24h
CREATE OR REPLACE FUNCTION public.handle_comment_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unique_reporters integer;
  v_article_id uuid;
BEGIN
  -- Acknowledge the reporter
  INSERT INTO public.notifications (user_id, actor_id, type, article_id)
  SELECT NEW.reporter_id, NEW.reporter_id, 'report_ack', c.article_id
  FROM public.comments c
  WHERE c.id = NEW.comment_id;

  -- Count unique reporters in the last 24h for this comment
  SELECT COUNT(DISTINCT reporter_id) INTO v_unique_reporters
  FROM public.reported_comments
  WHERE comment_id = NEW.comment_id
    AND created_at >= now() - interval '24 hours';

  IF v_unique_reporters >= 3 THEN
    UPDATE public.comments
      SET auto_hidden = true
      WHERE id = NEW.comment_id AND auto_hidden = false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_report_handle ON public.reported_comments;
CREATE TRIGGER trg_comment_report_handle
AFTER INSERT ON public.reported_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_report();

-- 3) Article report ack — extend existing trigger by also notifying the reporter
CREATE OR REPLACE FUNCTION public.handle_article_report_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify admins
  INSERT INTO public.notifications (user_id, actor_id, type, article_id)
  SELECT ur.user_id, NEW.reporter_id, 'report', NEW.article_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
    AND ur.user_id <> NEW.reporter_id;

  -- Acknowledge the reporter
  INSERT INTO public.notifications (user_id, actor_id, type, article_id)
  VALUES (NEW.reporter_id, NEW.reporter_id, 'report_ack', NEW.article_id);

  RETURN NEW;
END;
$$;
