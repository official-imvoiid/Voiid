import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Portfolio from "./components/WebSite";
import JavaScriptCodingGame from "./components/Game";
import GamesList from "./components/GamesPlayed";
import MusicList from "./components/MusicList";
import SkillSet from "./components/Skills";
import Art from "./components/Art";
import Literature from "./components/Literature";
import Expertise from "./components/Expertise";
import About from "./components/About";
import Work from "./components/Work";
import Contact from "./components/contact";
import OfflineNotification from "./components/OfflineCheck";

function App() {
  return (
    <Router>
      <div className="app-container" style={{ minHeight: "100vh", backgroundColor: "#222", color: "#fff" }}>
      <OfflineNotification /> {/* <- Put it here globally */} 
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/Game" element={<JavaScriptCodingGame />} />
          <Route path="/gamesplayed" element={<GamesList />} />
          <Route path="/musiclist" element={<MusicList />} />
          <Route path="/skills" element={<SkillSet />} />
          <Route path="/art" element={<Art />} />
          <Route path="/literature" element={<Literature />} />
          <Route path="/expertise" element={<Expertise />} />
          <Route path="/about" element={<About />} />
          <Route path="/work" element={<Work />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
