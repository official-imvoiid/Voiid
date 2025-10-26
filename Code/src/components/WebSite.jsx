import React from "react";
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
  faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import "./WebSite.css";

const Portfolio = () => {
  return (
    <div className="portfolio">
      {/* ===== HEADER SECTION ===== */}
      <header className="header container">
        <a href="#" className="logo">VOIID</a>
        <nav className="nav">
          <Link to="/work" className="nav-link">Work</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/expertise" className="nav-link">Expertise</Link>
          <Link to="/contact" className="get-in-touch">Get in Touch</Link>
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
        </div>

        {/* ----- Quick Access Cards ----- */}
        <div className="card resume-card">
          <span className="card-subtitle">Learn more about me</span>
          <h2 className="card-title">See skill-set</h2>
          <a href="/skills" className="card-link">View <span>→</span></a>
        </div>

        <div className="card achievement-card">
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
          <a href="#" className="card-link">View <span>→</span></a>
        </div>

        <div className="card github-card">
          <a href="#" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faGithub} className="card-title" />
          </a>
        </div>

        {/* ----- Call to Action Card ----- */}
        <div className="card card-large card-cta collaborate-card">
          <FontAwesomeIcon icon={faHandshake} className="collaborate-icon" />
          <h2 className="card-title">Collaborate together!</h2>
          <p className="card-subtitle">
            Let's create something amazing and build the future of tech together
          </p>
          <Link to="/contact">
          <a href="#" className="card-link">Get in touch <span>→</span></a>
          </Link>
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
          <a href="#" className="card-link">View <span>→</span></a>
        </div>

        <div className="card blog-card">
          <span className="card-subtitle">From my blog</span>
          <h2 className="card-title">Latest Articles</h2>
          <p>Learn & Build🚀</p>
          <a href="#" className="card-link">Read more <span>→</span></a>
        </div>

        {/* ----- Entertainment Cards ----- */}
        <Link to="/GamesPlayed">
          <div className="card gaming-card">
            <FontAwesomeIcon icon={faGamepad} className="card-title" />
          </div>
        </Link>

        <Link to="/MusicList">
          <div className="card music-card">
            <FontAwesomeIcon icon={faMusic} className="card-title" />
          </div>
        </Link>
      </div>

      {/* ===== FOOTER SECTION ===== */}
      <footer className="footer">
        {/* Navigation Links */}
        <div className="footer-nav">
          <Link to="/" className="nav-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Home
          </Link>
          <Link to="/work" className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Work
          </Link>
          <Link to="/about" className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            About
          </Link>
          <Link to="/expertise" className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Expertise
          </Link>
        </div>

        {/* Inspirational Quote */}
        <div className="quote">"Be the beginning of the change"</div>

        {/* Social Media Links */}
        <div className="social-links">
          <a href="#" className="social-icon instagram">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="#" className="social-icon linkedin">
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
          <a href="#" className="social-icon pinterest">
            <FontAwesomeIcon icon={faPinterest} />
          </a>
          <a href="#" className="social-icon github">
            <FontAwesomeIcon icon={faGithub} />
          </a>
          <a href="#" className="social-icon reddit">
            <FontAwesomeIcon icon={faReddit} />
          </a>
          <a href="#" className="social-icon youtube">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a href="#" className="social-icon civitai">
            <FontAwesomeIcon icon={faBolt} />
          </a>
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