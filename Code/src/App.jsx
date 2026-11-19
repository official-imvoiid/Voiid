import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ContentProvider, useContent } from "./common/content/ContentContext";
import { fetchRepos, githubUser } from "./common/content/github";
import { loadPoems } from "./common/content/shippedPoems";
import ErrorBoundary from "./common/components/ErrorBoundary";
import OfflineNotification from "./common/components/OfflineCheck";
import ComingSoon from "./common/components/ComingSoon";
import NotFound from "./common/components/NotFound";
import Home from "./common/pages/home/Home";

// Only the home page ships in the first download. Every other page (and its
// data: the poems, the world map, three.js...) is fetched the first time it's opened.
// The pages that show or edit the shipped poems open once those have arrived.
const withPoems = (load) => () => Promise.all([load(), loadPoems()]).then(([page]) => page);
const JavaScriptCodingGame = lazy(() => import("./common/pages/Game"));
const GamesList = lazy(() => import("./common/pages/GamesPlayed"));
const MusicList = lazy(() => import("./common/pages/MusicList"));
const SkillSet = lazy(() => import("./common/pages/Skills"));
const Art = lazy(() => import("./common/pages/Art"));
const Contact = lazy(() => import("./common/pages/Contact"));
const Certifications = lazy(() => import("./common/pages/Certifications"));
const Notes = lazy(() => import("./common/pages/Notes"));
const Roadmap = lazy(() => import("./common/pages/Roadmap"));
const RoadmapGraph = lazy(() => import("./common/pages/RoadmapGraph"));
const Admin = lazy(withPoems(() => import("./common/pages/admin/Admin")));
const MascotDemo = lazy(() => import("./common/pages/MascotDemo"));
// The Develop page is fetched ahead of time (WarmDevelop below). Once it has
// arrived it is drawn directly: going through lazy() would still make React
// wait a moment (~0.3 s) before showing a page that is already here.
let DevelopPage = null;
const loadDevelop = () => import("./common/pages/Develop").then((m) => { DevelopPage = m.default; return m; });
const DevelopLazy = lazy(loadDevelop);
const Develop = () => (DevelopPage ? <DevelopPage /> : <DevelopLazy />);
const Literature = lazy(withPoems(() => import("./common/pages/Literature")));
const Civitai = lazy(() => import("./common/pages/Civitai"));
const Models = lazy(() => import("./common/pages/models/Models"));

