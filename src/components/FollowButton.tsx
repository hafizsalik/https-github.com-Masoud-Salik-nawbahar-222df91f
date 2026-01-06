import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  size?: "sm" | "default";
  className?: string;
}

export function FollowButton({ userId, size = "sm", className }: FollowButtonProps) {
  const { isFollowing, toggleFollow, loading, isSelf } = useFollow(userId);

  if (isSelf) return null;

  return (
    <Button
      variant={isFollowing ? "secondary" : "outline"}
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFollow();
      }}
      disabled={loading}
      className={cn(
        "gap-1.5 text-xs h-7 px-2.5 rounded-full",
        isFollowing && "bg-primary/10 text-primary border-primary/20",
        className
      )}
    >
      {isFollowing ? (
        <>
          <UserCheck size={14} />
          <span>دنبال شده</span>
        </>
      ) : (
        <>
          <UserPlus size={14} />
          <span>دنبال کردن</span>
        </>
      )}
    </Button>
  );
}
