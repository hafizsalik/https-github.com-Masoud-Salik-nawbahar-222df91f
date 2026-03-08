import { useState } from "react";
import { REACTION_EMOJIS, REACTION_LABELS, type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";
import { cn, toPersianNumber } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";
import { ReactionDetailsModal } from "./ReactionDetailsModal";

interface ArticleReactionsProps {
  articleId: string;
  summary: ReactionSummary;
  onReact: (type: ReactionKey) => void;
}

export function ArticleReactions({ articleId, summary, onReact }: ArticleReactionsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { userReaction, totalCount, topTypes, reactorNames } = summary;

  const buildLabel = (): string | null => {
    if (totalCount === 0) return null;
    const names: string[] = [];
    if (userReaction) names.push("شما");
    reactorNames.forEach((n) => { if (!names.includes(n)) names.push(n); });
    if (names.length === 0) return `${toPersianNumber(totalCount)} نفر`;
    const shown = names.slice(0, 2);
    const remaining = Math.max(totalCount - shown.length, 0);
    let text = shown.join("، ");
    if (remaining > 0) text += ` و ${toPersianNumber(remaining)} نفر دیگر`;
    return text;
  };

  const label = buildLabel();

  return (
    <>
      <div className="flex items-center justify-between py-6 my-6 border-t border-b border-border/40">
        {/* Reaction buttons */}
        <div className="flex items-center gap-1">
          {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
            <button
              key={key}
              onClick={() => onReact(key as ReactionKey)}
              className={cn(
                "flex flex-col items-center justify-center w-10 h-10 rounded-full text-[20px] transition-all duration-200",
                "hover:scale-[1.2] hover:bg-muted/60 active:scale-95",
                userReaction === key && "bg-primary/10 ring-1.5 ring-primary/25 scale-110"
              )}
              title={REACTION_LABELS[key]}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Summary */}
        {label && (
          <button
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {topTypes.slice(0, 2).map((type) => (
              <span key={type} className="text-[14px]">{REACTION_EMOJIS[type]}</span>
            ))}
            <span>{label}</span>
          </button>
        )}
      </div>

      <ReactionDetailsModal
        articleId={articleId}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
}
