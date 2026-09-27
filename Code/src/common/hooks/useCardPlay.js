import { useEffect, useRef } from "react";

/**
 * useCardPlay - start a card's animation on hover, or on scroll-into-view
 * when there is no cursor.
 *
 * Hover is the right trigger when there is a cursor: it is deliberate, and
 * it keeps a dozen animations from running at once. A phone has no hover,
 * so there the equivalent signal is the card being on screen, which is what
 * an IntersectionObserver reports.
 *
 *   useCardPlay(hostRef, play, stop, { find: (el) => el.parentElement });
 *
 * `play` and `stop` must be stable (useCallback). `find` need not be - see
 * below.
 */
const useCardPlay = (hostRef, play, stop, { find, threshold = 0.4 } = {}) => {
  /* `find` is an inline arrow at every call site (a new function each render).
     Read through a ref, so the effect below only depends on the element and
     the two callbacks - otherwise its cleanup would call stop() on every
     render and cancel the animation the instant play() started it. */
  const findRef = useRef(find);
  findRef.current = find;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const resolve = findRef.current;
    const card = resolve ? resolve(host) : host.parentElement;
    if (!card) return undefined;

    // A cursor is present: keep the original hover behaviour exactly.
    if (window.matchMedia("(hover: hover)").matches) {
      card.addEventListener("mouseenter", play);
      card.addEventListener("mouseleave", stop);
      return () => {
        card.removeEventListener("mouseenter", play);
        card.removeEventListener("mouseleave", stop);
      };
    }

    // No cursor: the card being on screen is the trigger. Stopping on exit
    // means scrolling back to it replays from the start rather than showing
    // a scene that already finished.
    if (typeof IntersectionObserver === "undefined") {
      play();
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : stop()),
      { threshold }
    );
    io.observe(card);
    return () => io.disconnect();
  }, [hostRef, play, stop, threshold]);
};

export default useCardPlay;
