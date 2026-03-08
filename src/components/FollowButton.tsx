import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FollowButtonProps {
  userId: string;
  size?: "sm" | "default";
  className?: string;
}

export function FollowButton({ userId, size = "sm", className }: FollowButtonProps) {
  const { isFollowing, toggleFollow, loading, isSelf } = useFollow(userId);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);

  if (isSelf) return null;

  const handleClick = () => {
    if (isFollowing) {
      setShowUnfollowDialog(true);
    } else {
      toggleFollow();
    }
  };

  return (
    <>
      {isFollowing ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick();
          }}
          disabled={loading}
          className={cn(
            "text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors",
            className
          )}
        >
          دنبال شده
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick();
          }}
          disabled={loading}
          className={cn(
            "text-[10px] text-primary/70 hover:text-primary font-medium transition-colors",
            className
          )}
        >
          + دنبال کردن
        </button>
      )}

      <AlertDialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <AlertDialogContent className="max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>لغو دنبال کردن</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید دنبال کردن این نویسنده را لغو کنید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toggleFollow();
                setShowUnfollowDialog(false);
              }}
            >
              لغو دنبال کردن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
