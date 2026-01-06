import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: "like" | "comment" | "follow";
  article_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    display_name: string;
    avatar_url: string | null;
  };
  article?: {
    title: string;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch notifications
    const { data: notifData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!notifData || notifData.length === 0) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Get unique actor IDs and article IDs
    const actorIds = [...new Set(notifData.map(n => n.actor_id))];
    const articleIds = [...new Set(notifData.filter(n => n.article_id).map(n => n.article_id!))];

    // Fetch actors
    const { data: actorsData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", actorIds);

    // Fetch articles
    const { data: articlesData } = articleIds.length > 0 
      ? await supabase.from("articles").select("id, title").in("id", articleIds)
      : { data: [] };

    const actorsMap = new Map((actorsData || []).map(a => [a.id, a]));
    const articlesMap = new Map((articlesData || []).map(a => [a.id, a]));

    const transformed: Notification[] = notifData.map(n => ({
      ...n,
      type: n.type as "like" | "comment" | "follow",
      actor: actorsMap.get(n.actor_id),
      article: n.article_id ? articlesMap.get(n.article_id) : undefined,
    }));

    setNotifications(transformed);
    setUnreadCount(transformed.filter(n => !n.is_read).length);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    refetch: fetchNotifications 
  };
}
