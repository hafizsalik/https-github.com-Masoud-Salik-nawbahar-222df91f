import { Eye, MessageCircle, ChevronDown, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleCardMetricsProps {
  viewCount: number;
  commentCount: number;
  responseCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  tag?: string | null;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
}

export function ArticleCardMetrics({
  viewCount,
  commentCount,
  isRead,
  commentsOpen,
  tag,
  onCommentClick,
}: ArticleCardMetricsProps) {
  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Eye size={13} strokeWidth={1.6} />
            {viewCount > 0 && <span>{viewCount}</span>}
          </span>

          <button
            onClick={onCommentClick}
            className={cn(
              "flex items-center gap-1 text-[11px] transition-colors",
              commentsOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground/70"
            )}
          >
            <MessageCircle size={13} strokeWidth={1.6} />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="text-muted-foreground hover:text-foreground/70 transition-colors"
            aria-label="بیشتر"
          >
            <ChevronDown size={14} strokeWidth={1.6} />
          </button>

          {isRead && (
            <CheckCheck size={11} strokeWidth={2} className="text-primary/50" />
          )}
        </div>

        {tag && (
          <span className="text-muted-foreground/60 text-[10px] font-medium">
            {tag}
          </span>
        )}
      </div>
    </div>
  );
}
