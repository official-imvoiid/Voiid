import { useCallback, useMemo, useRef, useState } from "react";
import PageShell from "../components/PageShell";
import { useContent } from "../content/ContentContext";
import useModal from "../hooks/useModal";
import { youtubeId } from "../content/media";

const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const YtIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="music-yt-icon">
    <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9L15.5 12z" />
  </svg>
);

/* A song card: just the video's own thumbnail and a play button.
   Clicking opens the big player (SongPlayer below). */
const Song = ({ song, index, onPlay }) => {
  const id = youtubeId(song.youtube);
  const title = `${song.song} - ${song.artist}`;
  return (
    <div className="pg-card music-song" style={{ "--i": index }}>
      <div className="music-video">
        <button type="button" className="music-poster" onClick={onPlay} aria-label={`Play ${title}`}>
          <img src={thumb(id)} alt="" loading="lazy" draggable={false} />
          <span className="music-play" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg>
          </span>
        </button>
        <a
          className="music-yt-link"
          href={watchUrl(id)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${title} on YouTube`}
          title="Open on YouTube"
        >
          <YtIcon />
        </a>
      </div>
      <div className="music-info">
        <h3 className="pg-card-title">{song.song}</h3>
        <p className="pg-card-sub">{song.artist}</p>
      </div>
    </div>
  );
};

/* The big pop-up player. Esc or the backdrop closes it, arrow keys change
   song. Songs whose uploader blocks playing on other sites ("YouTube only"
   in the admin) show their cover and a button to YouTube instead. */
const SongPlayer = ({ song, onClose, onGo }) => {
  const id = youtubeId(song.youtube);
  const closeRef = useRef(null);
  useModal({ onClose, onStep: onGo, focusRef: closeRef });

  return (
    <div
      className="music-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${song.song} - ${song.artist}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ "--cat": song.color }}
    >
      <div className="music-modal-box">
        <div className="music-modal-screen">
          {song.ytOnly ? (
            <div className="music-modal-blocked">
              <img src={thumb(id)} alt="" draggable={false} />
              <div className="music-modal-blocked-text">
                <p>The uploader only lets this one play on YouTube.</p>
                <a className="music-modal-yt is-big" href={watchUrl(id)} target="_blank" rel="noopener noreferrer">
                  <YtIcon /> Play on YouTube
                </a>
              </div>
            </div>
          ) : (
            <iframe
              key={id}
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
              title={`${song.song} - ${song.artist}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className="music-modal-bar">
          <button type="button" className="music-modal-nav is-prev" onClick={() => onGo(-1)} aria-label="Previous song">
            <svg viewBox="0 0 24 24"><path d="M15 5 8 12l7 7" /></svg>
          </button>
          <div className="music-modal-meta">
            <p className="music-modal-cat">{song.category}</p>
            <h2 className="music-modal-title">{song.song}</h2>
            <p className="music-modal-artist">{song.artist}</p>
          </div>
          <a className="music-modal-yt" href={watchUrl(id)} target="_blank" rel="noopener noreferrer">
            <YtIcon /> <span>YouTube</span>
          </a>
          <button type="button" className="music-modal-nav is-next" onClick={() => onGo(1)} aria-label="Next song">
            <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
          </button>
          <button type="button" ref={closeRef} className="music-modal-close" onClick={onClose} aria-label="Close player">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* Looks: common/styles/pages/music.css
   Sizes: platforms/<device>/music.css */
const MusicList = () => {
  /* categories + songs are edited at /admin -> Music */
  const { musicCategories, songs } = useContent();
  const [filter, setFilter] = useState("all");
  const [playing, setPlaying] = useState(-1);   // index into `queue`, -1 = closed

  // only categories that actually have songs
  const categories = useMemo(() => musicCategories
    .map((c) => ({ ...c, songs: songs.filter((s) => s.category === c.name && youtubeId(s.youtube)) }))
    .filter((c) => c.songs.length), [musicCategories, songs]);
  const shown = useMemo(() => (filter === "all" ? categories : categories.filter((c) => c.name === filter)), [categories, filter]);
  const total = categories.reduce((n, c) => n + c.songs.length, 0);

  // the songs on screen, in order - the player's arrows walk through these.
  // `starts` is where each category begins in the queue.
  const { queue, starts } = useMemo(() => {
    const queue = [];
    const starts = [];
    for (const c of shown) {
      starts.push(queue.length);
      for (const song of c.songs) queue.push({ ...song, color: c.color });
    }
    return { queue, starts };
  }, [shown]);
  const close = useCallback(() => setPlaying(-1), []);
  const go = useCallback((d) => {
    setPlaying((i) => (i < 0 ? i : (i + d + queue.length) % queue.length));
  }, [queue.length]);

  return (
    <PageShell
      title="My Music Gene 🎵"
      accent="#F39C12"
      intro={
        <>
          Coffee wakes the body, music frees the mind — my quick reset between the grind.
          <span className="music-intro-quote">
            &ldquo;The art of strategically using music and coffee to boost work efficiency.&rdquo;
          </span>
        </>
      }
      footer="Music speaks what words fear to say."
    >
      <div className="pg-tools">
        <div className="pg-chips">
          <button
            type="button"
            className="pg-chip"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              className="pg-chip music-chip"
              style={{ "--cat": c.color }}
              aria-pressed={filter === c.name}
              onClick={() => setFilter(c.name)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <span className="pg-count">{total} songs</span>
      </div>

      {shown.map((c, ci) => (
        <section key={c.name} className="music-genre" style={{ "--cat": c.color }}>
          <h2 className="music-genre-title">
            {c.name}
            <span className="music-genre-count">{c.songs.length}</span>
          </h2>
          <div className="pg-grid">
            {c.songs.map((song, i) => (
              <Song
                key={`${song.youtube}-${i}`}
                song={song}
                index={i}
                onPlay={() => setPlaying(starts[ci] + i)}
              />
            ))}
          </div>
        </section>
      ))}

      {playing >= 0 && queue[playing] ? (
        <SongPlayer song={queue[playing]} onClose={close} onGo={go} />
      ) : null}
    </PageShell>
  );
};

export default MusicList;
