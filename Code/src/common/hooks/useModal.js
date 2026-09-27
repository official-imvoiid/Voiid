import { useEffect } from "react";

/**
 * useModal - what every pop-up viewer on the site shares: Esc closes it,
 * ← → step through it, the page behind stops scrolling, and focus lands on
 * the close button.
 *
 *   useModal({ onClose, onStep: (d) => ..., focusRef, onKey });
 *
 * `onKey` sees any other key (the 3D viewer's view shortcuts). Pass stable
 * functions (useCallback) - the listeners are re-attached when they change.
 */
export default function useModal({ onClose, onStep, focusRef, onKey } = {}) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight" && onStep) onStep(1);
      else if (e.key === "ArrowLeft" && onStep) onStep(-1);
      else onKey?.(e);
    };
    window.addEventListener("keydown", handler);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    focusRef?.current?.focus();
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onStep, focusRef, onKey]);
}
