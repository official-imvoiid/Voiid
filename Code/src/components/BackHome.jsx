import { Link } from "react-router-dom";
import "./BackHome.css";

/**
 * BackHome - the single back button for every page.
 *
 *   <BackHome />
 *
 * Copied from the music page, which had it right: white pill, green fill at
 * 35% that slides across on hover, Pacifico label. Every page used to carry
 * its own inline copy - some with a glow, some with a lift, all drifting
 * apart. They all point here now, so it only ever has to be changed once.
 */
const BackHome = ({ label = "<< Back home", className = "" }) => (
  <Link
    to="/"
    className={`bh ${className}`.trim()}
    onClick={() => window.scrollTo({ top: 0 })}
  >
    <span className="bh-fill" aria-hidden="true" />
    <span className="bh-text">{label}</span>
  </Link>
);

export default BackHome;
