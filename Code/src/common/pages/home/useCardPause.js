import { useEffect } from "react";

/* Marks each home card `is-offscreen` while it is out of view. The CSS (board.css)
   pauses every animation inside such a card, so ~15 looping effects only run
   for cards someone can actually see. */
export default function useCardPause(boardRef) {
  useEffect(() => {
    const cards = Array.from(boardRef.current?.querySelectorAll(".card") ?? []);
    if (!cards.length || typeof IntersectionObserver === "undefined") return undefined;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-offscreen", !e.isIntersecting));
    }, { rootMargin: "80px 0px" });
    cards.forEach((c) => io.observe(c));
    return () => {
      io.disconnect();
      cards.forEach((c) => c.classList.remove("is-offscreen"));
    };
  }, [boardRef]);
}
