import { useState } from "react";
import Mascot from "../components/Mascot";
import BackHome from "../components/BackHome";

const STATES = [
  { key: "idle", label: "Idle", hint: "breathing, blinking, hair drift" },
  { key: "walk", label: "Walk", hint: "2-step cycle with knee bend" },
  { key: "listen", label: "Listen", hint: "headphones, head bob, notes" },
  { key: "danceListen", label: "Dance + Music", hint: "beside the note, headphones on - the Music card scene" },
];

/* Looks: common/styles/pages/mascot-demo.css */
const MascotDemo = () => {
  const [state, setState] = useState("walk");
  const [bpm, setBpm] = useState(120);
  const [cycle, setCycle] = useState(1.05);
  const [across, setAcross] = useState(false);

  const btn = (active) => `md-btn${active ? " is-active" : ""}`;

  return (
    <div className="md-page">
      <div className="md-shell">
        <div className="md-head">
          <h1 className="md-title">Mascot 🎧</h1>
          <BackHome />
        </div>

        {/* stage */}
        <div className={`md-stage${across ? " is-across" : ""}`}>
          <Mascot
            state={state}
            size={260}
            bpm={bpm}
            cycle={cycle}
            walkAcross={across}
            travelDistance={360}
            travelDuration={8}
          />
        </div>

        {/* controls */}
        <div className="md-controls">
          {STATES.map((s) => (
            <button key={s.key} className={btn(state === s.key)} onClick={() => setState(s.key)}>
              {s.label}
            </button>
          ))}
          <button className={btn(across)} onClick={() => setAcross((v) => !v)}>
            Walk across
          </button>
        </div>

        <p className="md-hint">{STATES.find((s) => s.key === state)?.hint}</p>

        <div className="md-sliders">
          <label className="md-label">
            Walk cycle: {cycle.toFixed(2)}s
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={cycle}
              onChange={(e) => setCycle(parseFloat(e.target.value))}
              className="md-range"
            />
          </label>
          <label className="md-label">
            Music tempo: {bpm} BPM
            <input
              type="range"
              min="60"
              max="180"
              step="1"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="md-range"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default MascotDemo;
