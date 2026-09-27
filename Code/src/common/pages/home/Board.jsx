import { useRef } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  faCode,
  faBook,
  faCube,
  faLaptopCode,
  faCameraRetro,
  faGamepad,
  faFlask,
  faRobot,
  faMusic,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import MascotScene from "../../components/MascotScene";
import Teamwork from "../../components/Teamwork";
import Scientist from "../../components/Scientist";
import ProfilePlayer from "../../components/ProfilePlayer";
import { useWasted } from "../../components/Wasted";
import Out from "./Out";
import useCardTilt from "./useCardTilt";
import useCardPause from "./useCardPause";

// "What I do" tiles: [icon, label, where it goes]
//   "/route"  an internal page     "@key"  a link from admin -> Links
//   null      not clickable
const SKILLS = [
  [faCode, "Develop", "/develop"],
  [faBook, "Literature", "/literature"],
  [faCube, "3D & Editing", "/3d"],
  [faLaptopCode, "CyberSecurity", "@hackthebox"],
  [faCameraRetro, "AI Artist", "/art"],
  [faRobot, "AI Models", "@huggingface"],
];

const SkillTile = ([icon, label, target], links) => {
  const to = target?.startsWith("@") ? links[target.slice(1)] : target;
  const inner = (
    <>
      <FontAwesomeIcon icon={icon} className="skill-icon" />
      <span className="skill-name">{label}</span>
    </>
  );
  if (!to) return <div key={label} className="skill-button">{inner}</div>;
  if (!to.startsWith("/")) return <Out key={label} href={to} className="skill-button">{inner}</Out>;
  return <Link key={label} to={to} className="skill-button">{inner}</Link>;
};

const Board = ({ links }) => {
  const boardRef = useRef(null);
  const wasted = useWasted();
  useCardTilt(boardRef);
  useCardPause(boardRef);

  return (
    <div className="cards-container" ref={boardRef}>
      {/* ----- Profile ----- */}
      <div className="card card-large profile-card">
        <div className="avatar">
          <img src="/images/profile.png" alt="Profile" />
        </div>
        <h2 className="card-title">
          Hey, I'm Voiid <span role="img" aria-label="waving hand">👋</span>
        </h2>
        <p className="card-subtitle">A Developer & Cyber-Security Student</p>
        <ProfilePlayer />
      </div>

      {/* ----- Quick access ----- */}
      <div className="card resume-card">
        <img className="card-corner-icon" src="/images/icon-skillset.png" alt="" />
        <span className="card-subtitle">Learn more about me</span>
        <h2 className="card-title">Skill-Set</h2>
        <Link to="/skills" className="card-link">View <span>→</span></Link>
      </div>

      <div className="card achievement-card">
        <img className="card-corner-icon" src="/images/icon-develop.png" alt="" />
        <span className="card-subtitle">Game</span>
        <h2 className="card-title">Play & Learn <FontAwesomeIcon icon={faGraduationCap} /></h2>
        <Link to="/game" className="card-link">View <span>→</span></Link>
      </div>

      {/* ----- Professional ----- */}
      <div className="card research-card">
        <span className="card-subtitle">My Papers</span>
        <h2 className="card-title">Research <FontAwesomeIcon icon={faFlask} /></h2>
        <Scientist height="76%" />
        <Out href={links.research} className="card-link">View <span>→</span></Out>
      </div>

      <div className="card github-card">
        <Out href={links.github}>
          <FontAwesomeIcon icon={faGithub} className="card-title" />
        </Out>
      </div>

      <div className="card card-large collaborate-card">
        <Teamwork />
        <h2 className="card-title">Collaborate together!</h2>
        <p className="card-subtitle">
          Let's create something amazing and build the future of tech together
        </p>
        <Link to="/contact" className="card-link">Get in touch <span>→</span></Link>
      </div>

      {/* ----- About ----- */}
      <div className="card card-large about-card">
        <span className="card-subtitle">Branding</span>
        <h2 className="card-title">About Voiid</h2>
        <p><strong>Voiid—More Than a Name, A Philosophy.</strong> Voiid is more than an identity; it represents a mindset. Life doesn't end when one ceases to exist—it ends when one stops dreaming. The name "Voiid" is a fusion of "Void" and an extra "I" for "Imagination," symbolizing the endless potential of vision. To imagine, create, and innovate is to truly live.</p>
      </div>

      {/* ----- What I do ----- */}
      <div className="card card-large skills-card">
        <h2 className="card-title">What I do</h2>
        <div className="skills-grid">{SKILLS.map((s) => SkillTile(s, links))}</div>
      </div>

      {/* ----- Projects ----- */}
      <div className="card project-card">
        <span className="card-subtitle">Featured Work</span>
        <h2 className="card-title">Discord</h2>
        <p>Lets Debug Together</p>
        <Out href={links.discord} className="card-link">View <span>→</span></Out>
      </div>

      <div className="card blog-card">
        <span className="card-subtitle">From my blog</span>
        <h2 className="card-title">Latest Articles</h2>
        <p>Learn & Build🚀</p>
        <Out href={links.article} className="card-link">Read more <span>→</span></Out>
      </div>

      {/* ----- Entertainment: the whole card is the link (a .card-hit overlay),
             so the Wasted button can sit on top without being inside an <a> ----- */}
      <div className="card gaming-card">
        <FontAwesomeIcon icon={faGamepad} className="card-title" />
        <Link to="/gamesplayed" className="card-hit" aria-label="Games I've played" />
        {wasted.button}
        {wasted.overlay}
      </div>

      <div className="card music-card">
        {/* the mascot shoves this wrapper - the svg ignores CSS transforms */}
        <span className="music-note">
          <FontAwesomeIcon icon={faMusic} className="card-title" />
        </span>
        {/* size is a CSS token so each device file can scale her */}
        <MascotScene size="var(--mascot)" />
        <Link to="/musiclist" className="card-hit" aria-label="My music" />
      </div>
    </div>
  );
};

export default Board;
