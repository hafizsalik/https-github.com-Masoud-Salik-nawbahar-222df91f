
-- Create vip_posts table for admin-managed content
CREATE TABLE public.vip_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('editorial', 'competition', 'announcement')),
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vip_posts" ON public.vip_posts FOR SELECT USING (true);
CREATE POLICY "Admins can insert vip_posts" ON public.vip_posts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update vip_posts" ON public.vip_posts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vip_posts" ON public.vip_posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vip_posts_updated_at BEFORE UPDATE ON public.vip_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create push_subscriptions table for web push notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add notification triggers that were missing from db
CREATE TRIGGER on_like_notify AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.handle_like_notification();
CREATE TRIGGER on_comment_notify AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notification();
CREATE TRIGGER on_follow_notify AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();
