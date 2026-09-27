import { Link } from "react-router-dom";

/**
 * BackHome - the single back button for every page.
 *
 *   <BackHome />
 *
 * One component so every page's back button looks and behaves the same.
 * Looks: common/styles/components/back-home.css
 */
const BackHome = ({ label = "<< Back home", to = "/", className = "" }) => (
  <Link
    to={to}
    className={`bh ${className}`.trim()}
    onClick={() => window.scrollTo({ top: 0 })}
  >
    <span className="bh-fill" aria-hidden="true" />
    <span className="bh-text">{label}</span>
  </Link>
);

export default BackHome;
