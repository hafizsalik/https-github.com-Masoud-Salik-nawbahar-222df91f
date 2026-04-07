import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { Clock } from "lucide-react";

interface RecentArticle {
  id: string;
  title: string;
  cover_image_url: string | null;
}

export function ContinueReading() {
  const [articles, setArticles] = useState<RecentArticle[]>([]);

  useEffect(() => {
    // Get recently viewed article IDs from localStorage
    const recentIds: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("article_viewed_")) {
        const id = key.replace("article_viewed_", "");
        recentIds.push(id);
      }
    }

    if (recentIds.length === 0) return;

    // Take last 5 viewed
    const latestIds = recentIds.slice(-5);

    supabase
      .from("articles")
      .select("id, title, cover_image_url")
      .in("id", latestIds)
      .eq("status", "published")
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setArticles(data);
        }
      });
  }, []);

  if (articles.length === 0) return null;

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center gap-1.5 mb-3">
        <Clock size={13} strokeWidth={1.5} className="text-muted-foreground/40" />
        <span className="text-[12px] font-semibold text-muted-foreground/50">ادامه مطالعه</span>
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className="flex-shrink-0 w-[200px] group"
          >
            <div className="rounded-lg overflow-hidden bg-muted h-[80px] mb-1.5">
              {article.cover_image_url ? (
                <img
                  src={article.cover_image_url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5" />
              )}
            </div>
            <p className="text-[12px] font-medium text-foreground line-clamp-2 leading-[1.6]">
              {article.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
