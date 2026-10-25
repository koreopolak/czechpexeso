#!/usr/bin/env node
/**
 * Validates every deck in data/decks/*.json and checks it is registered in
 * data/decks/index.ts.
 *
 *   npm run validate:decks
 *
 * Rules (a broken deck makes a broken game, so these are strict):
 *  - required fields are present and well-typed
 *  - every word has Czech + all source languages
 *  - word ids are unique inside a deck
 *  - no two words share the same text in the same language
 *    (two identical-looking cards that don't match would confuse players)
 *  - each deck has enough words for the largest grid (18 pairs)
 *  - the same word (same Czech + same English) is not in two decks
 *  - level is A1, A2, B1 or B2 (the deck screen groups decks by level)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "data", "decks");
const LANGS = ["en", "uk", "ru", "pl"];
const MIN_WORDS = 18;

const errors = [];
const warn = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
const registry = fs.readFileSync(path.join(dir, "index.ts"), "utf8");
const ids = new Set();
const orders = new Set();
/** "czech|english" → deck id, to catch the same word in two decks. */
const everywhere = new Map();
const LEVELS = ["A1", "A2", "B1", "B2"];
let totalWords = 0;

for (const file of files) {
  let deck;
  try {
    deck = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  } catch (e) {
    err(file, `invalid JSON (${e.message})`);
    continue;
  }

  if (!/^[a-z0-9-]+$/.test(deck.id ?? "")) err(file, "id must be lowercase letters, digits or dashes");
  if (`${deck.id}.json` !== file) err(file, `file name must be "${deck.id}.json"`);
  if (ids.has(deck.id)) err(file, `duplicate deck id "${deck.id}"`);
  ids.add(deck.id);
  if (!registry.includes(`./${deck.id}.json`)) err(file, "not imported in data/decks/index.ts");

  if (typeof deck.order !== "number") err(file, "order must be a number");
  else if (orders.has(deck.order)) warn.push(`${file}: order ${deck.order} is used by another deck`);
  orders.add(deck.order);
  if (typeof deck.icon !== "string") err(file, "icon must be a string");
  if (!LEVELS.includes(deck.level)) err(file, `level must be one of ${LEVELS.join(", ")}`);

  for (const l of ["cs", ...LANGS]) if (!deck.title?.[l]) err(file, `title.${l} is missing`);
  for (const l of LANGS) if (!deck.description?.[l]) err(file, `description.${l} is missing`);

  if (!Array.isArray(deck.words)) {
    err(file, "words must be an array");
    continue;
  }
  if (deck.words.length < MIN_WORDS) err(file, `needs at least ${MIN_WORDS} words (has ${deck.words.length})`);

  const seenIds = new Set();
  const seenText = Object.fromEntries(["cs", ...LANGS].map((l) => [l, new Map()]));
  deck.words.forEach((w, i) => {
    const where = `word #${i + 1} (${w.id ?? "?"})`;
    if (!/^[a-z0-9-]+$/.test(w.id ?? "")) err(file, `${where}: id must be lowercase letters, digits or dashes`);
    if (seenIds.has(w.id)) err(file, `${where}: duplicate id`);
    seenIds.add(w.id);
    for (const l of ["cs", ...LANGS]) {
      const text = w[l];
      if (typeof text !== "string" || !text.trim()) {
        err(file, `${where}: "${l}" is missing`);
        continue;
      }
      if (text !== text.trim()) err(file, `${where}: "${l}" has leading/trailing spaces`);
      const key = text.toLocaleLowerCase();
      if (seenText[l].has(key)) err(file, `${where}: "${l}" text "${text}" is also used by ${seenText[l].get(key)}`);
      seenText[l].set(key, w.id);
    }
    const both = `${String(w.cs).toLocaleLowerCase()}|${String(w.en).toLocaleLowerCase()}`;
    if (everywhere.has(both)) err(file, `${where}: "${w.cs}" (${w.en}) is already in the "${everywhere.get(both)}" deck`);
    else everywhere.set(both, deck.id);
  });
  // A Czech card must not look like the translation card of a *different* word
  // (e.g. Czech "my" = we next to English "my" = possessive).
  for (const l of LANGS) {
    deck.words.forEach((w) => {
      const owner = seenText[l].get(String(w.cs).toLocaleLowerCase());
      if (owner && owner !== w.id) err(file, `Czech "${w.cs}" (${w.id}) looks like the ${l} card of "${owner}"`);
    });
  }
  totalWords += deck.words.length;
}

warn.forEach((w) => console.warn(`warning  ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error    ${e}`));
  console.error(`\n${errors.length} problem(s) in ${files.length} deck file(s).`);
  process.exit(1);
}
console.log(`All ${files.length} decks are valid: ${totalWords} words, ${everywhere.size} unique.`);
