import { useState } from "react";
import { Link } from "react-router-dom";
import Mascot from "./Mascot";

const STATES = [
  { key: "idle", label: "Idle", hint: "breathing, blinking, hair drift" },
  { key: "walk", label: "Walk", hint: "2-step cycle with knee bend" },
  { key: "listen", label: "Listen", hint: "headphones, head bob, notes" },
  { key: "danceListen", label: "Dance + Music", hint: "beside the note, headphones on - the Music card scene" },
];

const MascotDemo = () => {
  const [state, setState] = useState("walk");
  const [bpm, setBpm] = useState(120);
  const [cycle, setCycle] = useState(1.05);
  const [across, setAcross] = useState(false);

  const btn = (active) => ({
    padding: "0.5rem 1.1rem",
    borderRadius: "9999px",
    border: active ? "2px solid #EAB308" : "2px solid #3F3F46",
    background: active ? "#EAB308" : "#27272A",
    color: active ? "#1A1A1D" : "#D1D5DB",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "all .2s ease",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1D", color: "#fff", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #EAB308",
            paddingBottom: "0.75rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Mascot 🎧</h1>
          <Link
            to="/"
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.96)",
              color: "#000",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.85rem",
            }}
          >
            Back Home
          </Link>
        </div>

        {/* stage */}
        <div
          style={{
            background: "linear-gradient(180deg,#27272A 0%,#1A1A1D 100%)",
            border: "1px solid #3F3F46",
            borderRadius: 16,
            padding: "2rem 1rem 1rem",
            display: "flex",
            justifyContent: across ? "flex-start" : "center",
            alignItems: "flex-end",
            minHeight: 420,
            overflow: "hidden",
          }}
        >
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
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", margin: "1.5rem 0 1rem" }}>
          {STATES.map((s) => (
            <button key={s.key} style={btn(state === s.key)} onClick={() => setState(s.key)}>
              {s.label}
            </button>
          ))}
          <button style={btn(across)} onClick={() => setAcross((v) => !v)}>
            Walk across
          </button>
        </div>

        <p style={{ color: "#9CA3AF", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
          {STATES.find((s) => s.key === state)?.hint}
        </p>

        <div style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
          <label style={{ fontSize: "0.9rem", color: "#D1D5DB" }}>
            Walk cycle: {cycle.toFixed(2)}s
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={cycle}
              onChange={(e) => setCycle(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#EAB308" }}
            />
          </label>
          <label style={{ fontSize: "0.9rem", color: "#D1D5DB" }}>
            Music tempo: {bpm} BPM
            <input
              type="range"
              min="60"
              max="180"
              step="1"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: "#EAB308" }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default MascotDemo;
