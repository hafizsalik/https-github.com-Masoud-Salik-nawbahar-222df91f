UPDATE public.reactions SET reaction_type = 'like' WHERE reaction_type = 'liked';
DELETE FROM public.reactions WHERE reaction_type = 'disliked';
ALTER TABLE public.reactions ADD CONSTRAINT reactions_reaction_type_check CHECK (reaction_type = ANY (ARRAY['like'::text, 'clap'::text, 'love'::text, 'insightful'::text, 'fire'::text]));