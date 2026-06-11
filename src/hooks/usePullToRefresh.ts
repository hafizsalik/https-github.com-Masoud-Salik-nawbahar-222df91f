import { useEffect, useRef, useState } from "react";

interface Options {
  /** Pixel threshold the user must drag past to trigger refresh */
  threshold?: number;
  /** Max distance the indicator follows the finger */
  maxPull?: number;
  /** Callback returning a promise; refreshing stays true until resolved */
  onRefresh: () => Promise<unknown> | void;
  /** Disable on certain conditions (e.g. modal open) */
  disabled?: boolean;
}

/**
 * Touch-driven pull-to-refresh for the document.
 * Activates only when scrollY === 0 and the user drags down.
 */
export function usePullToRefresh({
  threshold = 64,
  maxPull = 96,
  onRefresh,
  disabled = false,
}: Options) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const tracking = useRef(false);

  useEffect(() => {
    if (disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current || startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Rubber-band
      const next = Math.min(maxPull, dy * 0.5);
      setPull(next);
    };

    const onTouchEnd = async () => {
      if (!tracking.current) return;
      tracking.current = false;
      startY.current = null;
      if (pull >= threshold && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [disabled, maxPull, threshold, pull, refreshing, onRefresh]);

  return { pull, refreshing, progress: Math.min(1, pull / threshold) };
}
