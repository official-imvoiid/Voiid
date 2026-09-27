import { useEffect, useState } from "react";
import BackHome from "../components/BackHome";
import { useContent } from "../content/ContentContext";
import { imageColor } from "../content/media";

/**
 * Games I've Conquered. Each tile links out to that game's site; the tiles
 * are edited at /admin -> Games (shipped set: content/defaults.js).
 * Looks: common/styles/pages/games-played.css
 */

/* glowColor "auto" (or empty) = take the colour from the cover image */
const GameCard = ({ game }) => {
  const isAuto = !game.glowColor || game.glowColor === "auto";
  const [autoColor, setAutoColor] = useState(null);

  useEffect(() => {
    if (!isAuto) return undefined;
    let alive = true;
    imageColor(game.image).then((c) => alive && setAutoColor(c));
    return () => { alive = false; };
  }, [isAuto, game.image]);

  const glow = isAuto ? autoColor : game.glowColor;

  return (
    <a
      className="gp-card"
      style={glow ? { "--glow": glow } : undefined}
      href={game.url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open the official site for ${game.name}`}
    >
      <div className="gp-art">
        {game.theme ? <span className="gp-theme">{game.theme}</span> : null}
        <img src={game.image} alt={game.name} loading="lazy" />
        {game.url ? <span className="gp-visit">Visit site ↗</span> : null}
      </div>
      <h3 className="gp-name">{game.name}</h3>
    </a>
  );
};

const GameList = () => {
  /* the tiles are edited at /admin -> Games */
  const { games } = useContent();

  return (
  <div className="gp-page">
    <div className="gp-shell">
      <div className="gp-head">
        <h1 className="gp-title">Games I&rsquo;ve Conquered 🎮🔥</h1>
        <BackHome />
      </div>

      <p className="gp-intro">
        I haven&rsquo;t played many games — I&rsquo;m a workaholic who enjoys watching anime,
        researching, learning and experimenting with new AI and technology. But here are a
        few I&rsquo;ve played in my lifetime.
      </p>

      <div className="gp-grid">
        {games.map((game, i) => (
          <GameCard key={`${game.name}-${i}`} game={game} />
        ))}
      </div>

      <p className="gp-foot">Every world finished is another story carried home.</p>
    </div>
  </div>
  );
};

export default GameList;
