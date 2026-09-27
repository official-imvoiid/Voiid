import { useEffect, useRef, useState } from "react";
import { createContext, useContext } from "react";

/**
 * PdfPages - a PDF drawn page by page into a list you swipe down.
 *
 * Used on phones and tablets only: there the browser's own PDF viewer in an
 * <iframe> can't be scrolled by touch (iPhone shows page 1 and stops, Android
 * shows nothing). Desktop keeps the browser's viewer.
 * Pages are drawn when they come near the screen and their canvas is given
 * back once they're far away again, so a 300-page PDF stays light.
 */

let pdfjs = null;
const loadPdfjs = async () => {
  if (!pdfjs) {
    const [lib, worker] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    pdfjs = lib;
  }
  return pdfjs;
};

/* one IntersectionObserver for the whole document: watch(el, onNear) */
const NearCtx = createContext(() => () => {});
const useNearWatcher = () => {
  const watchers = useRef(new Map());   // element -> callback
  const io = useRef(null);
  useEffect(() => {
    io.current = new IntersectionObserver((entries) => {
      entries.forEach((e) => watchers.current.get(e.target)?.(e.isIntersecting));
    }, { rootMargin: "1200px 0px" });
    return () => io.current.disconnect();
  }, []);
  return (el, cb) => {
    watchers.current.set(el, cb);
    io.current?.observe(el);
    return () => { watchers.current.delete(el); io.current?.unobserve(el); };
  };
};

const Page = ({ doc, number, width }) => {
  const holder = useRef(null);
  const canvas = useRef(null);
  const watch = useContext(NearCtx);
  const [ratio, setRatio] = useState(1.414);   // A4 until the page says otherwise
  const [near, setNear] = useState(number <= 2);

  useEffect(() => watch(holder.current, setNear), [watch]);

  useEffect(() => {
    if (!width) return undefined;
    const c = canvas.current;
    if (!near) {                                     // far away: free the pixels, keep the height
      if (c) { c.width = 0; c.height = 0; }
      return undefined;
    }
    let task = null;
    let dead = false;
    doc.getPage(number).then((page) => {
      if (dead || !canvas.current) return;
      const base = page.getViewport({ scale: 1 });
      setRatio(base.height / base.width);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const view = page.getViewport({ scale: (width / base.width) * dpr });
      const c = canvas.current;
      c.width = Math.floor(view.width);
      c.height = Math.floor(view.height);
      task = page.render({ canvas: c, canvasContext: c.getContext("2d"), viewport: view });
      task.promise.catch(() => {});
    }).catch(() => {});   // the viewer was closed while this page was loading
    return () => { dead = true; task?.cancel(); };
  }, [doc, number, near, width]);

  return (
    <div ref={holder} className="pdf-page" style={{ height: width * ratio }}>
      <canvas ref={canvas} />
    </div>
  );
};

const PdfPages = ({ src }) => {
  const box = useRef(null);
  const watch = useNearWatcher();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let dead = false;
    let task = null;   // the loading task - closing it frees the PDF and its worker
    loadPdfjs()
      .then((lib) => {
        if (dead) return null;
        task = lib.getDocument({ url: src });
        return task.promise;
      })
      .then((d) => { if (d && !dead) setDoc(d); })
      .catch(() => { if (!dead) setError("This PDF couldn't be opened here - use Download."); });
    return () => {
      dead = true;
      task?.destroy().catch(() => {});
    };
  }, [src]);

  useEffect(() => {
    // measure now, and again whenever the screen turns or resizes
    const measure = () => { if (box.current) setWidth(Math.max(0, box.current.clientWidth - 20)); };   // minus the 10px padding each side
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="pdf-pages" ref={box}>
      {error ? <p className="pdf-msg">{error}</p> : null}
      {!doc && !error ? <p className="pdf-msg">Opening…</p> : null}
      <NearCtx.Provider value={watch}>
        {doc && width
          ? Array.from({ length: doc.numPages }, (_, i) => <Page key={i} doc={doc} number={i + 1} width={width} />)
          : null}
      </NearCtx.Provider>
    </div>
  );
};

export default PdfPages;
