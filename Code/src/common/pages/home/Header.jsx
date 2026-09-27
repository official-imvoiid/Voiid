import { Link } from "react-router-dom";

const scrollTop = (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const Header = ({ cvHref }) => (
  <header className="header">
    <a href="/" className="logo" onClick={scrollTop}>VOIID</a>
    <nav className="nav">
      <Link to="/certifications" className="nav-link">Certifications</Link>
      <Link to="/notes" className="nav-link">Notes</Link>
      <Link to="/roadmap" className="nav-link">Roadmap</Link>
      {/* no CV uploaded yet (admin > Links) - leave the button out rather than 404 */}
      {cvHref ? (
        <a href={cvHref} download="Voiid-CV.pdf" className="get-in-touch">Download CV</a>
      ) : null}
    </nav>
  </header>
);

export default Header;
