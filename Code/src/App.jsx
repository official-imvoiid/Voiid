import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ContentProvider } from "./common/content/ContentContext";
import ErrorBoundary from "./common/components/ErrorBoundary";
import OfflineNotification from "./common/components/OfflineCheck";
import ComingSoon from "./common/components/ComingSoon";
import NotFound from "./common/components/NotFound";
import Home from "./common/pages/home/Home";

// Only the home page ships in the first download. Every other page (and its
// data: the poems, the world map, three.js...) is fetched the first time it's opened.
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
const Admin = lazy(() => import("./common/pages/admin/Admin"));
const MascotDemo = lazy(() => import("./common/pages/MascotDemo"));
const Develop = lazy(() => import("./common/pages/Develop"));
const Literature = lazy(() => import("./common/pages/Literature"));
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

function App() {
  return (
    <ContentProvider>
      <Router>
        <div className="app-container">
          <OfflineNotification />
          <Pages />
        </div>
      </Router>
    </ContentProvider>
  );
}

export default App;
