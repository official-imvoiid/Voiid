import { useId } from "react";
import "./Mascot.css";

/**
 * Mascot - a cartoon character drawn entirely in SVG and animated in CSS.
 *
 * No images, no sprite sheets, no animation library: the whole thing is one
 * inline vector rig, so it stays sharp at any size and costs nothing to load.
 *
 *   <Mascot state="walk" size={260} />
 *   <Mascot state="listen" bpm={128} />
 *   <Mascot state="walk" walkAcross travelDistance={320} />
 *
 * Props
 *   state           "idle" | "walk" | "sit" | "listen" | "sitListen"
 *                   | "dance" | "danceListen"
 *   size            rendered width in px (height follows the 2:3 viewBox)
 *   bpm             beats per minute for the listen-state head bob
 *   cycle           seconds for one full walk cycle (2 steps)
 *   walkAcross      also translate across the parent, turning at each end
 *   travelDistance  px to travel when walkAcross is on
 *   travelDuration  seconds for a full there-and-back trip
 */
const Mascot = ({
  state = "idle",
  size = 220,
  bpm = 120,
  cycle = 1.05,
  walkAcross = false,
  travelDistance = 240,
  travelDuration = 6,
  className = "",
  style = {},
  ...rest
}) => {
  // Unique per instance so two mascots on one page cannot clash over gradient ids.
  const uid = useId().replace(/:/g, "");
  const id = (name) => `${name}-${uid}`;

  // Pose, arm action and music layer independently, so a seated character can
  // also be reaching for the headphones, or already wearing them.
  const dancing = state === "dance" || state === "danceListen";
  const seated = state === "sit" || state === "sitListen";
  const music =
    state === "listen" || state === "sitListen" || state === "danceListen";
  const pose = dancing ? "dance" : seated ? "sit" : "stand";

  const label =
    state === "walk" ? "Cartoon mascot walking"
    : dancing && music ? "Cartoon mascot dancing to music on headphones"
    : dancing ? "Cartoon mascot dancing"
    : music && seated ? "Cartoon mascot sitting and listening to music on headphones"
    : music ? "Cartoon mascot listening to music on headphones"
    : seated ? "Cartoon mascot sitting down"
    : "Cartoon mascot standing";

  // Clock face inside the gold eye.  The iris is an ellipse, so the dial is
  // elliptical too - a circular tick ring would sit proud of the iris at top
  // and bottom and float inside it at the sides.  12 markers, heavier at the
  // quarters, laid on the rim.
  const DIAL = { cx: 180, cy: 90, rx: 7.5, ry: 11.8 };
  const clockTicks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const sin = Math.sin(a);
    const cos = Math.cos(a);
    const quarter = i % 3 === 0;
    const inner = quarter ? 0.6 : 0.75;
    return (
      <line
        key={i}
        x1={(DIAL.cx + sin * DIAL.rx * inner).toFixed(2)}
        y1={(DIAL.cy - cos * DIAL.ry * inner).toFixed(2)}
        x2={(DIAL.cx + sin * DIAL.rx).toFixed(2)}
        y2={(DIAL.cy - cos * DIAL.ry).toFixed(2)}
        stroke="#4A3005"
        strokeWidth={quarter ? 1.9 : 1}
        strokeLinecap="round"
        opacity="0.95"
      />
    );
  });

  return (
    <div
      className={`m-root ${className}`}
      data-state={state}
      data-pose={pose}
      data-music={music ? "true" : "false"}
      data-travel={walkAcross ? "true" : "false"}
      style={{
        width: size,
        "--m-cycle": `${cycle}s`,
        "--m-beat": `${60 / bpm}s`,
        "--m-dist": `${travelDistance}px`,
        "--m-travel": `${travelDuration}s`,
        ...style,
      }}
      {...rest}
    >
      <svg
        className="m-svg"
        viewBox="0 0 320 480"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={id("hair")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A3944" />
            <stop offset="45%" stopColor="#372A32" />
            <stop offset="100%" stopColor="#261D24" />
          </linearGradient>
          <linearGradient id={id("dress")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D8283A" />
            <stop offset="60%" stopColor="#C01C2E" />
            <stop offset="100%" stopColor="#971423" />
          </linearGradient>
          <linearGradient id={id("corset")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8E1322" />
            <stop offset="45%" stopColor="#CB2033" />
            <stop offset="100%" stopColor="#9A1526" />
          </linearGradient>
          <radialGradient id={id("eyeR")} cx="0.5" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#FF7A68" />
            <stop offset="45%" stopColor="#D92B2B" />
            <stop offset="100%" stopColor="#6E0D12" />
          </radialGradient>
          <radialGradient id={id("eyeG")} cx="0.5" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="45%" stopColor="#E8A62B" />
            <stop offset="100%" stopColor="#7A4E06" />
          </radialGradient>

          {/* eye sockets, so the irises can never spill past the lids */}
          <clipPath id={id("clipL")}>
            <path d="M131 82 Q140 72 149 82 L149 95 Q147 104 140 104 Q133 104 131 95 Z" />
          </clipPath>
          <clipPath id={id("clipR")}>
            <path d="M171 82 Q180 72 189 82 L189 95 Q187 104 180 104 Q173 104 171 95 Z" />
          </clipPath>

          {/* one eighth-note, reused by every floating note */}
          <g id={id("note")}>
            <ellipse cx="0" cy="0" rx="6.4" ry="4.8" transform="rotate(-18)" />
            <rect x="4.4" y="-27" width="2.8" height="27" rx="1.4" />
            <path d="M7.2 -27 c7 3 11 7 10 14 c-3 -6 -6 -8 -10 -9 z" />
          </g>
        </defs>

        {/* ground contact shadow */}
        <ellipse className="m-shadow" cx="160" cy="466" rx="62" ry="9" fill="#000" opacity="0.26" />

        <g className="m-seat">
        <g
          className="m-bob"
          stroke="#241D28"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* ============ hair mass behind the head ============ */}
          <g className="m-hair-back">
            <path
              d="M160 24 C118 24 104 56 106 100 C107 130 112 160 120 190 L200 190
                 C208 160 213 130 214 100 C216 56 202 24 160 24 Z"
              fill={`url(#${id("hair")})`}
            />
          </g>

          {/* ============ twin tails - long, high, tapering ============ */}
          <g className="m-tail-l">
            {/* main mass */}
            <path
              d="M114 38 C88 46 70 76 64 118 C58 164 62 218 74 278
                 C78 300 90 314 103 311 C114 308 118 296 114 282
                 C99 222 93 166 99 128 C104 92 118 68 136 56 Z"
              fill={`url(#${id("hair")})`}
            />
            {/* inner shine, follows the mass */}
            <path
              d="M100 74 C87 106 84 154 91 206"
              fill="none"
              stroke="#4A3A46"
              strokeWidth="3"
              opacity="0.22"
            />
            {/* layered wisps - these carry the flow */}
            <g className="m-wisp m-wisp-l1">
              <path
                d="M112 50 C92 64 78 96 75 134 C72 176 77 222 86 266
                   C88 277 96 282 101 277 C106 272 105 263 103 254
                   C94 212 90 172 94 138 C97 106 104 82 118 66 Z"
                fill={`url(#${id("hair")})`}
              />
            </g>
            <g className="m-wisp m-wisp-l2">
              <path
                d="M104 62 C88 82 79 112 77 148 C75 186 80 228 88 264
                   C90 273 96 276 99 271 C102 266 101 259 100 252
                   C93 216 90 180 93 150 C96 120 100 96 110 76 Z"
                fill={`url(#${id("hair")})`}
              />
            </g>
          </g>
          <g className="m-tail-r">
            {/* main mass - longer and fuller than the left */}
            <path
              d="M206 48 C234 57 254 90 260 138 C266 190 262 252 248 320
                 C244 346 229 362 215 358 C203 355 199 341 204 326
                 C221 254 227 190 221 146 C216 104 200 78 180 66 Z"
              fill={`url(#${id("hair")})`}
            />
            <path
              d="M222 88 C236 124 239 182 231 246"
              fill="none"
              stroke="#4A3A46"
              strokeWidth="3"
              opacity="0.22"
            />
            <g className="m-wisp m-wisp-r1">
              <path
                d="M208 60 C230 76 244 110 247 152 C250 198 245 254 236 304
                   C234 317 226 323 221 317 C216 311 217 301 219 291
                   C229 244 233 198 229 158 C226 122 218 96 202 78 Z"
                fill={`url(#${id("hair")})`}
              />
            </g>
            <g className="m-wisp m-wisp-r2">
              <path
                d="M216 72 C234 94 243 126 245 166 C247 208 242 254 234 296
                   C232 306 226 309 223 303 C220 297 221 290 222 282
                   C229 242 232 202 229 168 C226 134 222 106 210 86 Z"
                fill={`url(#${id("hair")})`}
              />
            </g>
          </g>

          {/* ============ far arm (behind the torso) ============ */}
          <g className="m-arm-l">
            <path
              d="M122 140 c12 -5 22 1 23 13 l7 58 c1 11 -1 19 -6 26 l-9 13
                 c-5 7 -15 6 -19 -2 l-6 -13 c-4 -9 -4 -18 -2 -29 l7 -55 z"
              fill="#372C3E"
            />
            <path
              d="M106 216 c-2 8 -1 14 3 20 l16 3 c5 -6 6 -12 5 -20 z"
              fill="#251E2A"
            />
            <ellipse cx="116" cy="246" rx="11" ry="13" fill="#FFE2D1" />
          </g>

          {/* ============ legs ============ */}
          <g className="m-leg-l">
            <rect x="137" y="226" width="22" height="94" rx="11" fill="#332A3A" />
            <g className="m-shin-l">
              <rect x="138" y="304" width="19" height="102" rx="9.5" fill="#332A3A" />
              {/* boot */}
              <path
                d="M136 352 h22 a4 4 0 0 1 4 4 v80 c3 2 5 5 5 10 v5
                   a4 4 0 0 1 -4 4 h-32 a4 4 0 0 1 -4 -4 v-5
                   c0 -5 2 -8 5 -10 v-80 a4 4 0 0 1 4 -4 z"
                fill="#2B2430"
              />
              <path d="M140 368 l16 9 M140 386 l16 9"
                    stroke="#4A3E52" strokeWidth="2.2" fill="none" opacity="0.7" />
              <path d="M156 368 l-16 9 M156 386 l-16 9"
                    stroke="#4A3E52" strokeWidth="2.2" fill="none" opacity="0.7" />
              <path d="M133 437 h30" stroke="#4A3E52" strokeWidth="2.2" fill="none" opacity="0.7" />
            </g>
          </g>

          <g className="m-leg-r">
            <rect x="161" y="226" width="22" height="94" rx="11" fill="#3B3143" />
            <g className="m-shin-r">
              <rect x="162" y="304" width="19" height="102" rx="9.5" fill="#3B3143" />
              <path
                d="M161 352 h22 a4 4 0 0 1 4 4 v80 c3 2 5 5 5 10 v5
                   a4 4 0 0 1 -4 4 h-32 a4 4 0 0 1 -4 -4 v-5
                   c0 -5 2 -8 5 -10 v-80 a4 4 0 0 1 4 -4 z"
                fill="#342C3A"
              />
              <path d="M165 368 l16 9 M165 386 l16 9"
                    stroke="#584A60" strokeWidth="2.2" fill="none" opacity="0.7" />
              <path d="M181 368 l-16 9 M181 386 l-16 9"
                    stroke="#584A60" strokeWidth="2.2" fill="none" opacity="0.7" />
              <path d="M158 437 h30" stroke="#584A60" strokeWidth="2.2" fill="none" opacity="0.7" />
            </g>
          </g>

          {/* ============ torso / corset ============ */}
          <g className="m-torso">
            <path
              d="M128 152 c0 -10 9 -15 20 -12 c6 2 8 6 12 6 s6 -4 12 -6
                 c11 -3 20 2 20 12 l-6 72 c-2 7 -12 11 -26 11 s-24 -4 -26 -11 z"
              fill={`url(#${id("corset")})`}
            />
            <path
              d="M128 154 q8 -9 16 0 q8 -9 16 0 q8 -9 16 0 q8 -9 16 0"
              fill="none"
              stroke="#2B2430"
              strokeWidth="6"
            />
            <path d="M150 172 l20 13 M150 194 l20 13"
                  stroke="#D99AA8" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M170 172 l-20 13 M170 194 l-20 13"
                  stroke="#D99AA8" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M152 160 l-10 -6 v12 z M168 160 l10 -6 v12 z" fill="#E3384A" />
            <circle cx="160" cy="160" r="4" fill="#E3384A" />
          </g>

          {/* ============ skirt ============ */}
          <g className="m-skirt">
            <path
              d="M136 218 C126 248 106 284 84 316 c-4 7 -2 12 7 14
                 c22 6 45 9 69 9 s47 -3 69 -9 c9 -2 11 -7 7 -14
                 c-22 -32 -42 -68 -52 -98 z"
              fill={`url(#${id("dress")})`}
            />
            <path
              d="M160 224 c-6 28 -10 62 -10 96 h20 c0 -34 -4 -68 -10 -96 z"
              fill="#3A2F42"
              opacity="0.85"
            />
            <path
              d="M92 306 q9 12 18 0 q9 12 18 0 q9 12 18 0 q9 12 18 0
                 q9 12 18 0 q9 12 18 0 q9 12 18 0"
              fill="none"
              stroke="#2B2430"
              strokeWidth="7"
            />
            <path
              d="M82 322 q11 16 22 4 q11 16 22 4 q11 16 22 4 q11 16 22 -4
                 q11 -12 22 -4 q11 12 22 -4 q11 -12 20 -4
                 l6 10 c-24 8 -52 12 -81 12 s-57 -4 -81 -12 z"
              fill="#2B2430"
            />
          </g>

          {/* ============ waist bow ============ */}
          <g className="m-bow">
            <path d="M160 226 l-30 -12 c-7 -3 -12 2 -11 9 l3 14 c1 7 7 10 13 7 z"
                  fill="#D42438" />
            <path d="M160 226 l30 -12 c7 -3 12 2 11 9 l-3 14 c-1 7 -7 10 -13 7 z"
                  fill="#D42438" />
            <path d="M152 234 l-8 40 c-1 5 4 8 8 5 l8 -6 l8 6 c4 3 9 0 8 -5 l-8 -40 z"
                  fill="#B81A2C" />
            <rect x="151" y="219" width="18" height="16" rx="5" fill="#8E1322" />
          </g>

          {/* ============ near arm (in front of the torso) ============ */}
          <g className="m-arm-r">
            <path
              d="M198 140 c-12 -5 -22 1 -23 13 l-7 58 c-1 11 1 19 6 26 l9 13
                 c5 7 15 6 19 -2 l6 -13 c4 -9 4 -18 2 -29 l-7 -55 z"
              fill="#3E3246"
            />
            <path
              d="M214 216 c2 8 1 14 -3 20 l-16 3 c-5 -6 -6 -12 -5 -20 z"
              fill="#2A2230"
            />
            <ellipse cx="204" cy="246" rx="11" ry="13" fill="#FFE2D1" />
          </g>

          {/* ============ head ============ */}
          <g className="m-head">
            {/* neck */}
            <path d="M150 106 h20 v20 c0 6 -4 10 -10 10 s-10 -4 -10 -10 z" fill="#F0BFA8" />

            {/* face - narrow with a soft pointed chin */}
            <path
              d="M160 34 c26 0 36 20 36 44 c0 18 -6 32 -18 42 c-7 6 -13 9 -18 9
                 s-11 -3 -18 -9 c-12 -10 -18 -24 -18 -42 c0 -24 10 -44 36 -44 z"
              fill="#FFE2D1"
            />
            <ellipse cx="124" cy="86" rx="6" ry="9" fill="#FFE2D1" />
            <ellipse cx="196" cy="86" rx="6" ry="9" fill="#FFE2D1" />

            {/* blush */}
            <ellipse cx="133" cy="101" rx="9.5" ry="4.8" fill="#FF8E93" opacity="0.6" stroke="none" />
            <ellipse cx="187" cy="101" rx="9.5" ry="4.8" fill="#FF8E93" opacity="0.6" stroke="none" />

            {/* ---- open eyes (idle + walk) ---- */}
            <g className="m-eyes-open">
              {/* left eye - red */}
              <path
                d="M131 82 Q140 72 149 82 L149 95 Q147 104 140 104 Q133 104 131 95 Z"
                fill="#FFFFFF"
                strokeWidth="1.7"
              />
              <g clipPath={`url(#${id("clipL")})`} stroke="none">
                <ellipse cx="140" cy="90" rx="8.1" ry="12.8" fill={`url(#${id("eyeR")})`} />
                <ellipse cx="140" cy="91" rx="3.9" ry="6.6" fill="#2A0E12" />
                <circle cx="143.5" cy="83" r="3.5" fill="#FFF" />
                <circle cx="136" cy="97" r="1.9" fill="#FFF" opacity="0.85" />
              </g>
              {/* upper lash, heaviest at the outer corner */}
              <path d="M128 83 Q140 69 150 80" fill="none" strokeWidth="6.2" />
              <path d="M128 83 l-5 -6" fill="none" strokeWidth="4" />

              {/* right eye - gold, with the clock face */}
              <path
                d="M171 82 Q180 72 189 82 L189 95 Q187 104 180 104 Q173 104 171 95 Z"
                fill="#FFFFFF"
                strokeWidth="1.7"
              />
              <g clipPath={`url(#${id("clipR")})`} stroke="none">
                <ellipse cx="180" cy="90" rx="8.1" ry="12.8" fill={`url(#${id("eyeG")})`} />
                {/* dial rings */}
                <ellipse cx="180" cy="90" rx="7.5" ry="11.8" fill="none"
                         stroke="#6B4406" strokeWidth="0.9" opacity="0.85" />
                <ellipse cx="180" cy="90" rx="4.2" ry="6.6" fill="none"
                         stroke="#6B4406" strokeWidth="0.7" opacity="0.55" />
                <g>{clockTicks}</g>
                {/* pupil kept small so the dial stays legible */}
                <ellipse cx="180" cy="90" rx="2.7" ry="4.3" fill="#2E1D04" />
                {/* hands: hour toward 10, minute toward 1 */}
                <path d="M180 90 L176.3 84.4" stroke="#33220A"
                      strokeWidth="2" strokeLinecap="round" />
                <path d="M180 90 L184.3 81.8" stroke="#33220A"
                      strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="180" cy="90" r="1.25" fill="#33220A" />
                <circle cx="183.6" cy="82.4" r="2.9" fill="#FFF" />
                <circle cx="176" cy="97" r="1.9" fill="#FFF" opacity="0.85" />
              </g>
              <path d="M192 83 Q180 69 170 80" fill="none" strokeWidth="6.2" />
              <path d="M192 83 l5 -6" fill="none" strokeWidth="4" />
            </g>

            {/* ---- happy closed eyes (listen) ---- */}
            <g className="m-eyes-happy" fill="none" strokeWidth="5">
              <path d="M131 94 q9 -14 18 0" />
              <path d="M171 94 q9 -14 18 0" />
            </g>

            {/* nose + small closed smile */}
            <path d="M160 108 l2.5 2.5 l-2.5 1.5" fill="none" strokeWidth="2" opacity="0.5" />
            <path d="M153 116 q7 6 14 0" fill="none" strokeWidth="3" />

            {/* long side locks framing the face */}
            <path
              d="M116 58 C107 94 106 146 110 196 C111 205 121 208 125 200
                 C119 152 118 100 126 64 Z"
              fill={`url(#${id("hair")})`}
            />
            <path
              d="M204 58 C213 94 214 146 210 196 C209 205 199 208 195 200
                 C201 152 202 100 194 64 Z"
              fill={`url(#${id("hair")})`}
            />

            {/* blunt fringe with soft pointed strands, parted at centre */}
            <path
              d="M105 86
                 C101 42 124 12 160 12
                 C196 12 219 42 215 86
                 C212 78 209 72 205 68
                 C202 72 199 76 196 80
                 C192 74 188 70 184 67
                 C181 71 178 75 175 79
                 C171 73 166 69 160 67
                 C154 69 149 73 145 79
                 C142 75 139 71 136 67
                 C132 70 128 74 124 80
                 C121 76 118 72 115 68
                 C111 72 108 78 105 86 Z"
              fill={`url(#${id("hair")})`}
            />

            {/* lace headband across the crown */}
            <path d="M124 42 q36 -26 72 0" fill="none" stroke="#2B2430" strokeWidth="8" />
            <path
              d="M127 37 q7 -8 13 -4 q7 -8 14 -4 q7 -7 13 -3 q7 -6 13 -2 q7 -5 12 1"
              fill="none"
              stroke="#4A3D52"
              strokeWidth="3.5"
            />

            {/* frilled hair bands + red tassels holding the twin tails */}
            <g>
              <ellipse cx="110" cy="49" rx="15" ry="8.2" fill="#2B2430" />
              <path d="M98 52 q6 6 12 1 q6 6 12 0" fill="none"
                    stroke="#4A3D52" strokeWidth="2.6" />
              <path d="M105 58 l-3 17 M113 58 l1 19" fill="none"
                    stroke="#D42438" strokeWidth="2.8" />
              <circle cx="102" cy="77" r="2.8" fill="#E3384A" strokeWidth="2" />
              <circle cx="114" cy="79" r="2.8" fill="#E3384A" strokeWidth="2" />
            </g>
            <g>
              <ellipse cx="210" cy="60" rx="16" ry="8.8" fill="#2B2430" />
              <path d="M222 63 q-6 6 -12 1 q-6 6 -12 0" fill="none"
                    stroke="#4A3D52" strokeWidth="2.6" />
              <path d="M215 69 l3 17 M207 69 l-1 19" fill="none"
                    stroke="#D42438" strokeWidth="2.8" />
              <circle cx="218" cy="88" r="2.8" fill="#E3384A" strokeWidth="2" />
              <circle cx="206" cy="90" r="2.8" fill="#E3384A" strokeWidth="2" />
            </g>

            {/* ---- headphones (listen state) ---- */}
            <g className="m-cans">
              <path
                d="M106 92 C106 42 130 16 160 16 C190 16 214 42 214 92"
                fill="none"
                stroke="#EAB308"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M106 92 C106 42 130 16 160 16 C190 16 214 42 214 92"
                fill="none"
                stroke="#FFDD55"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.75"
              />
              <rect x="94" y="76" width="26" height="36" rx="13" fill="#2B2430" />
              <rect x="99" y="82" width="16" height="24" rx="8" fill="#EAB308" stroke="none" />
              <rect x="200" y="76" width="26" height="36" rx="13" fill="#2B2430" />
              <rect x="205" y="82" width="16" height="24" rx="8" fill="#EAB308" stroke="none" />
            </g>
          </g>

          {/* ============ floating music notes ============ */}
          <g fill="#EAB308" stroke="none">
            <g transform="translate(250 118)">
              <g className="m-note m-note-1">
                <use href={`#${id("note")}`} transform="scale(2.1)" />
              </g>
            </g>
            <g transform="translate(282 176)">
              <g className="m-note m-note-2">
                <use href={`#${id("note")}`} transform="scale(1.5)" />
              </g>
            </g>
            <g transform="translate(58 146)">
              <g className="m-note m-note-3 m-note-left">
                <use href={`#${id("note")}`} transform="scale(1.85)" />
              </g>
            </g>
            <g transform="translate(30 100)">
              <g className="m-note m-note-4 m-note-left">
                <use href={`#${id("note")}`} transform="scale(1.3)" />
              </g>
            </g>
          </g>
        </g>
        </g>
      </svg>
    </div>
  );
};

export default Mascot;
