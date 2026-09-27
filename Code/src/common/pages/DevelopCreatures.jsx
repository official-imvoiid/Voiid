import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { hash } from "../content/seeded";

/**
 * DevelopCreatures - the little folk who live between the trail rows of the
 * Develop map. Hover (or tap) one and it tells you something, typed out in a
 * speech bubble. Every so often one of them pipes up on its own.
 *
 * To add a creature: draw it in DRAWINGS (about 44px tall, feet at y = 0)
 * and give it some lines in LINES.
 * Looks: common/styles/pages/develop.css (.dv-creature, .dv-bubble)
 */

const LINES = {
  dragon: [
    "I hoard merge conflicts. Want one?",
    "Rawr. The build failed. Wasn't me.",
    "This gold? All technical debt.",
    "I only breathe fire on Fridays. Deploy day.",
  ],
  wizard: [
    "I cast git push --force. No survivors.",
    "It works on my crystal ball.",
    "Thou shalt not pass... code review.",
    "My spellbook is 90% Stack Overflow.",
  ],
  knight: [
    "I slay bugs. They respawn.",
    "Sworn to protect the main branch.",
    "My quest: close all 47 tabs.",
    "Fear not! I have read the docs. Once.",
  ],
  goblin: [
    "Me stole your semicolons;",
    "I live in node_modules. It's HUGE.",
    "Me eat cookies. No consent banner.",
    "Shh... I'm the missing curly brace }",
  ],
  ghost: [
    "Boo! undefined is not a function.",
    "I'm a deprecated function. Still here.",
    "Haunting this repo since v0.0.1.",
    "I was a TODO. Nobody did me.",
  ],
  kraken: [
    "Eight arms. Still can't close all the tabs.",
    "I pulled your ship down. And your prod server.",
    "Ink is how I write my commit messages.",
    "Release the Kraken! ...to staging first.",
  ],
  pirate: [
    "Arr! I pirated your API keys. They were in .env",
    "Dead men tell no tales. Dead code tells none either.",
    "X marks the bug. Dig here.",
    "Yo ho ho and a bottle of Red Bull.",
  ],
  witch: [
    "Double, double, toil and trouble - npm install.",
    "I brew potions. You brew merge requests.",
    "My cauldron runs on regex.",
    "Hex? No, I only speak hexadecimal.",
  ],
};
const KINDS = Object.keys(LINES);

