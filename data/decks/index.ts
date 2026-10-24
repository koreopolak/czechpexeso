/**
 * Deck registry. To add a deck:
 *   1. Create data/decks/<id>.json (copy an existing one).
 *   2. Import it below and add it to the list.
 *   3. Run `npm run validate:decks`.
 */
import type { Deck } from "@/lib/types";

import colors from "./colors.json";
import numbers from "./numbers.json";
import animals from "./animals.json";
import food from "./food.json";
import family from "./family.json";
import school from "./school.json";
import verbs from "./verbs.json";
import travel from "./travel.json";
import nature from "./nature.json";
import body from "./body.json";
import home from "./home.json";
import clothes from "./clothes.json";

export const DECKS: Deck[] = [
  colors,
  numbers,
  animals,
  food,
  family,
  school,
  verbs,
  travel,
  nature,
  body,
  home,
  clothes,
].sort((a, b) => a.order - b.order);
