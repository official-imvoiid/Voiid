import BackHome from "./BackHome";

/**
 * PageShell - the frame most inner pages share (Certifications, Notes,
 * Roadmap, Skills, Music, Game, Develop, Literature, 3D...).
 *
 * Gives each page the dark canvas, the title block, the back-home pill and
 * the closing line, so they stay visually of a piece with the rest of the
 * site. `accent` recolours everything that keys off --pg-accent: the title,
 * chips, card edges and hover glows. Looks: common/styles/pages/info-pages.css
 */
const PageShell = ({ title, accent, intro, footer, className = "", children }) => (
  <div className={`pg ${className}`.trim()} style={accent ? { "--pg-accent": accent } : undefined}>
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
