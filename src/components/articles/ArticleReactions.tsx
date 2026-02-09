import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleReactionsProps {
  userReaction: "liked" | "disliked" | null;
  likedCount: number;
  dislikedCount: number;
  onReaction: (type: "liked" | "disliked") => void;
}

export function ArticleReactions({ 
  userReaction, 
  onReaction 
}: ArticleReactionsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-8 my-8 border-t border-b border-border">
      <p className="text-sm text-muted-foreground ml-2">آیا این مقاله مفید بود؟</p>
      <button
        onClick={() => onReaction("liked")}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 text-sm btn-press",
          userReaction === "liked"
            ? "bg-primary/10 border-primary text-primary shadow-sm"
            : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
        )}
        aria-label="مفید بود"
      >
        <ThumbsUp size={16} strokeWidth={1.5} fill={userReaction === "liked" ? "currentColor" : "none"} />
        <span>مفید بود</span>
      </button>
      <button
        onClick={() => onReaction("disliked")}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 text-sm btn-press",
          userReaction === "disliked"
            ? "bg-muted border-muted-foreground/30 text-muted-foreground"
            : "border-border text-muted-foreground hover:border-muted-foreground/50"
        )}
        aria-label="مفید نبود"
      >
        <ThumbsDown size={16} strokeWidth={1.5} fill={userReaction === "disliked" ? "currentColor" : "none"} />
        <span>مفید نبود</span>
      </button>
    </div>
  );
}