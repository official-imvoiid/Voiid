import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Brand Icons
import {
  faGithub,
  faInstagram,
  faLinkedin,
  faReddit,
  faYoutube,
  faPinterest,
} from "@fortawesome/free-brands-svg-icons";
// Solid Icons
import {
  faBolt,
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
import MascotScene from "./MascotScene";
import { useContent } from "../content/ContentContext";
import { useWasted } from "./Wasted";
import Teamwork from "./Teamwork";
import Scientist from "./Scientist";
import ProfilePlayer from "./ProfilePlayer";
import "./WebSite.css";

const Portfolio = () => {
  const wasted = useWasted();
  /* Card destinations and social handles come from the content store, so
     they are editable at /admin instead of being hardcoded here. Anything
     still blank renders as plain text rather than a link to nowhere. */
  const { links, social } = useContent();

  // an <a> only when there is somewhere to go
  const Out = ({ href, children, ...rest }) =>
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    ) : (
      <span {...rest} aria-disabled="true">{children}</span>
    );

  // Cursor-driven 3D tilt + a specular highlight that tracks the pointer.
  // Kept deliberately shallow (9deg) so it reads as depth, not a gimmick.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (!window.matchMedia("(hover: hover)").matches) return undefined;

    const cards = Array.from(document.querySelectorAll(".cards-container .card"));

    const onMove = (e) => {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-y", `${((px - 0.5) * 9).toFixed(2)}deg`);
      el.style.setProperty("--tilt-x", `${((0.5 - py) * 9).toFixed(2)}deg`);
    };
    const onLeave = (e) => {
      const el = e.currentTarget;
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };

    cards.forEach((c) => {
      c.addEventListener("mousemove", onMove);
      c.addEventListener("mouseleave", onLeave);
    });
    return () => cards.forEach((c) => {
      c.removeEventListener("mousemove", onMove);
      c.removeEventListener("mouseleave", onLeave);
    });
  }, []);

  return (
    <div className="portfolio">
      {/* ===== HEADER SECTION ===== */}
      <header className="header container">
        {/* href="#" put a bare "#" in the address bar on every click. This
            scrolls to the top and leaves the URL alone. */}
        <a
          href="/"
          className="logo"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          VOIID
        </a>
        <nav className="nav">
          <Link to="/certifications" className="nav-link">Certifications</Link>
          <Link to="/notes" className="nav-link">Notes</Link>
          <Link to="/roadmap" className="nav-link">Roadmap</Link>
          <a href={links.cv} download className="get-in-touch">Download CV</a>
        </nav>
      </header>

      {/* ===== MAIN CONTENT GRID ===== */}
      <div className="cards-container">
        {/* ----- Profile Section ----- */}
        <div className="card card-large profile-card">
          <div className="avatar">
            <img src="images/profile.png" alt="Profile" />
          </div>
          <h2 className="card-title">
            Hey, I'm Voiid <span role="img" aria-label="waving hand">👋</span>
          </h2>
          <p className="card-subtitle">A Developer & Cyber-Security Student</p>
          <ProfilePlayer />
        </div>

        {/* ----- Quick Access Cards ----- */}
        <div className="card resume-card">
          <img className="card-corner-icon" src="/images/icon-skillset.png" alt="" />
          <span className="card-subtitle">Learn more about me</span>
          <h2 className="card-title">Skill-Set</h2>
          <a href="/skills" className="card-link">View <span>→</span></a>
        </div>

        <div className="card achievement-card">
          <img className="card-corner-icon" src="/images/icon-develop.png" alt="" />
          <span className="card-subtitle">Game</span>
          <h2 className="card-title">
            Play & Learn <FontAwesomeIcon icon={faGraduationCap} />
          </h2>
          <Link to="/game" className="card-link">View <span>→</span></Link>
        </div>

        {/* ----- Professional Cards ----- */}
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

        {/* ----- Call to Action Card ----- */}
        <div className="card card-large card-cta collaborate-card">
          <Teamwork />
          <h2 className="card-title">Collaborate together!</h2>
          <p className="card-subtitle">
            Let's create something amazing and build the future of tech together
          </p>
          {/* the inner element must not be an <a>: Link renders one, and an
              anchor inside an anchor is invalid HTML - React was logging it
              on every render, and the nested href="#" fought the navigation */}
          <Link to="/contact" className="card-link">Get in touch <span>→</span></Link>
        </div>

        {/* ----- About Section ----- */}
        <div className="card card-large about-card">
          <span className="card-subtitle">Branding</span>
          <h2 className="card-title">About Voiid</h2>
          <p><strong>Voiid—More Than a Name, A Philosophy.</strong> Voiid is more than an identity; it represents a mindset. Life doesn't end when one ceases to exist—it ends when one stops dreaming. The name "Voiid" is a fusion of "Void" and an extra "I" for "Imagination," symbolizing the endless potential of vision. To imagine, create, and innovate is to truly live.</p>
          <div className="icon-container" />
        </div>

        {/* ----- Skills Grid Section ----- */}
        <div className="card card-large skills-card">
          <h2 className="card-title">What I do</h2>
          <div className="skills-grid">
            <div className="skill-button">
              <FontAwesomeIcon icon={faCode} className="skill-icon" />
              <span className="skill-name">Develop</span>
            </div>
            
            <Link to="/Literature">
              <div className="skill-button">
                <FontAwesomeIcon icon={faBook} className="skill-icon" />
                <span className="skill-name">Literature</span>
              </div>
            </Link>

            <a href="https://www.instagram.com/voiid.ae/" 
               className="skill-button" 
               target="_blank" 
               rel="noopener noreferrer">
              <FontAwesomeIcon icon={faCube} className="skill-icon" />
              <span className="skill-name">3D & Editing</span>
            </a>

            <div className="skill-button">
              <FontAwesomeIcon icon={faLaptopCode} className="skill-icon" />
              <span className="skill-name">CyberSecurity</span>
            </div>

            <Link to="/Art" className="skill-button">
              <FontAwesomeIcon icon={faCameraRetro} className="skill-icon" />
              <span className="skill-name">AI Artist</span>
            </Link>

            <div className="skill-button">
              <FontAwesomeIcon icon={faRobot} className="skill-icon" />
              <span className="skill-name">AI Research</span>
            </div>
          </div>
        </div>

        {/* ----- Project Cards ----- */}
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

        {/* ----- Entertainment Cards ----- */}
        <Link to="/GamesPlayed">
          <div className="card gaming-card">
            <FontAwesomeIcon icon={faGamepad} className="card-title" />
            {wasted.button}
            {wasted.overlay}
          </div>
        </Link>

        <Link to="/MusicList">
          <div className="card music-card">
            {/* the icon is a FontAwesome <svg>, which will not take a CSS
                transform - so the mascot shoves this wrapper instead */}
            <span className="music-note">
              <FontAwesomeIcon icon={faMusic} className="card-title" />
            </span>
            <MascotScene size={145} />
          </div>
        </Link>
      </div>

      {/* ===== FOOTER SECTION ===== */}
      <footer className="footer">
        {/* Navigation Links */}
        <div className="footer-nav">
          <Link to="/" className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Home
          </Link>
          <Link to="/certifications" className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Certifications
          </Link>
          <Link to="/notes" className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Notes
          </Link>
          <Link to="/roadmap" className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Roadmap
          </Link>
        </div>

        {/* Inspirational Quote */}
        <div className="quote">"Be the beginning of the change"</div>

        {/* Social Media Links */}
        <div className="social-links">
          <Out href={social.instagram} className="social-icon instagram">
            <FontAwesomeIcon icon={faInstagram} />
          </Out>
          <Out href={social.linkedin} className="social-icon linkedin">
            <FontAwesomeIcon icon={faLinkedin} />
          </Out>
          <Out href={social.pinterest} className="social-icon pinterest">
            <FontAwesomeIcon icon={faPinterest} />
          </Out>
          <Out href={social.github} className="social-icon github">
            <FontAwesomeIcon icon={faGithub} />
          </Out>
          <Out href={social.reddit} className="social-icon reddit">
            <FontAwesomeIcon icon={faReddit} />
          </Out>
          <Out href={social.youtube} className="social-icon youtube">
            <FontAwesomeIcon icon={faYoutube} />
          </Out>
          <Out href={social.civitai} className="social-icon civitai">
            <FontAwesomeIcon icon={faBolt} />
          </Out>
        </div>

        {/* Copyright Notice */}
        <div className="copyright">
          &copy; {new Date().getFullYear()} All Rights Reserved
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;