// one error boundary per page: a broken page shows a message, not a blank site
const Pages = () => {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={null}>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<JavaScriptCodingGame />} />
            <Route path="/gamesplayed" element={<GamesList />} />
            <Route path="/musiclist" element={<MusicList />} />
            <Route path="/skills" element={<SkillSet />} />
            <Route path="/develop" element={<Develop />} />
            <Route path="/art" element={<Art />} />
            <Route path="/literature" element={<Literature />} />
            <Route path="/gone" element={<Civitai />} />
            <Route path="/3d" element={<Models />} />
            <Route path="/expertise" element={<ComingSoon title="Expertise" />} />
            <Route path="/about" element={<ComingSoon title="About" />} />
            <Route path="/work" element={<ComingSoon title="Work" />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/certifications" element={<Certifications />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/roadmap/:slug" element={<RoadmapGraph />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/mascot" element={<MascotDemo />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

// The Develop map opens without a wait: soon after the site opens, its repo
// list (a small JSON from this site's own server) and its code are fetched in
// the background - straight away if the visitor points at, touches or tabs to
// a link to it first. Skipped for visitors who asked their browser to save data.
//
// Then, at a quiet moment, the page is drawn once out of sight (a "preview":
// it fetches nothing, takes no keys, never scrolls) and taken away a frame
// later. The first time a browser lays out text it prepares each font at each
// size and finds stand-ins for symbols like 🗺️ ★ ⑂ - for this page about a
// quarter of a second, measured, which the visitor then no longer waits for
// after clicking. The preview itself keeps the browser busy for about as
// long, so it waits for a moment nobody is using the page: only on the home
// page (where the Develop button is), not in the first 2.5 s, not within a
// second of a click, key, scroll or touch, and only when the browser says it
// is idle. Once per visit.
const REHEARSE_AFTER_MS = 2500;
const QUIET_MS = 1000;
let rehearsed = false;
let lastInput = 0;
const idleCall = (fn, timeout) => {
  if (window.requestIdleCallback) { const id = window.requestIdleCallback(fn, { timeout }); return () => window.cancelIdleCallback(id); }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
};
const WarmDevelop = () => {
  const user = githubUser(useContent().links.github);
  const { pathname } = useLocation();
  const [rehearse, setRehearse] = useState(false);
  useEffect(() => { if (pathname === "/develop") rehearsed = true; }, [pathname]);   // the real page did it
  const onHome = pathname === "/";
  useEffect(() => {
    if (!user || navigator.connection?.saveData) return undefined;
    let done = false;
    let idle = 0;
    let cancelled = false;
    let later = 0;
    let cancelIdle = () => {};
    const noteInput = () => { lastInput = performance.now(); };
    const inputs = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    inputs.forEach((t) => window.addEventListener(t, noteInput, { passive: true, capture: true }));
    // wait for a quiet moment on the home page, then draw the preview
    const tryRehearse = () => {
      if (cancelled || rehearsed || !onHome) return;
      const now = performance.now();
      const wait = Math.max(REHEARSE_AFTER_MS - now, QUIET_MS - (now - lastInput), 0);
      if (wait > 0) { later = window.setTimeout(tryRehearse, wait + 50); return; }
      cancelIdle = idleCall(() => {
        if (cancelled || rehearsed) return;
        if (performance.now() - lastInput < QUIET_MS) { tryRehearse(); return; }
        setRehearse(true);
      }, 4000);
    };
    const warm = () => {
      if (done) return;
      done = true;
      Promise.all([fetchRepos(user).catch(() => null), loadDevelop().catch(() => null)]).then(([copy]) => {
        if (!cancelled && copy && DevelopPage) tryRehearse();
      });
    };
    // a quick click: start the moment the visitor heads for the link
    const onIntent = (e) => { if (e.target instanceof Element && e.target.closest('a[href="/develop"]')) warm(); };
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("touchstart", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    // otherwise shortly after the home page has drawn, at a quiet moment
    const t = window.setTimeout(() => {
      if (window.requestIdleCallback) idle = window.requestIdleCallback(warm, { timeout: 800 });
      else warm();
    }, 300);
    return () => {
      cancelled = true;
      cancelIdle();
      window.clearTimeout(later);
      inputs.forEach((t) => window.removeEventListener(t, noteInput, { capture: true }));
      window.clearTimeout(t);
      if (idle) window.cancelIdleCallback?.(idle);
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("touchstart", onIntent);
      document.removeEventListener("focusin", onIntent);
    };
  }, [user, onHome]);

  // the preview has been laid out once a frame has gone by: take it away
  useEffect(() => {
    if (!rehearse) return undefined;
    let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => { rehearsed = true; setRehearse(false); }); });
    return () => cancelAnimationFrame(raf);
  }, [rehearse]);

  if (!rehearse || rehearsed || !onHome || !DevelopPage) return null;
  return createPortal(
    <div aria-hidden="true" inert style={{ position: "fixed", inset: 0, overflow: "hidden", visibility: "hidden", pointerEvents: "none", zIndex: -1 }}>
      <DevelopPage preview />
    </div>,
    document.body,
  );
};

function App() {
  return (
    <ContentProvider>
      <Router>
        <div className="app-container">
          <WarmDevelop />
          <OfflineNotification />
          <Pages />
        </div>
      </Router>
    </ContentProvider>
  );
}

export default App;
