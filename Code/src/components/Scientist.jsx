import { useCallback, useEffect, useRef, useState } from "react";
import "./Scientist.css";

/**
 * Scientist - the cinematic for the Research card.
 *
 * He wanders in with a flask in each hand, tips one into the other, blows
 * himself up, mutters "oops... big test", and shuffles back off. Runs while
 * the cursor is on the card, same as the music mascot.
 *
 *   <div className="card research-card">
 *     ...
 *     <Scientist />
 *   </div>
 *
 * The host card needs `position: relative` and `overflow: hidden`.
 */
const TIMELINE = [
  ["entering", 40],
  ["mixing", 1400],
  ["boom", 2700],
  ["oops", 3150],
  ["leaving", 5200],
  ["away", 6600],
];

const Scientist = ({ size = 124, side = "left" }) => {
  const [phase, setPhase] = useState("away");
  const hostRef = useRef(null);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const play = useCallback(() => {
    clearTimers();
    setPhase("away");
    TIMELINE.forEach(([name, at]) => {
      timers.current.push(setTimeout(() => setPhase(name), at));
    });
  }, [clearTimers]);

  useEffect(() => {
    const card = hostRef.current?.parentElement;
    if (!card) return undefined;

    const leave = () => {
      clearTimers();
      setPhase("away");
    };

    card.addEventListener("mouseenter", play);
    card.addEventListener("mouseleave", leave);
    return () => {
      card.removeEventListener("mouseenter", play);
      card.removeEventListener("mouseleave", leave);
      clearTimers();
    };
  }, [play, clearTimers]);

  return (
    <div
      ref={hostRef}
      className="sci"
      data-phase={phase}
      data-side={side}
      style={{ width: size }}
      aria-hidden="true"
    >
      <svg className="sci-art" viewBox="0 0 200 330" xmlns="http://www.w3.org/2000/svg">
        <g
          className="sci-rig"
          stroke="#22202B"
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* legs */}
          <rect x="78" y="242" width="19" height="62" rx="9" fill="#3A3746" />
          <rect x="105" y="242" width="19" height="62" rx="9" fill="#332F3E" />
          <path d="M72 300 h30 a6 6 0 0 1 6 6 v6 a5 5 0 0 1 -5 5 h-32 a5 5 0 0 1 -5 -5 v-6 a6 6 0 0 1 6 -6 z" fill="#22202B" />
          <path d="M99 300 h30 a6 6 0 0 1 6 6 v6 a5 5 0 0 1 -5 5 h-32 a5 5 0 0 1 -5 -5 v-6 a6 6 0 0 1 6 -6 z" fill="#22202B" />

          {/* lab coat */}
          <path
            d="M66 132 c0 -14 12 -24 34 0 c22 -24 34 -14 34 0 l10 104 c1 9 -6 14 -16 14 h-56 c-10 0 -17 -5 -16 -14 z"
            fill="#E9EBF2"
          />
          <path d="M100 132 l-7 118 h14 z" fill="#CBD0DE" />
          <path d="M84 148 l16 -14 l16 14 l-16 16 z" fill="#CBD0DE" />

          {/* head */}
          <path d="M92 108 h16 v20 c0 5 -4 8 -8 8 s-8 -3 -8 -8 z" fill="#F0BFA8" />
          <ellipse cx="100" cy="76" rx="35" ry="37" fill="#FFE2D1" />

          {/* goggles */}
          <path d="M66 70 h68" stroke="#3A3746" strokeWidth="7" fill="none" />
          <circle className="sci-lens" cx="84" cy="72" r="14" fill="#EAB308" />
          <circle className="sci-lens" cx="116" cy="72" r="14" fill="#EAB308" />
          <circle cx="88" cy="67" r="4" fill="#FFF" stroke="none" opacity="0.8" />
          <circle cx="120" cy="67" r="4" fill="#FFF" stroke="none" opacity="0.8" />

          {/* mad hair */}
          <path
            d="M64 58 c-6 -20 4 -34 14 -38 c-4 -10 6 -18 14 -14 c4 -10 18 -12 24 -4
               c10 -6 22 2 20 12 c12 2 16 16 8 26 c4 8 -2 16 -8 16
               c-4 -14 -16 -22 -36 -22 c-20 0 -32 10 -36 24 z"
            fill="#3B2E36"
          />

          {/* soot smudge, only after the bang */}
          <g className="sci-soot" stroke="none">
            <ellipse cx="100" cy="92" rx="26" ry="13" fill="#4A4250" opacity="0.55" />
            <ellipse cx="78" cy="84" rx="9" ry="6" fill="#4A4250" opacity="0.4" />
          </g>

          {/* mouth */}
          <path className="sci-mouth" d="M92 98 q8 6 16 0" fill="none" strokeWidth="4" />

          {/* ---- left arm + flask, this is the one that pours ---- */}
          <g className="sci-arm-l">
            <path d="M68 140 c-12 2 -18 12 -16 22 l8 34 c2 9 12 13 19 9 l6 -4 l-8 -46 z" fill="#E9EBF2" />
            <circle cx="76" cy="200" r="11" fill="#FFE2D1" />
            <g className="sci-flask-l">
              <path d="M62 174 h12 v14 l14 30 c3 6 -1 12 -8 12 h-24 c-7 0 -11 -6 -8 -12 l14 -30 z" fill="#D9E6F2" opacity="0.65" />
              <path d="M52 206 l4 -8 h24 l4 8 c3 6 -1 12 -8 12 h-16 c-7 0 -11 -6 -8 -12 z" fill="#22D3EE" />
            </g>
          </g>

          {/* ---- right arm + the flask that receives ---- */}
          <g className="sci-arm-r">
            <path d="M132 140 c12 2 18 12 16 22 l-8 34 c-2 9 -12 13 -19 9 l-6 -4 l8 -46 z" fill="#E9EBF2" />
            <circle cx="124" cy="200" r="11" fill="#FFE2D1" />
            <g className="sci-flask-r">
              <path d="M126 176 h12 v14 l14 30 c3 6 -1 12 -8 12 h-24 c-7 0 -11 -6 -8 -12 l14 -30 z" fill="#D9E6F2" opacity="0.65" />
              <path className="sci-brew" d="M116 208 l4 -8 h24 l4 8 c3 6 -1 12 -8 12 h-16 c-7 0 -11 -6 -8 -12 z" fill="#F472B6" />
            </g>
          </g>

          {/* a thin stream while he pours */}
          <path className="sci-pour" d="M78 196 C92 196 104 198 116 202" fill="none"
                stroke="#22D3EE" strokeWidth="5" />
        </g>

        {/* ---- the bang ---- */}
        <g className="sci-boom" stroke="none">
          <path
            d="M132 196 l14 -30 l6 26 l26 -16 l-14 26 l30 4 l-28 12 l20 20 l-28 -8 l2 28
               l-18 -22 l-14 24 l-4 -28 l-26 10 l14 -22 l-28 -10 l28 -8 z"
            fill="#FDBA31"
          />
          <path
            d="M134 198 l10 -20 l4 18 l18 -11 l-10 18 l20 3 l-19 8 l14 14 l-19 -6 l1 19
               l-12 -15 l-10 16 l-3 -19 l-17 7 l9 -15 l-19 -7 l19 -5 z"
            fill="#FFF0B8"
          />
        </g>

        {/* smoke drifting off afterwards */}
        <g className="sci-smoke" stroke="none" fill="#8C8798">
          <circle className="sci-puff sci-puff-1" cx="140" cy="180" r="13" />
          <circle className="sci-puff sci-puff-2" cx="160" cy="164" r="10" />
          <circle className="sci-puff sci-puff-3" cx="124" cy="160" r="8" />
        </g>
      </svg>

      <div className="sci-bubble">oops… big test 💥</div>
    </div>
  );
};

export default Scientist;
