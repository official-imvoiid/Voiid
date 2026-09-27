import {
  faInstagram,
  faLinkedin,
  faPinterest,
  faGithub,
  faReddit,
  faYoutube,
  faDiscord,
  faXTwitter,
  faTwitch,
  faFacebook,
  faTiktok,
  faSpotify,
  faBehance,
  faDribbble,
} from "@fortawesome/free-brands-svg-icons";
import { faBolt, faGlobe } from "@fortawesome/free-solid-svg-icons";

/* Social platforms the footer knows how to draw. The admin's "Social
   links" section offers exactly these. To add one: import its icon above
   and add a line here - nothing else changes. `page` sends the icon to a
   page on this site instead of its link. */
export const PLATFORMS = {
  instagram: { label: "Instagram", icon: faInstagram, color: "#e1306c" },
  linkedin:  { label: "LinkedIn",  icon: faLinkedin,  color: "#0077b5" },
  pinterest: { label: "Pinterest", icon: faPinterest, color: "#bd081c" },
  github:    { label: "GitHub",    icon: faGithub,    color: "#ffff00" },
  reddit:    { label: "Reddit",    icon: faReddit,    color: "#ff4500" },
  youtube:   { label: "YouTube",   icon: faYoutube,   color: "#ff0000" },
  // removed for now - the icon opens a page saying so (pages/Civitai.jsx)
  civitai:   { label: "Civitai",   icon: faBolt,      color: "#facc15", page: "/gone" },
  discord:   { label: "Discord",   icon: faDiscord,   color: "#5865f2" },
  x:         { label: "X (Twitter)", icon: faXTwitter, color: "#ffffff" },
  twitch:    { label: "Twitch",    icon: faTwitch,    color: "#9146ff" },
  facebook:  { label: "Facebook",  icon: faFacebook,  color: "#1877f2" },
  tiktok:    { label: "TikTok",    icon: faTiktok,    color: "#25f4ee" },
  spotify:   { label: "Spotify",   icon: faSpotify,   color: "#1db954" },
  behance:   { label: "Behance",   icon: faBehance,   color: "#1769ff" },
  dribbble:  { label: "Dribbble",  icon: faDribbble,  color: "#ea4c89" },
  website:   { label: "Website",   icon: faGlobe,     color: "#f39c12" },
};

export const PLATFORM_OPTIONS = Object.entries(PLATFORMS).map(([value, p]) => ({ value, label: p.label }));
