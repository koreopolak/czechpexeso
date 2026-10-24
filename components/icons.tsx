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
