import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import roadmapGuides, { topicCount } from "../content/roadmapGuides";

/**
 * Roadmap - the list of topic roadmaps.
 *
 * One full-width row per guide with its title and a View button; View opens
 * the guide as a graph at /roadmap/:slug (see RoadmapGraph.jsx). Guides live
 * in src/common/content/roadmapGuides.js.
 */

const Roadmap = () => (
  <PageShell
    title="Roadmap"
    accent="#A78BFA"
    className="rg-page"
    intro={`Study guides for the things I am learning, laid out topic by topic. Hit View on any of them
            to open the full map, then tick topics off as you go - your progress stays in this browser.`}
    footer="The plan is not the point. Moving through it is."
  >
    <ul className="rg-list">
      {roadmapGuides.map((g, i) => (
        <li className="rg-row" style={{ "--i": i }} key={g.slug}>
          <div className="rg-row-text">
            <h3 className="rg-row-title">{g.title}</h3>
            <p className="pg-card-sub">{g.blurb}</p>
          </div>
          <span className="rg-row-meta">
            {g.sections.length} sections · {topicCount(g)} topics
          </span>
          <Link className="rg-view" to={`/roadmap/${g.slug}`} aria-label={`View the ${g.title} roadmap`}>
            View
          </Link>
        </li>
      ))}
    </ul>
  </PageShell>
);

export default Roadmap;
