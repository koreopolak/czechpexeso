/**
 * Deck registry. To add a deck:
 *   1. Create data/decks/<id>.json (copy an existing one).
 *   2. Import it below and add it to the list.
 *   3. Run `npm run validate:decks`.
 */
import type { Deck } from "@/lib/types";

import colors from "./colors.json";
import greetings from "./greetings.json";
import numbers from "./numbers.json";
import animals from "./animals.json";
import food from "./food.json";
import time from "./time.json";
import family from "./family.json";
import school from "./school.json";
import verbs from "./verbs.json";
import fruit from "./fruit.json";
import travel from "./travel.json";
import nature from "./nature.json";
import vegetables from "./vegetables.json";
import body from "./body.json";
import home from "./home.json";
import clothes from "./clothes.json";
import adjectives from "./adjectives.json";
import pronouns from "./pronouns.json";
import weather from "./weather.json";
import city from "./city.json";
import jobs from "./jobs.json";
import shopping from "./shopping.json";
import verbsEveryday from "./verbs-everyday.json";
import verbsMotion from "./verbs-motion.json";
import verbsTalk from "./verbs-talk.json";
import emotions from "./emotions.json";
import personality from "./personality.json";
import describing from "./describing.json";
import adverbs from "./adverbs.json";
import littleWords from "./little-words.json";
import kitchen from "./kitchen.json";
import restaurant from "./restaurant.json";
import furniture from "./furniture.json";
import housework from "./housework.json";
import transport from "./transport.json";
import hotel from "./hotel.json";
import health from "./health.json";
import sports from "./sports.json";
import hobbies from "./hobbies.json";
import garden from "./garden.json";
import insects from "./insects.json";
import holidays from "./holidays.json";
import materials from "./materials.json";
import measures from "./measures.json";
import countries from "./countries.json";
import work from "./work.json";
import tech from "./tech.json";
import documents from "./documents.json";
import housing from "./housing.json";
import musicArt from "./music-art.json";
import media from "./media.json";
import society from "./society.json";
import environment from "./environment.json";
import science from "./science.json";
import car from "./car.json";
import emergency from "./emergency.json";
import studies from "./studies.json";
import verbsMore from "./verbs-more.json";
import adjectivesMore from "./adjectives-more.json";
import abstract from "./abstract.json";

export const DECKS: Deck[] = [
  colors,
  greetings,
  numbers,
  animals,
  food,
  time,
  family,
  school,
  verbs,
  fruit,
  travel,
  nature,
  vegetables,
  body,
  home,
  clothes,
  adjectives,
  pronouns,
  weather,
  city,
  jobs,
  shopping,
  verbsEveryday,
  verbsMotion,
  verbsTalk,
  emotions,
  personality,
  describing,
  adverbs,
  littleWords,
  kitchen,
  restaurant,
  furniture,
  housework,
  transport,
  hotel,
  health,
  sports,
  hobbies,
  garden,
  insects,
  holidays,
  materials,
  measures,
  countries,
  work,
  tech,
  documents,
  housing,
  musicArt,
  media,
  society,
  environment,
  science,
  car,
  emergency,
  studies,
  verbsMore,
  adjectivesMore,
  abstract,
].sort((a, b) => a.order - b.order);
