import { useEffect } from "react";

/**
 * useModal - what every pop-up viewer on the site shares: Esc closes it,
 * ← → step through it, the page behind stops scrolling, focus lands on
 * the close button, Tab stays inside the pop-up, and closing it hands focus
 * back to whatever opened it.
 *
 *   useModal({ onClose, onStep: (d) => ..., focusRef, onKey });
 *
 * `onKey` sees any other key (the 3D viewer's view shortcuts). Pass stable
 * functions (useCallback) - the listeners are re-attached when they change.
 * The pop-up itself is found by its role="dialog" aria-modal="true".
 */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), video[controls], iframe, [tabindex]:not([tabindex="-1"])';

export default function useModal({ onClose, onStep, focusRef, onKey } = {}) {
  useEffect(() => {
    const handler = (e) => {
      // typing in a box, or seeking a video, must not also change the slide
      const typing = /^(INPUT|TEXTAREA|SELECT|VIDEO)$/.test(e.target?.tagName || "");
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight" && onStep) { if (!typing) onStep(1); }
      else if (e.key === "ArrowLeft" && onStep) { if (!typing) onStep(-1); }
      else if (e.key === "Tab") {
        // keep Tab inside the pop-up: the page behind it is covered
        const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
        const dialog = dialogs[dialogs.length - 1];
        const items = dialog ? [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length) : [];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const at = document.activeElement;
        if (!dialog.contains(at)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
      } else onKey?.(e);
    };
    window.addEventListener("keydown", handler);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onStep, onKey]);

  // focus moves in once, when the pop-up opens (not on every step - that used
  // to pull focus off the Next button onto Close), and goes back on closing
  useEffect(() => {
    const before = document.activeElement;
    focusRef?.current?.focus();
    return () => { if (before?.isConnected) before.focus?.(); };
  }, [focusRef]);
}
