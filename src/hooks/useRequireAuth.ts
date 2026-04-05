import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

/**
 * Guest mode guardrail — shows toast + redirects to login when unauthenticated.
 * Returns a wrapper function that checks auth before executing the callback.
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const requireAuth = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    message = "برای این کار باید وارد شوید"
  ): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
    return (...args: Parameters<T>) => {
      if (!user) {
        toast({ title: message, variant: "destructive" });
        navigate("/auth?view=login");
        return undefined;
      }
      return callback(...args);
    };
  }, [user, navigate, toast]);

  const isGuest = !user;

  return { requireAuth, isGuest, user };
}
