import { useCallback, useEffect, useRef, useState } from "react";
import "./Wasted.css";

/**
 * Wasted - the GTA death-screen easter egg, scoped to its host card.
 *
 * Press the button three times and the card takes a bullet: glass cracks
 * across it, it desaturates, and WASTED crawls in - all inside the card, so
 * it lands wherever you already are on the page.
 *
 *   const wasted = useWasted();
 *   <div className="card gaming-card">
 *     ...
 *     {wasted.button}
 *     {wasted.overlay}
 *   </div>
 *
 * The host needs `position: relative` and `overflow: hidden`; the Game card
 * already has both. Type scales off the card width via container units, so
 * the banner fits whatever size the grid gives it.
 *
 * The audio only ever plays as a direct result of the third click, so it
 * never trips the browser's autoplay block.
 */
const DURATION_MS = 4600;
const DISMISS_LOCK_MS = 1800;   // ignore stray clicks right after it fires
const RESET_MS = 2500;           // clicks lapse if they are not reasonably close

const TAUNTS = [
  "curiosity killed the dev 💀",
  "here lies your curiosity 💀",
  "death by third click 💀",
  "you had one job. it was not this 💀",
  "clicked into the void 💀",
  "the button won 💀",
  "some buttons bite back 💀",
  "side effects may include this 💀",
  "works as intended 💀",
  "skill issue 💀",
];

/**
 * The original crack pattern, scaled outward to fill the card.
 *
 * This is the hand-drawn set it started with - the generated shatter that
 * replaced it read as scribble, not glass. The only change is SPREAD: every
 * endpoint is pushed out from the impact point by 1.55x, so each fracture
 * runs off the edge of the 100x100 box instead of stopping inside it. With
 * `preserveAspectRatio="none"` the box is stretched to the card, so pushing
 * past the boundary is what guarantees the corners and the side thirds are
 * covered however wide the card gets.
 */
const SPREAD = 1.55;

// push one "x y" pair out from the centre
const spread = (x, y) => `${(50 + (x - 50) * SPREAD).toFixed(1)} ${(50 + (y - 50) * SPREAD).toFixed(1)}`;
// rewrite every coordinate pair in a path command string
const stretch = (d) =>
  d.replace(/([ML])\s*(-?[\d.]+)\s+(-?[\d.]+)/g, (_, cmd, x, y) =>
    `${cmd}${spread(parseFloat(x), parseFloat(y))}`
  );

const CRACKS = [
  "M50 50 L18 4", "M50 50 L34 0", "M50 50 L62 0", "M50 50 L86 8",
  "M50 50 L98 26", "M50 50 L100 54", "M50 50 L92 84", "M50 50 L68 100",
  "M50 50 L44 100", "M50 50 L14 92", "M50 50 L0 70", "M50 50 L2 34",
  // a few more of the same, filling the gaps between the originals
  "M50 50 L8 18", "M50 50 L76 2", "M50 50 L100 78", "M50 50 L28 100",
  "M50 50 L0 46", "M50 50 L100 34",
  // secondary webbing
  "M32 27 L44 14 M44 14 L60 18 M60 18 L72 12",
  "M28 62 L40 74 M40 74 L58 76 M58 76 L74 66",
  "M22 44 L36 40 M64 36 L78 44 M66 62 L80 58",
  "M20 34 L32 22 M70 24 L82 34 M24 70 L34 82",
].map(stretch);

const LABELS = ["press me 3x", "again…", "one more 👀"];

export const useWasted = ({ sound = "/audio/fahhhhh.mp3" } = {}) => {
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const [taunt, setTaunt] = useState(TAUNTS[0]);
  const clicks = useRef(0);
  const firing = useRef(false);   // synchronous guard - `active` lags a render
  const firedAt = useRef(0);
  const lapse = useRef(null);
  const timer = useRef(null);
  const audio = useRef(null);

  useEffect(() => {
    audio.current = new Audio(sound);
    audio.current.preload = "auto";
    return () => {
      clearTimeout(lapse.current);
      clearTimeout(timer.current);
      audio.current?.pause();
    };
  }, [sound]);

  const onClick = useCallback(
    (e) => {
      // the button lives inside a <Link>, so the navigation has to be stopped
      e.preventDefault();
      e.stopPropagation();
      // `active` only updates on the next render, so mashing the button could
      // slip several clicks past this check and fire the whole thing twice.
      // The ref flips immediately.
      if (active || firing.current) return;

      // A state updater has to be pure - React may run it twice (it does, in
      // StrictMode), so firing the audio and overlay from inside one made the
      // third press land only sometimes. The ref counts synchronously; the
      // state copy exists only to re-render the label.
      clicks.current += 1;
      setCount(clicks.current);
      clearTimeout(lapse.current);

      if (clicks.current < 3) {
        lapse.current = setTimeout(() => {
          clicks.current = 0;
          setCount(0);
        }, RESET_MS);
        return;
      }

      clicks.current = 0;
      firing.current = true;
      firedAt.current = Date.now();
      setCount(0);
      setTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
      setActive(true);

      const a = audio.current;
      if (a) {
        a.currentTime = 0;
        // a rejected play (no gesture, muted tab) must not break the visual
        a.play().catch(() => {});
      }

      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        firing.current = false;
        setActive(false);
      }, DURATION_MS);
    },
    [active]
  );

  const dismiss = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // A 4th rapid press lands on the overlay, which covers the card - without
    // this it would dismiss the thing it just triggered.
    if (Date.now() - firedAt.current < DISMISS_LOCK_MS) return;
    clearTimeout(timer.current);
    audio.current?.pause();
    firing.current = false;
    setActive(false);
  }, []);

  const button = (
    <button
      type="button"
      className="wasted-btn"
      data-step={count}
      onClick={onClick}
      aria-label="Press three times for a surprise"
    >
      {LABELS[Math.min(count, 2)]}
    </button>
  );

  const overlay = active ? (
    <div className="wasted" role="presentation" onClick={dismiss}>
      <div className="wasted-flash" />
      <svg
        className="wasted-glass"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {CRACKS.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength="1"
            style={{ animationDelay: `${0.022 * i}s` }}
          />
        ))}
        <circle className="wasted-impact" cx="50" cy="50" r="2.6" />
      </svg>
      <div className="wasted-stack">
        <div className="wasted-text">WASTED</div>
        <p className="wasted-taunt">{taunt}</p>
      </div>
    </div>
  ) : null;

  return { onClick, button, overlay, active };
};

export default useWasted;
