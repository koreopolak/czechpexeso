/**
 * Product settings that are safe to share between server and browser.
 * Change limits and fallback prices here.
 */
export const SITE = {
  name: "Czech Pexeso",
  domain: "czechpexeso.net",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://czechpexeso.net").replace(/\/$/, ""),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@czechpexeso.net",
} as const;

/**
 * Shown on the Privacy and Terms pages. Fill these in before going live —
 * Paddle and EU consumer law require identifying who runs the site.
 */
export const LEGAL = {
  operator: process.env.NEXT_PUBLIC_LEGAL_OPERATOR || "the operator of czechpexeso.net",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  companyId: process.env.NEXT_PUBLIC_LEGAL_COMPANY_ID || "",
  country: "the Republic of Korea",
  updated: "25 October 2026",
} as const;

export const LIMITS = {
  /** Games a free player can finish per day (all decks are free). 0 disables the limit. */
  freeGamesPerDay: 5,
  /** Recent games visible in the progress history for free players. */
  freeHistoryVisible: 10,
  /** Hard cap of stored history entries (local and cloud). */
  maxHistory: 500,
} as const;

export const FEATURES = {
  /**
   * Sync progress for every signed-in player (Google or email). Set to false
   * to make cloud sync a Premium-only feature again.
   */
  syncForEveryone: true,
} as const;

/**
 * Stars rate how fast a board was cleared: [3 stars, 2 stars] limits in
 * seconds per board size. Slower than the 2-star limit earns 1 star.
 * The clock pauses while the tab is in the background.
 */
export const STAR_SECONDS: Record<string, readonly [number, number]> = {
  "4x3": [30, 55],
  "4x4": [45, 80],
  "6x4": [80, 140],
  "6x6": [140, 240],
};

/**
 * Shown on the pricing page when Paddle is not configured or prices can't be
 * fetched. When Paddle is configured the real amounts (in the visitor's local
 * currency) come from Paddle.
 */
export const FALLBACK_PRICES = {
  month: { amount: 299, currency: "eur" },
  year: { amount: 1499, currency: "eur" },
  lifetime: { amount: 4499, currency: "eur" },
};

/** The daily challenge resets at midnight in this time zone. */
export const DAILY_TIME_ZONE = "Europe/Prague";
export const DAILY_PAIRS = 8;
