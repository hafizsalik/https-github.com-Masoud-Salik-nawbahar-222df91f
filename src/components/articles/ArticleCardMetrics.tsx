import { CheckCheck } from "lucide-react";
import { cn, toPersianNumber } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionDetailsModal } from "./ReactionDetailsModal";
import { type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";
import { useState } from "react";

// Inline SVG icons for card metrics — matching reference style
function ThumbsUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" className={className} fill="currentColor">
      <path d="M22.773,7.721A4.994,4.994,0,0,0,19,6H15.011l.336-2.041A3.037,3.037,0,0,0,9.626,2.122L8,5.417V21H18.3a5.024,5.024,0,0,0,4.951-4.3l.705-5A4.994,4.994,0,0,0,22.773,7.721Z"/>
      <path d="M0,11v5a5.006,5.006,0,0,0,5,5H6V6H5A5.006,5.006,0,0,0,0,11Z"/>
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" className={className} fill="currentColor">
      <path d="m12 1c-7.71 0-11 3.29-11 11s3.29 11 11 11c3.702 0 9.347-.483 9.586-.504.486-.042.871-.428.911-.914.021-.249.503-6.139.503-9.582 0-7.71-3.29-11-11-11zm-4.5 12.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm4.5 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm4.5 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z"/>
    </svg>
  );
}

function ViewIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" className={className} fill="currentColor">
      <path d="M21,12.424V11A9,9,0,0,0,3,11v1.424A5,5,0,0,0,5,22a2,2,0,0,0,2-2V14a2,2,0,0,0-2-2V11a7,7,0,0,1,14,0v1a2,2,0,0,0-2,2v6H14a1,1,0,0,0,0,2h5a5,5,0,0,0,2-9.576ZM5,20H5a3,3,0,0,1,0-6Zm14,0V14a3,3,0,0,1,0,6Z"/>
    </svg>
  );
}

interface ArticleCardMetricsProps {
  articleId: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  responseCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
  reactionSummary: ReactionSummary;
  onReact: (type: ReactionKey) => void;
  onReactionHover?: () => void;
}

export function ArticleCardMetrics({
  articleId,
  viewCount,
  commentCount,
  reactionCount,
  isRead,
  commentsOpen,
  onCommentClick,
  reactionSummary,
  onReact,
  onReactionHover,
}: ArticleCardMetricsProps) {
  const { totalCount, userReaction } = reactionSummary;
  const [showReactionDetails, setShowReactionDetails] = useState(false);

  const displayReactionCount = totalCount > 0 ? totalCount : reactionCount;
  const displayCommentCount = commentCount || 0;
  const displayViewCount = viewCount || 0;

  const handleSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (displayReactionCount > 0) {
      onReactionHover?.();
      setShowReactionDetails(true);
    }
  };

  // Icon color: #000 at 25% opacity
  const iconStyle = "opacity-25 dark:invert";

  return (
    <>
      <div className="mt-3 pb-3">
        <div className="flex items-center justify-between" style={{ direction: "rtl" }}>
          {/* Right side: reaction + comment + view */}
          <div className="flex items-center gap-5">
            {/* Reactions */}
            <button
              onClick={handleSummaryClick}
              onMouseEnter={onReactionHover}
              className="flex items-center gap-1 transition-colors"
            >
              <ThumbsUpIcon className={cn(iconStyle, userReaction && "opacity-70 text-primary")} />
              {displayReactionCount > 0 && (
                <span className="text-[13px]" style={{ color: "#888888" }}>
                  {toPersianNumber(displayReactionCount)} هزار
                </span>
              )}
            </button>

            {/* Comments */}
            <button
              onClick={onCommentClick}
              className="flex items-center gap-1 transition-colors"
            >
              <CommentIcon className={cn(iconStyle, commentsOpen && "opacity-60")} />
              {displayCommentCount > 0 && (
                <span className="text-[13px]" style={{ color: "#888888" }}>
                  {toPersianNumber(displayCommentCount)} هزار
                </span>
              )}
            </button>

            {/* Views */}
            <div className="flex items-center gap-1">
              <ViewIcon className={iconStyle} />
              {displayViewCount > 0 && (
                <span className="text-[13px]" style={{ color: "#888888" }}>
                  {toPersianNumber(displayViewCount)}
                </span>
              )}
            </div>
          </div>

          {isRead && <CheckCheck size={12} strokeWidth={2} className="text-primary/35" aria-label="خوانده شده" />}
        </div>
      </div>

      <ReactionDetailsModal
        articleId={articleId}
        isOpen={showReactionDetails}
        onClose={() => setShowReactionDetails(false)}
      />
    </>
  );
}
