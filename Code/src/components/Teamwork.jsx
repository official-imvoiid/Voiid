import { useCallback, useEffect, useRef, useState } from "react";
import "./Teamwork.css";

/**
 * Teamwork - a crowd of people wired together behind the Collaborate card.
 *
 * The mesh is a blurred backdrop filling the whole card; the copy sits sharp
 * in front of it. Glowing packets travel person to person continuously, and
 * moving the cursor over the card wakes them - brighter and faster for a
 * moment, then back to a slow idle. Nothing waits for a hover to appear.
 *
 * The backdrop is absolutely positioned, so it contributes no height: the
 * card is sized purely by its text, which keeps it compact. It sits at
 * z-index -1, and because the card sets `isolation: isolate`, a negative
 * layer paints above the card's own background but below its in-flow text.
 *
 * Positions are an organic scatter, not rows - a grid reads as a set of
 * parallel lines rather than a web. They are fixed rather than generated, so
 * the layout stays identical between renders.
 */
const PEOPLE = [
  { x: 26, y: 26 },  { x: 104, y: 16 }, { x: 186, y: 30 }, { x: 266, y: 18 },
  { x: 336, y: 30 }, { x: 62, y: 84 },  { x: 146, y: 76 }, { x: 228, y: 88 },
  { x: 306, y: 78 }, { x: 24, y: 142 }, { x: 104, y: 148 }, { x: 188, y: 140 },
  { x: 268, y: 150 }, { x: 338, y: 140 }, { x: 64, y: 196 }, { x: 150, y: 200 },
  { x: 236, y: 194 }, { x: 316, y: 198 },
];

/* Join neighbours within a radius rather than "the two nearest". Nearest-N
   wires an isolated node to whatever is closest however far away it is, which
   is what produced long lines slicing across the card. A cutoff keeps every
   link short, so it reads as a web. Anyone left unlinked gets one nearest
   partner so nobody floats free. */
const REACH = 92;
const LINKS = (() => {
  const seen = new Set();
  const add = (a, b) => seen.add([Math.min(a, b), Math.max(a, b)].join("-"));
  const dist2 = (p, q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2;

  PEOPLE.forEach((p, i) => {
    let joined = 0;
    PEOPLE.forEach((q, k) => {
      if (k !== i && dist2(p, q) <= REACH * REACH) {
        add(i, k);
        joined += 1;
      }
    });
    if (joined === 0) {
      const near = PEOPLE
        .map((q, k) => ({ k, d: dist2(p, q) }))
        .filter((o) => o.k !== i)
        .sort((a, b) => a.d - b.d)[0];
      if (near) add(i, near.k);
    }
  });
  return [...seen].map((s) => s.split("-").map(Number));
})();

const WAKE_MS = 1600;

const Teamwork = ({ message = "Great things are never built alone." }) => {
  const [awake, setAwake] = useState(false);
  const hostRef = useRef(null);
  const timer = useRef(null);

  const wake = useCallback(() => {
    setAwake(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAwake(false), WAKE_MS);
  }, []);

  useEffect(() => {
    const card = hostRef.current?.closest(".card");
    if (!card) return undefined;
    if (window.matchMedia("(hover: hover)").matches) {
      card.addEventListener("mousemove", wake);
    }
    return () => {
      card.removeEventListener("mousemove", wake);
      clearTimeout(timer.current);
    };
  }, [wake]);

  return (
    <>
      <div className="tm-net" ref={hostRef} data-awake={awake} aria-hidden="true">
        <svg
          className="tm-art"
          viewBox="0 0 354 210"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* the web */}
          <g fill="none" stroke="#F5E9C8" strokeWidth="1.5" strokeLinecap="round">
            {LINKS.map(([a, b]) => (
              <line
                key={`l${a}-${b}`}
                className="tm-link"
                x1={PEOPLE[a].x} y1={PEOPLE[a].y}
                x2={PEOPLE[b].x} y2={PEOPLE[b].y}
              />
            ))}
          </g>

          {/* glowing packets travelling person to person */}
          <g className="tm-packets" fill="#FFF3CC">
            {LINKS.map(([a, b], i) => (
              <circle
                key={`p${a}-${b}`}
                className="tm-packet"
                cx={PEOPLE[a].x}
                cy={PEOPLE[a].y}
                r="2"
                style={{
                  "--dx": `${PEOPLE[b].x - PEOPLE[a].x}px`,
                  "--dy": `${PEOPLE[b].y - PEOPLE[a].y}px`,
                  "--d": `${(i % 9) * 0.55}s`,
                }}
              />
            ))}
          </g>

          {/* the crowd */}
          <g className="tm-people" fill="#F5E9C8">
            {PEOPLE.map((p, i) => (
              <g key={`n${p.x}-${p.y}`} className="tm-person" style={{ "--d": `${i * 0.035}s` }}>
                <circle cx={p.x} cy={p.y - 8} r="5.4" />
                <path d={`M${p.x - 8} ${p.y + 6} a8 8 0 0 1 16 0 z`} />
              </g>
            ))}
          </g>
        </svg>
      </div>

      <p className="tm-msg" aria-label={message}>
        {message.split(" ").map((word, i) => (
          <span key={`${word}-${i}`} className="tm-word" style={{ "--i": i }}>
            {word}
          </span>
        ))}
      </p>
    </>
  );
};

export default Teamwork;
