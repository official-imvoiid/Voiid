import { useEffect, useRef } from "react";

/**
 * useCardPlay - start a card's animation on hover, or on scroll-into-view
 * when there is no cursor.
 *
 * Every animated card on the home page was wired to `mouseenter` /
 * `mousemove`. A phone has no hover, so on mobile the mascot never walked
 * in, the scientist never mixed anything and the network never woke up -
 * the animations were not broken, they were simply never triggered.
 *
 * Hover is still the right trigger when there is a cursor: it is deliberate,
 * and it keeps a dozen animations from running at once. With no cursor, the
 * equivalent signal is the card actually being on screen, which is what an
 * IntersectionObserver reports.
 *
 *   useCardPlay(hostRef, play, stop, { find: (el) => el.parentElement });
 *
 * `play` and `stop` must be stable (useCallback). `find` need not be - see
 * below.
 */
const useCardPlay = (hostRef, play, stop, { find, threshold = 0.4 } = {}) => {
  /* `find` is passed as an inline arrow at every call site, so it is a new
     function object on every render. Depending on it directly meant the
     effect tore itself down and rebuilt on each render, and its cleanup calls
     stop() - so play() set state, the re-render disposed the effect, stop()
     reset the phase, and the animation was cancelled the instant it started.
     Reading it through a ref keeps the effect tied only to what actually
     matters: the element and the two callbacks. */
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
