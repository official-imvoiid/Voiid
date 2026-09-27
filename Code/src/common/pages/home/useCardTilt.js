import { useEffect } from "react";

// Cursor-driven 3D tilt + a highlight that tracks the pointer (desktop only -
// the CSS for it lives in platforms/desktop/home/hover.css). Kept shallow at
// 9deg so it reads as depth, not a gimmick.
export default function useCardTilt(boardRef) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

    const cards = Array.from(boardRef.current?.querySelectorAll(".card") ?? []);
    let rect = null;      // the hovered card's box, measured once on enter
    let frame = 0;
    let last = null;      // the latest pointer position, applied on the next frame

    const apply = () => {
      frame = 0;
      if (!last || !rect) return;
      const { el, x, y } = last;
      const px = (x - rect.left) / rect.width;
      const py = (y - rect.top) / rect.height;
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-y", `${((px - 0.5) * 9).toFixed(2)}deg`);
      el.style.setProperty("--tilt-x", `${((0.5 - py) * 9).toFixed(2)}deg`);
    };
    const onEnter = (e) => { rect = e.currentTarget.getBoundingClientRect(); };
    const onMove = (e) => {
      last = { el: e.currentTarget, x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = (e) => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = null;
      e.currentTarget.style.setProperty("--tilt-x", "0deg");
      e.currentTarget.style.setProperty("--tilt-y", "0deg");
    };

    cards.forEach((c) => {
      c.addEventListener("mouseenter", onEnter);
      c.addEventListener("mousemove", onMove);
      c.addEventListener("mouseleave", onLeave);
    });
    return () => {
      cancelAnimationFrame(frame);
      cards.forEach((c) => {
        c.removeEventListener("mouseenter", onEnter);
        c.removeEventListener("mousemove", onMove);
        c.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [boardRef]);
}
