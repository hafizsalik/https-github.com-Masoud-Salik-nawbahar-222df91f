import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMenu } from "@/contexts/MenuContext";

// In RTL layout: the hamburger menu lives on the RIGHT side of the screen.
// - Swipe from RIGHT edge → LEFT (deltaX < 0)  => OPEN menu
// - Swipe from LEFT  → RIGHT (deltaX > 0)      => CLOSE menu (or open if closed and starts near right)
// We use a simple horizontal swipe heuristic: any sufficiently-horizontal
// swipe toggles. Disabled on writing pages and inside editable / scrollable
// horizontal regions.

const MIN_DX = 60;
const MAX_DY = 50;
const MAX_DURATION = 500;
const EDGE_HINT_PX = 40; // prefer edge-originated swipes for "open"

const DISABLED_ROUTES = [/^\/write/, /\/edit$/];

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    'input, textarea, [contenteditable="true"], [data-no-swipe], .no-swipe, [role="slider"], [role="dialog"], [data-radix-scroll-area-viewport], .embla, .carousel'
  );
}

function isModalOpen(): boolean {
  // Radix dialogs / sheets / popovers / drawers
  return !!document.querySelector('[data-state="open"][role="dialog"], [data-radix-popper-content-wrapper]');
}

export function useSwipeMenu() {
  const { isOpen, open, close } = useMenu();
  const location = useLocation();

  useEffect(() => {
    const disabled = DISABLED_ROUTES.some((r) => r.test(location.pathname));
    if (disabled) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let active = false;
    let startedNearRightEdge = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (isInteractive(e.target)) return;
      if (isModalOpen() && !isOpen) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      active = true;
      startedNearRightEdge = window.innerWidth - startX < EDGE_HINT_PX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startT;
      if (dt > MAX_DURATION) return;
      if (Math.abs(dy) > MAX_DY) return;
      if (Math.abs(dx) < MIN_DX) return;

      // Swipe LEFT (dx < 0): open menu (especially if started near right edge)
      // Swipe RIGHT (dx > 0): close menu if open
      if (dx < 0) {
        if (!isOpen && (startedNearRightEdge || Math.abs(dx) > 100)) {
          open();
        }
      } else {
        if (isOpen) close();
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isOpen, open, close, location.pathname]);
}
