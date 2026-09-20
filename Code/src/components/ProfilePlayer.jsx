import { useCallback, useEffect, useRef, useState } from "react";
import "./ProfilePlayer.css";

/**
 * ProfilePlayer - click the avatar and the profile card turns into a player.
 *
 *   idle  -> click the avatar
 *   note  -> a line pops up for a couple of seconds
 *   play  -> the card becomes the video, with mute / enlarge / back
 *   idle  -> back, or a few seconds after the video ends
 *
 * The card keeps its own size throughout: the player is absolutely positioned
 * over it, so nothing in the grid reflows when it opens.
 */
const NOTE_MS = 2200;
const OUTRO_MS = 2600;

const NOTE = "Good person — you follow instructions 👀 here's my favourite edit.";

const ProfilePlayer = ({ src = "/video/Kurumi.mp4", poster }) => {
  const [mode, setMode] = useState("idle");
  const [muted, setMuted] = useState(true);
  const [stalled, setStalled] = useState(false);
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const open = useCallback(() => {
    if (mode !== "idle") return;
    clearTimers();
    setMode("note");
    timers.current.push(setTimeout(() => setMode("play"), NOTE_MS));
  }, [mode, clearTimers]);

  const close = useCallback(
    (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      clearTimers();
      const v = videoRef.current;
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
      setMode("idle");
    },
    [clearTimers]
  );

  // start playback once the player is actually on screen
  useEffect(() => {
    if (mode !== "play") return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    setStalled(false);
    v.play()
      .then(() => setStalled(false))
      .catch(() => setStalled(true));   // offer a tap-to-play instead
  }, [mode, muted]);

  useEffect(() => clearTimers, [clearTimers]);

  const onEnded = useCallback(() => {
    clearTimers();
    timers.current.push(setTimeout(() => setMode("idle"), OUTRO_MS));
  }, [clearTimers]);

  const resume = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setStalled(false)).catch(() => {});
  }, []);

  const toggleMute = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setMuted((m) => {
      const next = !m;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  }, []);

  const enlarge = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  }, []);

  return (
    <div className="pp" ref={wrapRef} data-mode={mode}>
      {/* the avatar keeps living in the card; this only adds the affordance */}
      <button type="button" className="pp-hit" onClick={open} aria-label="Play my favourite edit">
        <span className="pp-hint">play my edit ▸</span>
      </button>

      <p className="pp-note" role="status">{NOTE}</p>

      <div className="pp-stage">
        <video
          ref={videoRef}
          className="pp-video"
          src={src}
          poster={poster}
          playsInline
          muted={muted}
          onEnded={onEnded}
          onPlay={() => setStalled(false)}
          preload="metadata"
          autoPlay={mode === "play"}
        />

        {stalled && (
          <button type="button" className="pp-play" onClick={resume} aria-label="Play">
            ▶
          </button>
        )}

        <div className="pp-bar">
          <button type="button" className="pp-btn" onClick={close}>
            ‹ back to Voiid
          </button>
          <div className="pp-right">
            <button
              type="button"
              className="pp-btn"
              onClick={toggleMute}
              aria-pressed={!muted}
            >
              {muted ? "🔇 unmute" : "🔊 mute"}
            </button>
            <button type="button" className="pp-btn" onClick={enlarge}>
              ⛶ enlarge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePlayer;
