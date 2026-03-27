import { useMemo, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Flame } from "lucide-react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { cn, toPersianNumber } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { SuggestedWriters } from "@/components/profile/SuggestedWriters";

export default function Explore() {
  const { articles } = usePublishedArticles();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<"smart" | "popular" | "newest" | "week">("smart");

  // ⚡ debounce (smooth typing)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // 🔥 smart ranking
  const ranked = useMemo(() => {
    let list = [...articles];

    const score = (a: any) => {
      let s = 0;
      const q = debounced.toLowerCase();

      if (!q) return 0;

      if (a.title?.toLowerCase().includes(q)) s += 5;
      if (a.content?.toLowerCase().includes(q)) s += 2;
      if (a.tags?.some((t: string) => t.toLowerCase().includes(q))) s += 3;
      if (a.author?.display_name?.toLowerCase().includes(q)) s += 2;

      // engagement boost
      s += ((a.reaction_count || 0) + (a.comment_count || 0)) * 0.01;

      return s;
    };

    if (debounced) {
      list = list
        .map(a => ({ ...a, _score: score(a) }))
        .filter(a => a._score > 0)
        .sort((a, b) => b._score - a._score);
    }

    // 📊 sorting layer (LinkedIn style)
    if (sort === "popular") {
      list.sort((a, b) =>
        ((b.reaction_count || 0) + (b.comment_count || 0)) -
        ((a.reaction_count || 0) + (a.comment_count || 0))
      );
    }

    if (sort === "newest") {
      list.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    if (sort === "week") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list
        .filter(a => new Date(a.created_at).getTime() > weekAgo)
        .sort((a, b) =>
          ((b.reaction_count || 0) + (b.comment_count || 0)) -
          ((a.reaction_count || 0) + (a.comment_count || 0))
        );
    }

    return list.slice(0, 50);
  }, [articles, debounced, sort]);

  const trending = useMemo(() => {
    return [...articles]
      .sort((a, b) =>
        ((b.reaction_count || 0) + (b.comment_count || 0) + (b.view_count || 0)) -
        ((a.reaction_count || 0) + (a.comment_count || 0) + (a.view_count || 0))
      )
      .slice(0, 8);
  }, [articles]);

  const hasSearch = Boolean(debounced);

  return (
    <AppLayout>
      <SEOHead title="کاوش" description="جستجوی حرفه‌ای مقالات نوبهار" />

      <div className="px-5 pt-4 space-y-4">

        {/* 🔍 Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/40 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* ⚙️ Filters (LinkedIn style) */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {[
            { id: "smart", label: "هوشمند" },
            { id: "popular", label: "محبوب‌ترین" },
            { id: "newest", label: "جدیدترین" },
            { id: "week", label: "این هفته" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSort(f.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs whitespace-nowrap",
                sort === f.id
                  ? "bg-foreground text-background"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 📊 Results */}
        {hasSearch ? (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              {ranked.length > 0
                ? `${toPersianNumber(ranked.length)} نتیجه`
                : "نتیجه‌ای یافت نشد"}
            </p>

            <div className="divide-y">
              {ranked.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 🔥 Trending */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame size={14} />
                <span className="text-xs font-semibold text-muted-foreground">
                  پرطرفدارترین‌ها
                </span>
              </div>

              <div className="divide-y">
                {trending.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>

            <SuggestedWriters />
          </>
        )}
      </div>
    </AppLayout>
  );
}
