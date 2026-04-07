import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useBookmark(articleId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !articleId) return;
    supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .maybeSingle()
      .then(({ data }) => {
        setIsBookmarked(!!data);
      });
  }, [user, articleId]);

  const toggle = useCallback(async () => {
    if (!user) {
      toast({ title: "برای ذخیره باید وارد شوید", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (isBookmarked) {
        await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("article_id", articleId);
        setIsBookmarked(false);
        toast({ title: "از ذخیره‌شده‌ها حذف شد" });
      } else {
        await supabase.from("bookmarks").insert({ user_id: user.id, article_id: articleId });
        setIsBookmarked(true);
        toast({ title: "✅ ذخیره شد" });
      }
    } catch {
      toast({ title: "خطا", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, articleId, isBookmarked, toast]);

  return { isBookmarked, loading, toggle };
}
