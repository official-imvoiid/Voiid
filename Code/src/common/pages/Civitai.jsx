import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Civitai - where the footer's lightning bolt goes now that the Civitai
 * link is gone: masks, moons and stars hanging in the dark, a note saying
 * why, and one mask that won't stop joking. Click it.
 * Art: public/images/civitai. Looks: common/styles/pages/civitai.css
 */

const ART = "/images/civitai";

// what hangs from the ceiling: [image, left %, string length (px), size (px), swing seconds, delay]
const HANGING = [
  ["star-4", 4, 40, 70, 5.2, -1.1],
  ["mask-jester", 13, 90, 250, 7.4, -2.3],
  ["moon-small", 24, 20, 78, 6.1, -0.4],
  ["star-2", 31, 150, 74, 5.6, -3.2],
  ["moon-big", 69, 10, 118, 6.8, -1.7],
  ["star-6", 76, 190, 44, 4.9, -2.6],
  ["mask-feather", 87, 70, 260, 7.9, -0.9],
  ["star-1", 96, 30, 96, 5.8, -3.8],
];
const LOW = [
  ["moon-mid", 7, 360, 96, 6.4, -2.0],
  ["star-3", 21, 420, 80, 5.3, -0.6],
  ["star-5", 80, 380, 52, 5.9, -1.4],
  ["star-4", 92, 440, 60, 6.6, -2.9],
];

const JOKES = [
  "You clicked the lightning. Lightning never strikes twice… but I do.",
  "Why am I smiling? Because you came looking for something that isn't here.",
  "Knock knock. — Who's there? — Not this social.",
  "I used to be a link. Now I'm just a face in the dark.",
  "Don't look behind you… kidding. Look at the other socials instead.",
  "The moon asked why I never stop smiling. I said the mask won't let me.",
];

const Hang = ([img, left, string, size, secs, delay], i, low = false) => (
  <div
    key={`${img}-${i}`}
    className={low ? "cv-hang is-low" : "cv-hang"}
    style={{ "--left": `${left}%`, "--string": `${string}px`, "--size": `${size}px`, "--secs": `${secs}s`, "--delay": `${delay}s` }}
    aria-hidden="true"
  >
    <span className="cv-string" />
    <img src={`${ART}/${img}.webp`} alt="" draggable={false} />
  </div>
);

const Civitai = () => {
  const [joke, setJoke] = useState(0);

  return (
    <div className="cv-page">
      <div className="cv-sky" aria-hidden="true" />
      <div className="cv-rod" aria-hidden="true" />

      {HANGING.map((h, i) => Hang(h, i))}
      {LOW.map((h, i) => Hang(h, i + HANGING.length, true))}

      <main className="cv-center">
        {/* the one that talks - click it for another */}
        <button
          type="button"
          className="cv-talker"
          onClick={() => setJoke((j) => (j + 1) % JOKES.length)}
          aria-label="The mask - click for another joke"
        >
          <span className="cv-string is-long" aria-hidden="true" />
          <img src={`${ART}/mask-cracked.webp`} alt="" draggable={false} />
        </button>
        <p className="cv-bubble" key={joke} aria-live="polite">{JOKES[joke]}</p>

        <section className="cv-note">
          <h1>Yeah… this social is gone.</h1>
          <p>
            I&apos;ve decided to remove it - I don&apos;t think it&apos;s needed on my website anymore,
            so this one doesn&apos;t work. The rest of my socials still do.
          </p>
          <p className="cv-maybe">I might add it back in the future. Depends on mood.</p>
          <Link to="/" className="cv-home">Back to the site</Link>
        </section>
      </main>
    </div>
  );
};

export default Civitai;
