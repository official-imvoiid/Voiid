import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PLATFORMS } from "../../content/platforms";
import Out from "./Out";

const NAV = [
  ["/", "Home"],
  ["/certifications", "Certifications"],
  ["/notes", "Notes"],
  ["/roadmap", "Roadmap"],
];

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

/* social: [{ platform, url }] from admin -> Social links.
   An entry with no url still shows its icon, just not as a link. */
const Footer = ({ social }) => (
  <footer className="footer">
    <div className="footer-nav">
      {NAV.map(([to, label]) => (
        <Link key={to} to={to} className="footer-link" onClick={scrollTop}>{label}</Link>
      ))}
    </div>

    <div className="quote">"Be the beginning of the change"</div>

    <div className="social-links">
      {social.filter((s) => PLATFORMS[s.platform]).map((s, i) => {
        const p = PLATFORMS[s.platform];
        if (p.page) {
          return (
            <Link key={`${s.platform}-${i}`} to={p.page} className="social-icon" style={{ "--brand": p.color }}
              aria-label="A retired social" title="A retired social">
              <FontAwesomeIcon icon={p.icon} />
            </Link>
          );
        }
        return (
          <Out
            key={`${s.platform}-${i}`}
            href={s.url}
            className="social-icon"
            style={{ "--brand": p.color }}
            aria-label={p.label}
            title={p.label}
          >
            <FontAwesomeIcon icon={p.icon} />
          </Out>
        );
      })}
    </div>

    <div className="copyright">&copy; {new Date().getFullYear()} All Rights Reserved</div>
  </footer>
);

export default Footer;
