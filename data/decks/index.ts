/**
 * Deck registry. To add a deck:
 *   1. Create data/decks/<id>.json (copy an existing one).
 *   2. Import it below and add it to the list.
 *   3. Run `npm run validate:decks`.
 */
import type { Deck } from "@/lib/types";

import greetings from "./greetings.json";
import numbers from "./numbers.json";
import colors from "./colors.json";
import time from "./time.json";
import family from "./family.json";
import body from "./body.json";
import food from "./food.json";
import fruit from "./fruit.json";
import vegetables from "./vegetables.json";
import animals from "./animals.json";
import home from "./home.json";
import clothes from "./clothes.json";
import school from "./school.json";
import verbs from "./verbs.json";
import adjectives from "./adjectives.json";
import pronouns from "./pronouns.json";
import nature from "./nature.json";
import weather from "./weather.json";
import city from "./city.json";
import jobs from "./jobs.json";
import shopping from "./shopping.json";
import basicNouns from "./basic-nouns.json";
import travel from "./travel.json";
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
import bathroom from "./bathroom.json";
import drinks from "./drinks.json";
import toys from "./toys.json";
import post from "./post.json";
import directions from "./directions.json";
import camping from "./camping.json";
import sea from "./sea.json";
import pets from "./pets.json";
import airport from "./airport.json";
import office from "./office.json";
import household from "./household.json";
import adjectivesUseful from "./adjectives-useful.json";
import verbsUseful from "./verbs-useful.json";
import sleep from "./sleep.json";
import bodyLanguage from "./body-language.json";
import quantities from "./quantities.json";
import appliances from "./appliances.json";
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
import money from "./money.json";
import hospital from "./hospital.json";
import illnesses from "./illnesses.json";
import relationships from "./relationships.json";
import lifeEvents from "./life-events.json";
import geography from "./geography.json";
import farm from "./farm.json";
import tools from "./tools.json";
import construction from "./construction.json";
import cooking from "./cooking.json";
import theatreFilm from "./theatre-film.json";
import books from "./books.json";
import fashion from "./fashion.json";
import verbsPrefixed from "./verbs-prefixed.json";
import maths from "./maths.json";
import space from "./space.json";
import internet from "./internet.json";
import wildlife from "./wildlife.json";
import senses from "./senses.json";
import czechFood from "./czech-food.json";
import careers from "./careers.json";
import fitness from "./fitness.json";
import communication from "./communication.json";
import crafts from "./crafts.json";
import forest from "./forest.json";
import verbsChange from "./verbs-change.json";
import verbsMovement from "./verbs-movement.json";
import water from "./water.json";
import fairyTales from "./fairy-tales.json";
import workVerbs from "./work-verbs.json";
import sportsGear from "./sports-gear.json";
import appearance from "./appearance.json";
import virtues from "./virtues.json";
import travelProblems from "./travel-problems.json";
import adjectivesB2 from "./adjectives-b2.json";
import linkingWords from "./linking-words.json";
import verbsMind from "./verbs-mind.json";
import law from "./law.json";
import politics from "./politics.json";
import economy from "./economy.json";
import history from "./history.json";
import military from "./military.json";
import mind from "./mind.json";
import religion from "./religion.json";
import physicsChem from "./physics-chem.json";
import energyIndustry from "./energy-industry.json";
import verbsB2 from "./verbs-b2.json";
import nounsB2 from "./nouns-b2.json";
import adverbsB2 from "./adverbs-b2.json";
import expressions from "./expressions.json";
import insurance from "./insurance.json";
import education from "./education.json";
import societyB2 from "./society-b2.json";
import feelingsB2 from "./feelings-b2.json";
import disasters from "./disasters.json";
import familyLife from "./family-life.json";
import timeWords from "./time-words.json";

export const DECKS: Deck[] = [
  greetings,
  numbers,
  colors,
  time,
  family,
  body,
  food,
  fruit,
  vegetables,
  animals,
  home,
  clothes,
  school,
  verbs,
  adjectives,
  pronouns,
  nature,
  weather,
  city,
  jobs,
  shopping,
  basicNouns,
  travel,
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
  bathroom,
  drinks,
  toys,
  post,
  directions,
  camping,
  sea,
  pets,
  airport,
  office,
  household,
  adjectivesUseful,
  verbsUseful,
  sleep,
  bodyLanguage,
  quantities,
  appliances,
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
  money,
  hospital,
  illnesses,
  relationships,
  lifeEvents,
  geography,
  farm,
  tools,
  construction,
  cooking,
  theatreFilm,
  books,
  fashion,
  verbsPrefixed,
  maths,
  space,
  internet,
  wildlife,
  senses,
  czechFood,
  careers,
  fitness,
  communication,
  crafts,
  forest,
  verbsChange,
  verbsMovement,
  water,
  fairyTales,
  workVerbs,
  sportsGear,
  appearance,
  virtues,
  travelProblems,
  adjectivesB2,
  linkingWords,
  verbsMind,
  law,
  politics,
  economy,
  history,
  military,
  mind,
  religion,
  physicsChem,
  energyIndustry,
  verbsB2,
  nounsB2,
  adverbsB2,
  expressions,
  insurance,
  education,
  societyB2,
  feelingsB2,
  disasters,
  familyLife,
  timeWords,
].sort((a, b) => a.order - b.order);
