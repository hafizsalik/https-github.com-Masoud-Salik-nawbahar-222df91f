-- Add like_count to comments table
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;

-- Create comment_likes table for tracking likes on comments
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comment_likes_unique UNIQUE (comment_id, user_id)
);

-- Enable RLS for comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for comment_likes
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Add linkedin_url to profiles (for social links)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Change the reactions system from دوست داشتم/دوست نداشتم to مفید بود/مفید نبود
-- Note: reaction_type already accepts any string, so we just need to update the UI

-- Create reported_comments table for moderation
CREATE TABLE IF NOT EXISTS public.reported_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reported_comments_unique UNIQUE (comment_id, reporter_id)
);

-- Enable RLS for reported_comments
ALTER TABLE public.reported_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for reported_comments
CREATE POLICY "Admins can view reported comments" ON public.reported_comments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can report comments" ON public.reported_comments FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can delete reports" ON public.reported_comments FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));