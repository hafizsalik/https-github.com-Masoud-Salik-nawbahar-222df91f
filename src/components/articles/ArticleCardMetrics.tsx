import { CheckCheck } from "lucide-react";
import { cn, toPersianNumber } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionDetailsModal } from "./ReactionDetailsModal";
import { type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";
import { useState } from "react";
import { NawbaharIcon } from "@/components/NawbaharIcon";

import commentIcon from "@/assets/icons/comment.svg";
import responseIcon from "@/assets/icons/response.svg";

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
  onResponseClick,
  reactionSummary,
  onReact,
  onReactionHover,
}: ArticleCardMetricsProps) {
  const { totalCount, userReaction, topTypes, reactorNames } = reactionSummary;
  const [showReactionDetails, setShowReactionDetails] = useState(false);

  const displayReactionCount = totalCount > 0 ? totalCount : reactionCount;
  const displayCommentCount = commentCount || 0;

  const handleSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (displayReactionCount > 0) {
      onReactionHover?.();
      setShowReactionDetails(true);
    }
  };

  // Build reaction label
  const buildLabel = (): string | undefined => {
    if (displayReactionCount <= 0) return undefined;
    const names: string[] = [];
    if (userReaction) names.push("شما");
    reactorNames?.forEach((n) => { if (!names.includes(n)) names.push(n); });
    if (names.length === 0) return `${toPersianNumber(displayReactionCount)} واکنش`;
    const shown = names.slice(0, 2);
    const remaining = Math.max(displayReactionCount - shown.length, 0);
    let text = shown.join("، ");
    if (remaining > 0) text += ` و ${toPersianNumber(remaining)} نفر`;
    return text;
  };

  const iconBase = "opacity-25 dark:invert";

  return (
    <>
      <div className="mt-2 pb-2">
        <div className="flex items-center justify-between" style={{ direction: "rtl" }}>
          {/* Right side: reaction + comment + response */}
          <div className="flex items-center gap-4">
            {/* Reactions — full ReactionPicker with long-press */}
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <ReactionPicker
                userReaction={userReaction}
                onReact={onReact}
                onHover={onReactionHover}
                topTypes={topTypes}
                summaryText={buildLabel()}
                onSummaryClick={displayReactionCount > 0 ? handleSummaryClick : undefined}
              />
            </div>

            {/* Comments */}
            <button
              onClick={onCommentClick}
              className="flex items-center gap-1.5 transition-colors"
            >
              <NawbaharIcon
                src={commentIcon}
                size={16}
                className={cn(iconBase, commentsOpen && "opacity-50")}
              />
              {displayCommentCount > 0 && (
                <span className="text-[12px]" style={{ color: "#888888" }}>
                  {toPersianNumber(displayCommentCount)}
                </span>
              )}
            </button>

            {/* Response */}
            <button
              onClick={onResponseClick}
              className="flex items-center gap-1.5 transition-colors"
            >
              <NawbaharIcon
                src={responseIcon}
                size={16}
                className={iconBase}
              />
            </button>
          </div>

          {/* Left side: read indicator */}
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
