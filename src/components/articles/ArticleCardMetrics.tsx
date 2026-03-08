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

  const displayCount = totalCount > 0 ? totalCount : reactionCount;
  const displayTopTypes: ReactionKey[] = topTypes.length > 0
    ? topTypes.slice(0, 2)
    : (reactionCount > 0 ? ["like"] : []);

  // Build the text that appears NEXT to the reaction button
  // No reaction yet → "پسند"
  // Has reactions → "شما، احمد سالک و ۱۰۰ نفر دیگر" with 1-2 emojis
  const buildReactionLabel = (): { emojis: ReactionKey[]; text: string } => {
    if (displayCount === 0) {
      return { emojis: [], text: "پسند" };
    }

    // Before full fetch, show count
    if (totalCount === 0 && reactionCount > 0) {
      return { emojis: displayTopTypes, text: `${toPersianNumber(reactionCount)} نفر` };
    }

    const names: string[] = [];
    if (userReaction) names.push("شما");
    reactorNames.forEach((n) => { if (!names.includes(n)) names.push(n); });

    if (names.length === 0 && displayCount > 0) {
      return { emojis: displayTopTypes, text: `${toPersianNumber(displayCount)} نفر` };
    }

    const shown = names.slice(0, 2);
    const remaining = Math.max(displayCount - shown.length, 0);
    let text = shown.join("، ");
    if (remaining > 0) text += ` و ${toPersianNumber(remaining)} نفر دیگر`;

    return { emojis: displayTopTypes, text };
  };

  const { emojis, text: reactionText } = buildReactionLabel();

  const handleSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (displayCount > 0) {
      onReactionHover?.();
      setShowReactionDetails(true);
    }
  };

  return (
    <>
      <div className="mt-3 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Comment button */}
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

            {/* Reaction: picker button + inline summary */}
            <div className="flex items-center gap-1.5">
              <ReactionPicker
                userReaction={userReaction}
                onReact={onReact}
                onHover={onReactionHover}
                hideLabel
              />

              {/* Emoji badges + text label (replaces "پسند") */}
              <button
                onClick={displayCount > 0 ? handleSummaryClick : (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onReact("like"); }}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity min-w-0"
              >
                {emojis.length > 0 && (
                  <div className="flex items-center -space-x-1 flex-shrink-0">
                    {emojis.map((type) => (
                      <span
                        key={type}
                        className="w-[16px] h-[16px] flex items-center justify-center rounded-full text-[10px] leading-none border-[1.5px] border-background"
                        style={{ background: "hsl(var(--muted))" }}
                        role="img"
                        aria-label={type}
                      >
                        {REACTION_EMOJIS[type]}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-[11px] text-muted-foreground/60 truncate max-w-[150px]">
                  {reactionText}
                </span>
              </button>
            </div>
          </div>

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
