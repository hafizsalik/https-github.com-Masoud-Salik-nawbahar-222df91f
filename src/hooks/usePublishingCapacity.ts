import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PublishingStats {
  capacity_used: number;
  total_capacity: number;
  remaining_capacity: number;
  percentage_used: number;
}

export function usePublishingCapacity() {
  const [stats, setStats] = useState<PublishingStats | null>(null);
  const [canPublish, setCanPublish] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get publishing stats
      const { data: statsData, error: statsError } = await supabase
        .rpc<PublishingStats[]>("get_publishing_stats");

      if (statsError) {
        console.error("Error fetching publishing stats:", statsError);
        setLoading(false);
        return;
      }

      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
        
        // Check if we can still publish
        const { data: canPublishData, error: canPublishError } = await supabase
          .rpc<boolean>("can_publish_article");

        if (!canPublishError && canPublishData !== null) {
          setCanPublish(canPublishData as boolean);
        }
      }
    } catch (err) {
      console.error("Error in usePublishingCapacity:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    canPublish,
    loading,
    refetch: fetchStats,
  };
}
