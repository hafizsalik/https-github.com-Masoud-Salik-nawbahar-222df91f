import { useEffect, useState } from "react";

/**
 * Returns the pixel offset between the bottom of the layout viewport and the
 * bottom of the visual viewport. On mobile this equals the on-screen keyboard
 * height; on desktop it stays 0. Useful for lifting fixed inputs above the
 * iOS / Android keyboard.
 */
export function useVisualViewportInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const compute = () => {
      const next = Math.max(
        0,
        window.innerHeight - (vv.height + vv.offsetTop)
      );
      setInset(next);
    };

    compute();
    vv.addEventListener("resize", compute);
    vv.addEventListener("scroll", compute);
    return () => {
      vv.removeEventListener("resize", compute);
      vv.removeEventListener("scroll", compute);
    };
  }, []);

  return inset;
}