/* ---- the drawings: small, inked, a splash of colour ---- */
const DRAWINGS = {
  dragon: (
    <g>
      <path className="dv-cr-gold" d="M -16 0 Q -8 -7 0 -4 Q 8 -8 16 0 Z" />
      <path className="dv-cr-gold-line" d="M -7 -3 l 2 -2 M 3 -4 l 2 -2 M 9 -3 l 2 -2" />
      <path className="dv-cr-tail" d="M 8 -6 Q 22 -4 20 -14 L 24 -16 L 19 -19 L 18 -14" />
      <path className="dv-cr-wing" d="M -2 -22 L 10 -36 L 12 -28 L 18 -30 L 14 -21 Z" />
      <path className="dv-cr-dragon" d="M -10 -4 Q -12 -18 -4 -24 Q 4 -26 8 -18 Q 12 -8 6 -4 Z" />
      <path className="dv-cr-dragon" d="M -6 -22 Q -10 -34 -20 -32 Q -24 -26 -18 -24 Q -12 -22 -8 -18 Z" />
      <path className="dv-cr-line" d="M -12 -32 l -2 -6 M -9 -30 l 1 -6" />
      <circle className="dv-cr-eye" cx="-15" cy="-29" r="1.3" />
      <path className="dv-cr-belly" d="M -6 -8 Q -7 -16 -2 -20 M -3 -10 l 3 0 M -4 -14 l 3 0" />
      <path className="dv-cr-fire" d="M -21 -27 q -5 -1 -7 -4 q 3 0 4 -2 q -3 -1 -4 -4 q 5 1 8 5 Z" />
    </g>
  ),
  wizard: (
    <g>
      <path className="dv-cr-staff" d="M 13 0 L 13 -34" />
      <circle className="dv-cr-orb" cx="13" cy="-37" r="4" />
      <path className="dv-cr-robe" d="M -11 0 L -6 -20 L 6 -20 L 11 0 Z" />
      <circle className="dv-cr-face" cx="0" cy="-23" r="5.5" />
      <path className="dv-cr-beard" d="M -5 -22 Q 0 -8 5 -22 Q 0 -19 -5 -22 Z" />
      <path className="dv-cr-hat" d="M -10 -27 L 10 -27 L 3 -29 L -2 -46 L -4 -29 Z" />
      <path className="dv-cr-star" d="M -1 -36 l 1 -2 l 1 2 l -2 -1 l 2 0 Z" />
      <path className="dv-cr-line" d="M 6 -14 L 13 -18" />
    </g>
  ),
  knight: (
    <g>
      <path className="dv-cr-line" d="M -5 0 L -4 -8 M 5 0 L 4 -8" />
      <path className="dv-cr-armor" d="M -8 -8 L -8 -22 Q 0 -26 8 -22 L 8 -8 Z" />
      <path className="dv-cr-helm" d="M -7 -24 Q -7 -38 0 -38 Q 7 -38 7 -24 Z" />
      <path className="dv-cr-visor" d="M -5 -31 L 5 -31" />
      <path className="dv-cr-plume" d="M 0 -38 Q 6 -46 12 -42 Q 6 -42 2 -37 Z" />
      <path className="dv-cr-shield" d="M -16 -20 L -6 -20 L -6 -12 Q -11 -5 -16 -12 Z" />
      <path className="dv-cr-cross" d="M -11 -19 L -11 -9 M -15 -15 L -7 -15" />
      <path className="dv-cr-sword" d="M 10 -12 L 18 -34 M 8 -16 L 14 -13" />
    </g>
  ),
  goblin: (
    <g>
      <path className="dv-cr-line" d="M -4 0 L -3 -7 M 4 0 L 3 -7" />
      <path className="dv-cr-rag" d="M -7 -6 L -6 -18 L 6 -18 L 7 -6 L 3 -8 L 0 -5 L -3 -8 Z" />
      <path className="dv-cr-goblin" d="M -8 -26 L -18 -30 L -9 -21 Z M 8 -26 L 18 -30 L 9 -21 Z" />
      <circle className="dv-cr-goblin" cx="0" cy="-24" r="8.5" />
      <circle className="dv-cr-eye is-big" cx="-3" cy="-26" r="1.8" />
      <circle className="dv-cr-eye is-big" cx="3.5" cy="-26" r="1.8" />
      <path className="dv-cr-grin" d="M -4 -20 Q 0 -17 4 -20 M -2 -19.2 l 0 1.4 M 2 -19.2 l 0 1.4" />
      <text className="dv-cr-semi" x="11" y="-8">;</text>
    </g>
  ),
  ghost: (
    <g className="dv-cr-float">
      <path className="dv-cr-ghost" d="M -11 -4 L -11 -24 Q -11 -38 0 -38 Q 11 -38 11 -24 L 11 -4 L 7 -8 L 4 -3 L 0 -8 L -4 -3 L -7 -8 Z" />
      <ellipse className="dv-cr-eye" cx="-4" cy="-26" rx="1.8" ry="2.6" />
      <ellipse className="dv-cr-eye" cx="4" cy="-26" rx="1.8" ry="2.6" />
      <ellipse className="dv-cr-mouth" cx="0" cy="-18" rx="2.4" ry="3" />
      <ellipse className="dv-cr-shadow" cx="0" cy="3" rx="9" ry="2" />
    </g>
  ),
  kraken: (
    <g>
      <path className="dv-cr-line" d="M -18 0 q 4 -4 8 0 t 8 0 t 8 0 t 8 0 t 8 0" />
      <path className="dv-cr-tentacle" d="M -14 -2 Q -22 -10 -16 -18 Q -12 -22 -15 -26" />
      <path className="dv-cr-tentacle" d="M 14 -2 Q 22 -10 16 -18 Q 12 -22 15 -26" />
      <path className="dv-cr-tentacle" d="M -7 -2 Q -10 -8 -6 -12" />
      <path className="dv-cr-tentacle" d="M 7 -2 Q 10 -8 6 -12" />
      <path className="dv-cr-kraken" d="M -9 -4 Q -11 -30 0 -32 Q 11 -30 9 -4 Z" />
      <circle className="dv-cr-eye" cx="-3.5" cy="-16" r="1.6" />
      <circle className="dv-cr-eye" cx="3.5" cy="-16" r="1.6" />
      <path className="dv-cr-line" d="M -3 -10 q 3 2 6 0" />
    </g>
  ),
  pirate: (
    <g>
      <path className="dv-cr-line" d="M -4 0 L -3 -8 M 4 0 L 3 -8" />
      <path className="dv-cr-rag" d="M -8 -8 L -7 -20 L 7 -20 L 8 -8 Z" />
      <path className="dv-cr-line" d="M -7 -17 L 7 -12 M -7 -12 L 7 -17" />
      <circle className="dv-cr-face" cx="0" cy="-26" r="7" />
      <path className="dv-cr-hat" d="M -12 -30 Q 0 -44 12 -30 Q 0 -34 -12 -30 Z" />
      <circle className="dv-cr-eye" cx="-2.5" cy="-27" r="1.5" />
      <path className="dv-cr-patch" d="M 1 -29 h 4 v 3.5 h -4 Z M -6 -31 L 8 -27" />
      <path className="dv-cr-line" d="M -3 -22 h 6 M -1.5 -22 v 1.5 M 1.5 -22 v 1.5" />
      <path className="dv-cr-sword" d="M 9 -14 L 20 -26 M 8 -17 L 12 -13" />
    </g>
  ),
  witch: (
    <g className="dv-cr-float">
      <path className="dv-cr-staff" d="M -20 -6 L 18 -14" />
      <path className="dv-cr-broom" d="M 18 -14 L 28 -20 L 27 -12 L 29 -8 Z" />
      <path className="dv-cr-robe" d="M -8 -8 L -4 -24 L 6 -24 L 10 -10 Z" />
      <circle className="dv-cr-face" cx="1" cy="-27" r="4.5" />
      <path className="dv-cr-hat" d="M -9 -30 L 11 -30 L 4 -32 L 6 -46 L -1 -32 Z" />
      <circle className="dv-cr-eye" cx="2.5" cy="-27.5" r="0.9" />
      <path className="dv-cr-line" d="M -4 -16 L -12 -12" />
      <ellipse className="dv-cr-shadow" cx="4" cy="4" rx="10" ry="2" />
    </g>
  ),
};

