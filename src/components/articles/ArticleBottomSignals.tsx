import { toPersianNumber } from "@/lib/utils";
import { NawbaharIcon } from "@/components/NawbaharIcon";
import commentIcon from "@/assets/icons/comment.svg";
import responseIcon from "@/assets/icons/response.svg";

interface ArticleBottomSignalsProps {
  viewCount: number;
  commentCount: number;
  responseCount: number;
}

export function ArticleBottomSignals({ 
  commentCount, 
  responseCount 
}: ArticleBottomSignalsProps) {
  const iconBase = "opacity-30 dark:invert";

  return (
    <div className="flex items-center justify-center gap-6 py-4 text-muted-foreground">
      <div className="flex items-center gap-1.5 text-sm">
        <NawbaharIcon src={commentIcon} size={16} className={iconBase} />
        <span>{toPersianNumber(commentCount)}</span>
      </div>
      {responseCount > 0 && (
        <div className="flex items-center gap-1.5 text-sm">
          <NawbaharIcon src={responseIcon} size={16} className={iconBase} />
          <span>{toPersianNumber(responseCount)}</span>
        </div>
      )}
    </div>
  );
}
