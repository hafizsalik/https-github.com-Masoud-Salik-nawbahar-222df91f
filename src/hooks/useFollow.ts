import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    
    const checkFollowing = async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      
      setIsFollowing(!!data);
    };
    
    checkFollowing();
  }, [user, targetUserId]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    
    setLoading(true);
    
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        setIsFollowing(false);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isSelf = user?.id === targetUserId;

  return { isFollowing, toggleFollow, loading, isSelf };
}

export function useFollowingIds() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFollowingIds([]);
      setLoading(false);
      return;
    }

    const fetchFollowing = async () => {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      
      setFollowingIds((data || []).map(f => f.following_id));
      setLoading(false);
    };

    fetchFollowing();
  }, [user]);

  return { followingIds, loading };
}
