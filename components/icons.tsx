/**
 * Minimal line icons (24×24, stroke = currentColor). Hand-drawn to match the
 * monochrome style; add new ones to `paths` and use <Icon name="..." />.
 */
import type { SVGProps } from "react";

const paths = {
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </>
  ),
  star: <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />,
  speaker: (
    <>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
      <path d="M15.8 9a4.5 4.5 0 0 1 0 6" />
      <path d="M18.6 6.4a8.3 8.3 0 0 1 0 11.2" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
      <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
    </>
  ),
  restart: (
    <>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4.5V9h4.5" />
    </>
  ),
  list: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" strokeWidth="2.6" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3c-2.5 2.6-3.8 5.6-3.8 9s1.3 6.4 3.8 9" />
    </>
  ),
  sparkle: <path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.6-4.2 3.9-7 8-7s7.4 2.8 8 7" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M19 7h1M4 17h3M13 17h7" />
      <circle cx="16" cy="7" r="2.5" />
      <circle cx="10" cy="17" r="2.5" />
    </>
  ),
  chart: <path d="M5 20V11M11 20V5M17 20v-6M3 20h18" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />,
  upload: <path d="M12 20V9M7 13.5l5-5 5 5M5 4h14" />,
  flame: (
    <path d="M12 21.5a6.5 6.5 0 0 0 6.5-6.5c0-3.8-2.7-6.3-3.8-10-2.4 1.4-3.9 3.7-3.9 6.2-1-.8-1.6-2.2-1.6-3.4C6.9 9.6 5.5 12.3 5.5 15a6.5 6.5 0 0 0 6.5 6.5z" />
  ),
  // Deck icons
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" />
      <path d="M7.5 11h.01M10 7h.01M14.5 7h.01" strokeWidth="2.6" />
    </>
  ),
  hash: <path d="M9.5 3.5L7.5 20.5M16.5 3.5l-2 17M4.5 9h16M3.5 15h16" />,
  paw: (
    <>
      <path d="M12 11.5c-2.8 0-5.2 3.7-5.2 6 0 1.5 1.2 2.4 2.5 2.4 1 0 1.7-.6 2.7-.6s1.7.6 2.7.6c1.3 0 2.5-.9 2.5-2.4 0-2.3-2.4-6-5.2-6z" />
      <circle cx="6" cy="10" r="1.8" />
      <circle cx="9.5" cy="5.8" r="1.8" />
      <circle cx="14.5" cy="5.8" r="1.8" />
      <circle cx="18" cy="10" r="1.8" />
    </>
  ),
  cup: (
    <>
      <path d="M4.5 9h12v4a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" />
      <path d="M16.5 10.5h1.3a2.4 2.4 0 0 1 0 4.8h-1.6" />
      <path d="M8.5 3c0 1.5 1 1.5 1 3M12.5 3c0 1.5 1 1.5 1 3" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c.4-3.4 2.9-5.8 6-5.8s5.6 2.4 6 5.8" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 14.3c2.6.2 4.5 2.2 5 4.9" />
    </>
  ),
  book: (
    <>
      <path d="M3.5 5h5.5a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5h-6z" />
      <path d="M20.5 5H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5h6z" />
    </>
  ),
  spark: <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />,
  plane: (
    <>
      <path d="M21 3.5L3 10.5l7 2.6 2.7 7.4z" />
      <path d="M21 3.5L10 13.1" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C10.5 4 4.5 8.8 4.5 15.6c0 1.6.3 3 .8 4.4C12.6 20 20 15.8 20 4z" />
      <path d="M5.3 20c3-4.7 6-7.3 9.7-9.5" />
    </>
  ),
  hand: (
    <path d="M8 13.5V6a1.5 1.5 0 0 1 3 0v6M11 11.5V4.5a1.5 1.5 0 0 1 3 0v7M14 11.5V6a1.5 1.5 0 0 1 3 0v7M17 10a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-.8a7 7 0 0 1-5.5-2.7L3.6 16a1.6 1.6 0 0 1 2.4-2.1L8 16" />
  ),
  house: (
    <>
      <path d="M3.5 11L12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  shirt: <path d="M8.5 3.5L3.5 6.5l2 4.3 2.5-1V20.5h8V9.8l2.5 1 2-4.3-5-3c-.6 1.5-2 2.5-3.5 2.5s-2.9-1-3.5-2.5z" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.6" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" />
      <path d="M12 17h.01" strokeWidth="2.6" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.4 11h10.2L20 8H6.2" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" strokeWidth="2.4" />
      <path d="M10 21v-3h4v3" />
    </>
  ),
  car: (
    <>
      <path d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11" />
      <rect x="3" y="11" width="18" height="6" rx="2" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
  bus: (
    <>
      <rect x="5" y="3" width="14" height="15" rx="3" />
      <path d="M5 11h14M8 18v2M16 18v2" />
      <path d="M8.5 14.5h.01M15.5 14.5h.01" strokeWidth="2.4" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2.5 3-2.5 15 0 18M3.5 9.5c5 1.5 12 1.5 17 0M3.5 14.5c5-1.5 12-1.5 17 0" />
    </>
  ),
  gamepad: (
    <>
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <path d="M7 10v4M5 12h4" />
      <path d="M15.5 11h.01M18 13h.01" strokeWidth="2.6" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M2 19h20" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  plus: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />,
  cloud: <path d="M7 18h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 18z" />,
  apple: (
    <>
      <path d="M12 7c-1.5-1-5-1-6 2-1.2 3.6.8 9 3.5 10 1 .4 1.6-.2 2.5-.2s1.5.6 2.5.2c2.7-1 4.7-6.4 3.5-10-1-3-4.5-3-6-2z" />
      <path d="M12 7c0-2 1-3.5 3-4" />
    </>
  ),
  carrot: (
    <>
      <path d="M16.5 7.5c-1.8-1.8-4.3-1-5.6.3L4 17.5c-.9 1.3.2 2.4 1.5 1.5l9.7-6.9c1.3-1.3 2.1-3.8.3-5.6z" />
      <path d="M16.5 7.5L20 4M16 5.5l1-3M18.5 8l3-1" />
    </>
  ),
  pot: (
    <>
      <path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M2 10h20M9 6.5c0-1 1-1.5 1-2.5M14 6.5c0-1 1-1.5 1-2.5" />
    </>
  ),
  fork: (
    <>
      <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" />
      <path d="M17 21V3c-2 1-3 4-3 8h3" />
    </>
  ),
  flower: (
    <>
      <path d="M12 21v-9" />
      <path d="M7 4l2.5 2L12 3l2.5 3L17 4v4a5 5 0 0 1-10 0z" />
      <path d="M12 17c-2-2-4.5-2.5-6-2M12 15c2-1.5 4-2 6-1.5" />
    </>
  ),
  tree: (
    <>
      <path d="M12 21v-5" />
      <path d="M12 3l6 8h-3l4 5H5l4-5H6z" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M3 11a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v6H3z" />
      <path d="M5 17v2M19 17v2" />
    </>
  ),
  broom: (
    <>
      <path d="M19 3l-7 7" />
      <path d="M12 10l-6 2-3 7 7-3 2-6z" />
      <path d="M6.5 15.5l2-2" />
    </>
  ),
  cube: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5 12v8h14v-8M12 8v12" />
      <path d="M12 8c-1.5-3-5-4-5-1.5S10 8 12 8zm0 0c1.5-3 5-4 5-1.5S14 8 12 8z" />
    </>
  ),
  bank: <path d="M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18" />,
  news: (
    <>
      <rect x="3" y="5" width="15" height="14" rx="1.5" />
      <path d="M18 9h2.5v8a2 2 0 0 1-2 2" />
      <path d="M7 9h7M7 12.5h7M7 16h4" />
    </>
  ),
  arrows: <path d="M4 12h15M14 7l5 5-5 5M4 7h5M4 17h5" />,
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  planet: (
    <>
      <circle cx="12" cy="12" r="5" />
      <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" />
      <circle cx="7" cy="10.5" r="1.8" />
    </>
  ),
  ruler: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="1" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </>
  ),
  bug: (
    <>
      <rect x="7" y="7" width="10" height="13" rx="5" />
      <path d="M12 7v13M9 4l1.5 3M15 4l-1.5 3M7 11H4M17 11h3M7 15H4M17 15h3" />
    </>
  ),
  siren: (
    <>
      <path d="M7 18v-6a5 5 0 0 1 10 0v6" />
      <path d="M4 18h16v3H4zM12 3v2M4.5 6.5L6 8M19.5 6.5L18 8" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l2 2M15 8l2 2" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </>
  ),
  fish: (
    <>
      <path d="M3 12c3-4.5 7-6 10.5-6 3.5 0 6 3 7 6-1 3-3.5 6-7 6-3.5 0-7.5-1.5-10.5-6z" />
      <path d="M3 12l-1-3.5M3 12l-1 3.5M16 10.5v.01" />
    </>
  ),
  tent: (
    <>
      <path d="M12 4L3 20h18z" />
      <path d="M12 4v16M9.5 20L12 14l2.5 6" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="M16 13.5h.01" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M8 20h8M5 7h14" />
      <path d="M5 7l-2.5 6a3 3 0 0 0 5 0zM19 7l-2.5 6a3 3 0 0 0 5 0z" />
    </>
  ),
  hammer: (
    <>
      <path d="M13.5 6.5l4 4" />
      <path d="M11 9L4.5 15.5a1.8 1.8 0 0 0 2.5 2.5L13.5 11.5" />
      <path d="M10 5.5l3-2.5 6 6-2.5 3z" />
    </>
  ),
  drop: <path d="M12 3.5c3 3.8 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.7 6-10.5z" />,
  film: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4" />
    </>
  ),
  pill: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-40 12 12)" />
      <path d="M9.3 9.3l5.4 5.4" />
    </>
  ),
  mountain: (
    <>
      <path d="M3 19l6.5-11 4 6.5 2-3L21 19z" />
      <path d="M7.5 11.5l2 1.5 2-1.5" />
    </>
  ),
  bird: (
    <>
      <path d="M4 13c2.5 4 8 5.5 12 2.5L21 8h-3.5a3.5 3.5 0 0 0-6 1.5L8 13z" />
      <path d="M8 13l-3.5-1M10 17.5L9 21M14 16.5l1 3.5M17.5 8.5h.01" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21c0-3.5 2.7-6 6-6s6 2.5 6 6M10.5 8h.01M13.5 8h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  brain: (
    <>
      <path d="M12 5.5a3 3 0 0 0-5.5-1.5A3 3 0 0 0 4 8.5a3.5 3.5 0 0 0 .5 6A3.5 3.5 0 0 0 8 19.5a3 3 0 0 0 4-.5z" />
      <path d="M12 5.5a3 3 0 0 1 5.5-1.5A3 3 0 0 1 20 8.5a3.5 3.5 0 0 1-.5 6 3.5 3.5 0 0 1-3.5 5 3 3 0 0 1-4-.5z" />
      <path d="M12 5.5V19" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3.5 7l8.5 6.5L20.5 7" />
    </>
  ),
  crown: (
    <>
      <path d="M4 8l4 4 4-6 4 6 4-4-1.5 10h-13z" />
      <path d="M5.5 21h13" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  feather: (
    <>
      <path d="M19 4c-6 0-12 4.5-12 11v5" />
      <path d="M19 4c0 7-4 12-10.5 12M7 15h5M9 11.5h5" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  filled = false,
  ...rest
}: { name: IconName | string; size?: number; filled?: boolean } & SVGProps<SVGSVGElement>) {
  const content = paths[name as IconName] ?? paths.sparkle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {content}
    </svg>
  );
}
