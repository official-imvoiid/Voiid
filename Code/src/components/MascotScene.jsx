import { useCallback, useEffect, useRef, useState } from "react";
import Mascot from "./Mascot";
import "./MascotScene.css";

/**
 * MascotScene - the cinematic for the Music card.
 *
 * She walks in from the side, stops beside the music note, the headphones
 * drop in from above onto her head, and she dances to the beat.
 * She is only present while the cursor is on the card.
 *
 *   <div className="card music-card">
 *     <MascotScene size={125} />
 *   </div>
 *
 * The host card needs `position: relative` and `overflow: hidden`.
 */
const PHASE_STATE = {
  away: "walk",
  walking: "walk",
  arriving: "dance",
  dancing: "danceListen",
};

const MascotScene = ({
  size = 125,
  walkMs = 1600,
  settleMs = 320,
  side = "left",
}) => {
  const [phase, setPhase] = useState("away");
  const hostRef = useRef(null);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const play = useCallback(() => {
    clearTimers();
    // Always restart from off-card, so a re-hover replays the whole thing.
    setPhase("away");
    const at = (ms, next) => timers.current.push(setTimeout(() => setPhase(next), ms));
    at(40, "walking");
    at(walkMs, "arriving");
    at(walkMs + settleMs, "dancing");
  }, [clearTimers, walkMs, settleMs]);

  // She only shows up while the cursor is on the card - walking in on hover
  // and stepping back off when it leaves.
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
    };
  }, [play, clearTimers]);

  // Shove the card's icon aside the moment she reaches it, and let it swing
  // back when she leaves. Driven inline rather than through a stylesheet rule
  // because the icon already carries a keyframe animation, and an animation
  // beats any declaration the cascade could hand it.
  useEffect(() => {
    const card = hostRef.current?.parentElement;
    const note = card?.querySelector(".music-note") || card?.querySelector(".card-title");
    if (!note) return undefined;

    card.dataset.mascot = phase;
    const pushed = phase === "arriving" || phase === "dancing";
    note.style.animation = "none";
    note.style.transformBox = "border-box";
    note.style.transformOrigin = "center";
    note.style.transition = "transform .55s cubic-bezier(.34,1.32,.64,1)";
    note.style.transform = pushed ? "translateX(34%) rotate(9deg)" : "translateX(0) rotate(0deg)";

    return () => {
      delete card.dataset.mascot;
      note.style.transform = "";
      note.style.transition = "";
      note.style.animation = "";
      note.style.transformBox = "";
      note.style.transformOrigin = "";
    };
  }, [phase]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      ref={hostRef}
      className="ms-host"
      data-phase={phase}
      data-side={side}
      style={{
        "--ms-walk": `${walkMs}ms`,
      }}
      aria-hidden="true"
    >
      <div className="ms-mover">
        <Mascot state={PHASE_STATE[phase]} size={size} cycle={0.78} bpm={124} />
      </div>

      {/* Lyrics live out here rather than inside the SVG: in a 320-unit
          viewBox drawn at ~108px, even a font-size of 40 lands at about 13
          real pixels. As DOM text they are sized in actual page pixels. */}
      {phase === "dancing" && (
        <div className="ms-lyrics">
          <span className="ms-lyric ms-lyric-1">kuru kurumi ~</span>
          <span className="ms-lyric ms-lyric-2">kuru kurumi ~</span>
        </div>
      )}
    </div>
  );
};

export default MascotScene;
