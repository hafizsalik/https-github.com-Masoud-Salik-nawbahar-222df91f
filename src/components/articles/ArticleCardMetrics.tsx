import { Bookmark, MessageCircle, Share, MoreHorizontal, CheckCheck } from "lucide-react";
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
  commentCount,
  isRead,
  commentsOpen,
  tag,
  onCommentClick,
}: ArticleCardMetricsProps) {
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="mt-4 pt-2">
      <div className="flex items-center justify-between">
        {/* Left actions */}
        <div className="flex items-center gap-5">
          <button
            onClick={onCommentClick}
            className={cn(
              "flex items-center gap-1.5 text-[12px] transition-colors",
              commentsOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>

          <button
            onClick={stop}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share size={15} strokeWidth={1.5} />
          </button>

          {isRead && (
            <CheckCheck size={13} strokeWidth={2} className="text-primary/40" />
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {tag && (
            <span className="text-muted-foreground/50 text-[10px]">
              {tag}
            </span>
          )}
          <button
            onClick={stop}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bookmark size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={stop}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
