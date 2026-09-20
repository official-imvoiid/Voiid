import BackHome from "./BackHome";
import "./Pages.css";

/**
 * PageShell - the frame the three nav pages share.
 *
 * Gives each page the dark canvas, the title block, the back-home pill and
 * the closing line, so Certifications / Notes / Roadmap stay visually of a
 * piece with the rest of the site. `accent` recolours everything that keys
 * off --pg-accent: the title, chips, card edges and hover glows.
 */
const PageShell = ({ title, accent, intro, footer, children }) => (
  <div className="pg" style={accent ? { "--pg-accent": accent } : undefined}>
    <div className="pg-shell">
      <div className="pg-head">
        <h1 className="pg-title">{title}</h1>
        <BackHome />
      </div>

      {intro ? <p className="pg-intro">{intro}</p> : null}

      {children}

      {footer ? <p className="pg-foot">{footer}</p> : null}
    </div>
  </div>
);

export default PageShell;
