import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minus, MoveHorizontal, Plus } from "lucide-react";

/**
 * ZoomImage - an image you can zoom and move around, for big mind maps.
 *
 *   wheel / pinch     zoom in or out, around the pointer
 *   drag              move around
 *   double-click      zoom in on that spot (again to go back)
 *   buttons           - / + / fit the width / the whole image
 *
 * Tall images open fitted to the width, at the top; others open whole.
 * Looks: common/styles/pages/notes.css (.zi-*)
 */

const MAX_ZOOM = 2;        // up to 2x the image's real size - plenty to read small text

/* Why a canvas: a mind map can be 5000 x 25000 pixels. Shown as a zoomed
   <img>, the browser tries to paint the whole thing at the zoomed size and
   runs out of memory - the tab crashes. Here only the part on screen is
   painted, onto a screen-sized canvas, so zooming costs the same at any
   level. Two small pre-shrunk copies keep the zoomed-out views quick. */
const LEVELS = [0.25, 0.0625];   // pre-shrunk copies, as a share of the full size

function shrink(source, w, h, k) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return c;
}

const ZoomImage = ({ src, alt }) => {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const sources = useRef(null);                            // [{ k, img }] full size + shrunk copies
  const [size, setSize] = useState(null);                  // the image's real size
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);

  const box = () => {
    const el = stageRef.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 1, h: 1 };
  };

  // keep the image on screen: centred when smaller than the stage, edges
  // never pulled inside it when bigger
  const clamp = useCallback((v) => {
    if (!size) return v;
    const { w, h } = box();
    const iw = size.w * v.s;
    const ih = size.h * v.s;
    const x = iw <= w ? (w - iw) / 2 : Math.min(0, Math.max(w - iw, v.x));
    const y = ih <= h ? (h - ih) / 2 : Math.min(0, Math.max(h - ih, v.y));
    return { s: v.s, x, y };
  }, [size]);

  const fits = useCallback(() => {
    const { w, h } = box();
    const width = w / size.w;
    const whole = Math.min(w / size.w, h / size.h);
    return { width, whole, min: Math.min(whole, width) * 0.5 };
  }, [size]);

  const fitWidth = useCallback(() => setView(clamp({ s: fits().width, x: 0, y: 0 })), [clamp, fits]);
  const fitWhole = useCallback(() => setView(clamp({ s: fits().whole, x: 0, y: 0 })), [clamp, fits]);

  // first look: tall images at full width from the top, others whole
  useEffect(() => {
    if (!size) return;
    const { w, h } = box();
    if (size.h / size.w > (h / w) * 1.3) fitWidth(); else fitWhole();
  }, [size]); // eslint-disable-line react-hooks/exhaustive-deps

  // zoom to scale `ns`, keeping the point (px, py) of the stage still
  const zoomAt = useCallback((ns, px, py) => {
    const v = viewRef.current;
    const s = Math.min(MAX_ZOOM, Math.max(fits().min, ns));
    const k = s / v.s;
    setView(clamp({ s, x: px - (px - v.x) * k, y: py - (py - v.y) * k }));
  }, [clamp, fits]);

  const zoomBy = (factor) => {
    const { w, h } = box();
    zoomAt(viewRef.current.s * factor, w / 2, h / 2);
  };

  // the wheel needs a non-passive listener so the page doesn't scroll too
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !size) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(viewRef.current.s * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [size, zoomAt]);

  /* ---- dragging, and pinching with two fingers ---- */
  const local = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    pointers.current.set(e.pointerId, local(e));
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: viewRef.current.s };
      drag.current = null;
    } else {
      const p = local(e);
      drag.current = { x: p.x - viewRef.current.x, y: p.y - viewRef.current.y };
      setDragging(true);
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, local(e));
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(pinch.current.s * (d / pinch.current.d), (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else if (drag.current) {
      // read the drag start now - by the time React runs the update below,
      // the pointer may already be up and drag.current cleared
      const p = local(e);
      const start = drag.current;
      setView((v) => clamp({ s: v.s, x: p.x - start.x, y: p.y - start.y }));
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!pointers.current.size) { drag.current = null; setDragging(false); }
  };
  const onDoubleClick = (e) => {
    const p = local(e);
    const { whole, width } = fits();
    const base = Math.max(whole, width);
    zoomAt(viewRef.current.s > base * 1.4 ? base : viewRef.current.s * 2.5, p.x, p.y);
  };

  // load the image off-screen, then make the shrunk copies
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!alive) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      // each copy is made from the one before (cheaper than from the full image)
      const list = [{ k: 1, img, w, h }];
      for (const k of LEVELS) {
        if (w * k < 200) break;                             // small images need no copies
        const prev = list[list.length - 1];
        const copy = shrink(prev.img, prev.w, prev.h, k / prev.k);
        list.push({ k, img: copy, w: copy.width, h: copy.height });
      }
      sources.current = list;
      setSize({ w, h });
    };
    img.onerror = () => alive && setFailed(true);
    img.src = src;
    return () => { alive = false; img.src = ""; sources.current = null; };
  }, [src]);

  // paint what's on screen
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const list = sources.current;
    if (!canvas || !stage || !list || !size) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";

    const { s, x, y } = viewRef.current;
    // the smallest copy that is still sharp at this zoom
    const src0 = [...list].reverse().find((l) => l.k >= s * dpr) || list[0];
    // the part of the image that is on screen, in full-size pixels
    const sx = Math.max(0, -x / s);
    const sy = Math.max(0, -y / s);
    const ex = Math.min(size.w, (w - x) / s);
    const ey = Math.min(size.h, (h - y) / s);
    if (ex <= sx || ey <= sy) return;
    ctx.drawImage(
      src0.img,
      sx * src0.k, sy * src0.k, (ex - sx) * src0.k, (ey - sy) * src0.k,
      x + sx * s, y + sy * s, (ex - sx) * s, (ey - sy) * s,
    );
  }, [size]);

  useEffect(() => {
    const id = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(id);
  }, [view, paint]);

  // repaint if the stage changes size
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const ro = new ResizeObserver(() => { setView((v) => clamp(v)); requestAnimationFrame(paint); });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [clamp, paint]);

  const percent = size ? Math.round(view.s * 100) : 100;

  return (
    <div className="zi">
      <div
        ref={stageRef}
        className={`zi-stage${dragging ? " is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <canvas ref={canvasRef} className="zi-canvas" role="img" aria-label={alt} />
        {!size ? <p className="zi-loading">{failed ? "This image couldn't be opened." : "Loading…"}</p> : null}
      </div>

      {/* nothing to zoom until the image has loaded */}
      <div className="zi-tools" role="toolbar" aria-label="Zoom">
        <button type="button" disabled={!size} onClick={() => zoomBy(1 / 1.4)} aria-label="Zoom out"><Minus aria-hidden="true" /></button>
        <span className="zi-level">{percent}%</span>
        <button type="button" disabled={!size} onClick={() => zoomBy(1.4)} aria-label="Zoom in"><Plus aria-hidden="true" /></button>
        <button type="button" disabled={!size} onClick={fitWidth} title="Fit the width"><MoveHorizontal aria-hidden="true" /> Width</button>
        <button type="button" disabled={!size} onClick={fitWhole} title="See the whole image"><Maximize aria-hidden="true" /> Whole</button>
      </div>
      <p className="zi-hint">Scroll to zoom · drag to move · double-click to zoom in</p>
    </div>
  );
};

export default ZoomImage;
