import { Eye, MessageSquareText, Reply, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleCardMetricsProps {
  viewCount: number;
  commentCount: number;
  responseCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
}

export function ArticleCardMetrics({
  viewCount,
  commentCount,
  responseCount,
  isRead,
  commentsOpen,
  onCommentClick,
  onResponseClick,
}: ArticleCardMetricsProps) {
  return (
    <div className="flex items-center justify-between mt-3.5">
      {/* Left: read indicator */}
      <div className="flex items-center gap-1.5">
        {isRead && (
          <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground/35">
            <CheckCheck size={13} strokeWidth={2} className="text-primary/40" />
          </span>
        )}
      </div>

      {/* Right: Medium-style metrics — bold rounded icons, no borders */}
      <div className="flex items-center gap-4">
        {viewCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40">
            <Eye size={16} strokeWidth={1.8} />
            <span>{viewCount}</span>
          </span>
        )}

        {responseCount > 0 && (
          <button
            onClick={onResponseClick}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-foreground/60 transition-colors"
          >
            <Reply size={16} strokeWidth={1.8} />
            <span>{responseCount}</span>
          </button>
        )}

        <button
          onClick={onCommentClick}
          className={cn(
            "flex items-center gap-1 text-[11px] transition-colors",
            commentsOpen
              ? "text-foreground/70"
              : "text-muted-foreground/40 hover:text-foreground/60"
          )}
        >
          <MessageSquareText
            size={16}
            strokeWidth={1.8}
            className={cn(
              "transition-colors",
              commentsOpen && "fill-primary/15"
            )}
          />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>
    </div>
  );
}
