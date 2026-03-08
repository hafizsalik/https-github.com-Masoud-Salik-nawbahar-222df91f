import { MessageCircle, CheckCheck } from "lucide-react";
import { cn, toPersianNumber } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionDetailsModal } from "./ReactionDetailsModal";
import { REACTION_EMOJIS, type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";
import { useState } from "react";

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
  commentCount,
  reactionCount,
  isRead,
  commentsOpen,
  onCommentClick,
  reactionSummary,
  onReact,
  onReactionHover,
}: ArticleCardMetricsProps) {
  const { topTypes, totalCount, reactorNames, userReaction } = reactionSummary;
  const [showReactionDetails, setShowReactionDetails] = useState(false);

  // Use fetched totalCount if available, otherwise fall back to denormalized count
  const displayCount = totalCount > 0 ? totalCount : reactionCount;
  const displayTopTypes: ReactionKey[] = topTypes.length > 0
    ? topTypes
    : (reactionCount > 0 ? ["like"] : []);

  const buildReactorText = () => {
    if (displayCount === 0) return null;

    // قبل از fetch کامل، فقط شمارش را نشان بده
    if (totalCount === 0 && reactionCount > 0) {
      return `${toPersianNumber(reactionCount)} نفر`;
    }

    const names: string[] = [];
    if (userReaction) names.push("شما");
    reactorNames.forEach((name) => {
      if (!names.includes(name)) names.push(name);
    });

    const displayNames = names.slice(0, 3);
    const remaining = Math.max(displayCount - displayNames.length, 0);

    if (displayNames.length === 0) return `${toPersianNumber(displayCount)} نفر`;

    let text = displayNames.join("، ");
    if (remaining > 0) text += ` و ${toPersianNumber(remaining)} نفر دیگر`;
    return text;
  };

  const reactorText = buildReactorText();

  const handleReactionSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReactionHover?.();
    setShowReactionDetails(true);
  };

  return (
    <>
      <div className="mt-3 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onCommentClick}
              className={cn(
                "flex items-center gap-1 text-[12px] transition-colors",
                commentsOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle size={14} strokeWidth={1.5} />
              <span className="text-[11.5px]">
                {commentCount > 0 ? `${toPersianNumber(commentCount)} نظر` : "نظر"}
              </span>
            </button>

            <ReactionPicker 
              userReaction={userReaction} 
              onReact={onReact}
              onHover={onReactionHover}
            />
          </div>

          {/* Reaction summary — right side */}
          {displayCount > 0 && (
            <button
              onClick={handleReactionSummaryClick}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              {displayTopTypes.length > 0 && (
                <div className="flex items-center -space-x-0.5">
                  {displayTopTypes.slice(0, 2).map((type) => (
                    <span
                      key={type}
                      className="text-[13px] leading-none"
                      role="img"
                      aria-label={type}
                    >
                      {REACTION_EMOJIS[type]}
                    </span>
                  ))}
                </div>
              )}
              {reactorText && (
                <span className="text-[10px] text-muted-foreground/50 truncate max-w-[140px] mr-1">
                  {reactorText}
                </span>
              )}
            </button>
          )}

          {isRead && (
            <CheckCheck size={12} strokeWidth={2} className="text-primary/35" />
          )}
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
