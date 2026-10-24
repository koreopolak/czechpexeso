/** Source languages a player can translate cards from. Czech is always the target. */
export const SOURCE_LANGS = ["en", "uk", "ru", "pl"] as const;
export type SourceLang = (typeof SOURCE_LANGS)[number];

/** Languages the interface itself is translated into. */
export const UI_LOCALES = ["en", "uk", "ru", "pl"] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

/** Short labels shown in language pickers (UA is what most people expect for Ukrainian). */
export const LANG_CODES: Record<SourceLang, string> = { en: "EN", uk: "UA", ru: "RU", pl: "PL" };
export const LANG_NAMES: Record<SourceLang, string> = {
  en: "English",
  uk: "Українська",
  ru: "Русский",
  pl: "Polski",
};
/** BCP-47 tags used for `lang` attributes (hyphenation, screen readers). */
export const LANG_TAGS: Record<SourceLang | "cs", string> = {
  cs: "cs",
  en: "en",
  uk: "uk",
  ru: "ru",
  pl: "pl",
};

export function isSourceLang(v: unknown): v is SourceLang {
  return typeof v === "string" && (SOURCE_LANGS as readonly string[]).includes(v);
}
export function isUiLocale(v: unknown): v is UiLocale {
  return typeof v === "string" && (UI_LOCALES as readonly string[]).includes(v);
}

/** One vocabulary item. `cs` is Czech; the others are translations. */
export type Word = {
  id: string;
  cs: string;
  /** Optional note shown in word lists, e.g. "informal" or a gender marker. */
  note?: string;
} & Record<SourceLang, string>;

/** Shape of a deck JSON file in data/decks. */
export type Deck = {
  id: string;
  order: number;
  level: string;
  icon: string;
  title: Record<SourceLang | "cs", string>;
  description: Record<SourceLang, string>;
  words: Word[];
};

/** Deck info for listings (no translations, keeps pages light). */
export type DeckMeta = Omit<Deck, "words"> & {
  wordCount: number;
  /** Used to count words played (progress bars). */
  wordIds: string[];
  /** A few sample Czech words for the deck tile. */
  sample: string[];
};

/** Board sizes: columns x rows in landscape; the layout adapts on phones. */
export const GRID_SIZES = ["4x3", "4x4", "6x4", "6x6"] as const;
export type GridSize = (typeof GRID_SIZES)[number];
export function isGridSize(v: unknown): v is GridSize {
  return typeof v === "string" && (GRID_SIZES as readonly string[]).includes(v);
}
export function pairsForGrid(grid: GridSize): number {
  const [c, r] = grid.split("x").map(Number);
  return (c * r) / 2;
}

export type Entitlement = {
  /** Supabase is configured on this deployment. */
  authEnabled: boolean;
  /** Stripe is configured on this deployment. */
  billingEnabled: boolean;
  user: { id: string; email: string } | null;
  premium: boolean;
  subscription: SubscriptionInfo | null;
};

export type SubscriptionInfo = {
  status: string;
  interval: "month" | "year" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};
