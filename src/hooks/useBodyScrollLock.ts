import { useEffect } from "react";

/**
 * Locks <body> scroll while `active` is true.
 * Preserves the current scroll position on iOS Safari (which otherwise
 * jumps to 0 when `overflow: hidden` is applied).
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
