import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box, Download, Eye, Grid3x3, Instagram, Maximize2, RotateCw, Scan, X,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import { useContent } from "../../content/ContentContext";
import useModal from "../../hooks/useModal";
import { createStage, formatOf, loadModel } from "./engine";

/**
 * 3D & Editing - the character overview, and a viewer to turn each model
 * round like in Blender. Models are added at /admin -> 3D models (any of
 * vrm, glb, gltf, fbx, obj, stl, ply, dae); each can show a Download button
 * or not. (The viewer fetches the whole file either way.)
 * Looks: common/styles/pages/models.css
 */

const HELP = "Left drag: rotate · Right drag / Shift + drag: move · Wheel: zoom · 1 3 7: front, side, top · F: frame";

/* ---- the full-screen viewer ---- */
const Viewer = ({ model, onClose }) => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [state, setState] = useState({ status: "loading", progress: 0, error: "" });
  const [auto, setAuto] = useState(false);
  const [wire, setWire] = useState(false);
  const [grid, setGrid] = useState(true);

  useEffect(() => {
    let alive = true;
    const stage = createStage(canvasRef.current);
    stageRef.current = stage;
    loadModel(model.file, model.format || formatOf(model.file), (p) => alive && setState((s) => ({ ...s, progress: p })))
      .then((result) => {
        if (!alive) return;
        stage.setModel(result);
        setState({ status: "ready", progress: 1, error: "" });
      })
      .catch((err) => alive && setState({ status: "error", progress: 0, error: err.message || "This model couldn't be opened." }));
    return () => { alive = false; stage.dispose(); stageRef.current = null; };
  }, [model]);

  // Blender's number-row views, plus F to frame (Esc to leave comes with useModal)
  const onKey = useCallback((e) => {
    const s = stageRef.current;
    if (!s) return;
    const k = e.key.toLowerCase();
    if (k === "1") s.view(e.ctrlKey ? "back" : "front");
    else if (k === "3") s.view(e.ctrlKey ? "left" : "right");
    else if (k === "7") s.view(e.ctrlKey ? "bottom" : "top");
    else if (k === "f" || k === "home") s.view("home");
    else return;
    e.preventDefault();
  }, []);
  useModal({ onClose, onKey });

  const toggle = (setter, value, apply) => { setter(value); apply(value); };

  return (
    <div className="m3-viewer" role="dialog" aria-modal="true" aria-label={`${model.name} in 3D`}>
      <canvas ref={canvasRef} className="m3-canvas" onContextMenu={(e) => e.preventDefault()} />

      <header className="m3-bar">
        <div className="m3-title">
          <strong>{model.name}</strong>
          {model.credit ? <span>by {model.credit}</span> : null}
        </div>
        <div className="m3-tools">
          <button type="button" onClick={() => stageRef.current?.view("front")} title="Front (1)">Front</button>
          <button type="button" onClick={() => stageRef.current?.view("right")} title="Side (3)">Side</button>
          <button type="button" onClick={() => stageRef.current?.view("top")} title="Top (7)">Top</button>
          <button type="button" onClick={() => stageRef.current?.view("home")} title="Frame (F)"><Maximize2 aria-hidden="true" /></button>
          <span className="m3-sep" />
          <button type="button" aria-pressed={auto} onClick={() => toggle(setAuto, !auto, (v) => stageRef.current?.setAutoRotate(v))} title="Turntable">
            <RotateCw aria-hidden="true" />
          </button>
          <button type="button" aria-pressed={wire} onClick={() => toggle(setWire, !wire, (v) => stageRef.current?.setWireframe(v))} title="Wireframe">
            <Scan aria-hidden="true" />
          </button>
          <button type="button" aria-pressed={grid} onClick={() => toggle(setGrid, !grid, (v) => stageRef.current?.setGrid(v))} title="Floor grid">
            <Grid3x3 aria-hidden="true" />
          </button>
          {model.downloadable === "yes" ? (
            <a className="m3-download" href={`${model.file}?download=1`} download>
              <Download aria-hidden="true" /> Download
            </a>
          ) : null}
          <button type="button" className="m3-close" onClick={onClose} aria-label="Close"><X aria-hidden="true" /></button>
        </div>
      </header>

      {state.status === "loading" ? (
        <div className="m3-loading">
          <p>Loading {model.name}… {Math.round(state.progress * 100)}%</p>
          <span className="m3-progress"><span style={{ width: `${Math.round(state.progress * 100)}%` }} /></span>
        </div>
      ) : null}
      {state.status === "error" ? <p className="m3-loading">{state.error}</p> : null}

      <p className="m3-help">{HELP}</p>
    </div>
  );
};

const Models = () => {
  const { models, links } = useContent();
  const list = models.filter((m) => m.file);
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <PageShell
      className="m3-page"
      title="3D & Editing"
      accent="#A78BFA"
      intro="3D characters I'm learning with, and edited videos. Pick a character to turn it round, zoom in and look at every detail."
      footer="When this shelf fills up, you'll know I'm ready."
    >
      <div className="m3-cards-top">
        {links.instagram ? (
          <a className="m3-insta" href={links.instagram} target="_blank" rel="noopener noreferrer">
            <Instagram aria-hidden="true" />
            <span>
              <strong>Edited videos live on my Instagram</strong>
              <small>Tap to watch the edits →</small>
            </span>
          </a>
        ) : null}
        <div className="m3-note">
          <Box aria-hidden="true" />
          <p>
            <strong>Honest note:</strong> I didn&apos;t make these models - I&apos;m still learning. When I&apos;m done,
            you&apos;ll find many models of my own here, with free downloads. So stay tuned: when lots of models
            show up on this page, that&apos;s your signal I&apos;m ready.
          </p>
        </div>
      </div>

      <div className="pg-tools">
        <h2 className="m3-heading">Character overview</h2>
        <span className="pg-count">{list.length} model{list.length === 1 ? "" : "s"}</span>
      </div>

      {list.length ? (
        <ul className="m3-grid">
          {list.map((m, i) => (
            <li key={`${m.file}-${i}`}>
              <button type="button" className="m3-card" style={{ "--i": i }} onClick={() => setOpen(m)}>
                <span className="m3-card-art">
                  {m.thumb ? <img src={m.thumb} alt="" loading="lazy" draggable={false} /> : <Box className="m3-card-placeholder" aria-hidden="true" />}
                  <span className="m3-badge">{(m.format || formatOf(m.file)).toUpperCase()}</span>
                  {m.downloadable === "yes" ? <span className="m3-badge is-free">Free download</span> : null}
                </span>
                <span className="m3-card-info">
                  <strong>{m.name || "Untitled model"}</strong>
                  {m.credit ? <small>by {m.credit}</small> : null}
                  {m.description ? <em>{m.description}</em> : null}
                  <span className="m3-card-cta"><Eye aria-hidden="true" /> View in 3D</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pg-empty">No models yet - the first ones are on their way.</p>
      )}

      {open ? <Viewer model={open} onClose={close} /> : null}
    </PageShell>
  );
};

export default Models;