/* one creature with its speech bubble */
const Creature = ({ kind, line, x, y, open, onToggle, mapWidth }) => {
  const textRef = useRef(null);
  const [w, setW] = useState(line.length * 7);

  // size the bubble to the real text width
  useLayoutEffect(() => {
    const t = textRef.current;
    if (t?.getComputedTextLength) setW(Math.ceil(t.getComputedTextLength()));
  }, [line]);

  const bw = w + 24;
  // slide the bubble sideways so it never runs off the map, keeping its
  // tail pointing at the creature
  const half = bw / 2 + 6;
  const room = Math.min(half - 14, Math.max(0, bw / 2 - 12));
  const sx = Math.max(-room, Math.min(room, Math.max(10 + half - x, Math.min(0, mapWidth - 10 - half - x))));
  const L = sx - bw / 2;
  const R = sx + bw / 2;
  return (
    <g
      className={`dv-creature is-${kind}${open ? " is-open" : ""}`}
      transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onToggle(); } }}
      role="button"
      tabIndex={0}
      aria-label={`${kind} says: ${line}`}
    >
      <circle className="dv-cr-hit" cy="-26" r="32" />
      <g className="dv-cr-body"><g transform="scale(1.3)">{DRAWINGS[kind]}</g></g>
      <text className="dv-cr-hint" x="18" y="-52">!</text>

      <g className="dv-bubble" transform="translate(0 -64)">
        <path
          className="dv-bubble-box"
          d={`M ${L} -30 H ${R} Q ${R + 6} -30 ${R + 6} -24 V -6 Q ${R + 6} 0 ${R} 0
              H 7 L 0 9 L -5 0 H ${L} Q ${L - 6} 0 ${L - 6} -6 V -24 Q ${L - 6} -30 ${L} -30 Z`}
        />
        <text
          ref={textRef}
          className="dv-bubble-text"
          x={sx}
          y="-11"
          style={{ "--chars": line.length }}
        >
          {line}
        </text>
      </g>
    </g>
  );
};

/**
 * The creatures, one at each spot - out at sea, like the monsters in the
 * margins of old charts.
 */
const Creatures = ({ spots, width }) => {
  const [open, setOpen] = useState(-1);      // clicked open
  const [chatter, setChatter] = useState(-1); // speaking up on its own
  const count = spots.length;

  // every so often, someone says something
  useEffect(() => {
    if (!count || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let n = 0;
    let quiet = 0;
    const talk = window.setInterval(() => {
      n += 1;
      setChatter(Math.floor(hash(`chatter${n}`) * count));
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => setChatter(-1), 4200);
    }, 9000);
    return () => { window.clearInterval(talk); window.clearTimeout(quiet); };
  }, [count]);

  return (
    <g className="dv-creatures">
      {Array.from({ length: count }, (_, i) => {
        const kind = KINDS[(i + Math.floor(hash("kinds") * KINDS.length)) % KINDS.length];
        const lines = LINES[kind];
        // each kind works through its own lines, so no joke repeats until all are told
        const round = Math.floor(i / KINDS.length);
        const line = lines[(round + Math.floor(hash(`line${kind}`) * lines.length)) % lines.length];
        const { x, y } = spots[i];
        return (
          <Creature
            key={i}
            kind={kind}
            line={line}
            x={x}
            y={y}
            mapWidth={width}
            open={open === i || chatter === i}
            onToggle={() => setOpen((cur) => (cur === i ? -1 : i))}
          />
        );
      })}
    </g>
  );
};

export default Creatures;
