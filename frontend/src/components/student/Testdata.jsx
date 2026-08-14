import {
  Calculator,
  MessageSquare,
  Puzzle,
  BarChart3,
  Boxes,
  ListChecks,
  Compass,
  Brain,
  BookOpen,
  BrainCircuit,
} from "lucide-react";

/**
 * TrueMindPath - Local Content Tables
 * ------------------------------------------------------------------
 * Sections and subsections themselves (name, description, order, time
 * limit, instructions text) now come from the backend:
 *   - GET subsections -> ONE FLAT LIST for the student, no section
 *     grouping, no "get sections" endpoint at all.
 *
 * The backend does NOT return question content, icons, layout hints,
 * or (in practice) usable subtitle/instructions text, so those still
 * live here, keyed by the backend's REAL `subsection_code` values so
 * they can be merged onto whatever the API returns.
 *
 * CONFIRMED real codes, from the actual /subsections response:
 *   SUBSEC001 -> Quantitative Reasoning  -> SEC001
 *   SUBSEC002 -> Verbal Reasoning        -> SEC001
 *   SUBSEC003 -> Logical Reasoning       -> SEC001
 *   SUBSEC004 -> Rapid Assessment        -> SEC001
 *   SUBSEC005 -> Visual Reasoning        -> SEC001
 *   SUBSEC006 -> Career Interest         -> SEC002
 *   SUBSEC007 -> Learning Orientation    -> SEC003
 *
 * NOTE: the backend currently returns only these 7 subsections. There
 * is no "Mental Agility" subsection in the API at all right now, so
 * that question bank has been dropped from QUESTION_BANKS below (it
 * has no subsection_code to attach to, and would never render). If
 * the backend adds it later, give it a real subsection_code, add that
 * code to SUBSECTION_TO_SECTION, and reintroduce its QUESTION_BANKS
 * entry.
 * ------------------------------------------------------------------
 */

// 5-point like/dislike scale used by the Interest Inventory.
const INTEREST_OPTIONS = [
  "Strongly Dislike",
  "Dislike",
  "Neutral",
  "Like",
  "Strongly Like",
];
const interestQuestions = (items) =>
  items.map(({ prompt, category }) => ({ prompt, category, options: INTEREST_OPTIONS }));

// 4-point frequency scale used by the Study Habits inventory.
const STUDY_HABITS_OPTIONS = ["Never", "Sometimes", "Often", "Always"];
const studyHabitsQuestions = (items) =>
  items.map(({ prompt, category }) => ({ prompt, category, options: STUDY_HABITS_OPTIONS }));

// ------------------------------------------------------------------
// LOCAL SECTION IDENTITY — these codes no longer come from the
// backend at all. They're entirely ours now. Keep them stable once
// live: routes (/test/:testType/...) and autosave keys are built
// from them, so renaming one later breaks in-progress users'
// bookmarks/autosave.
// ------------------------------------------------------------------
export const SECTION_ORDER = ["SEC001", "SEC002", "SEC003"];

export const SECTION_META = {
  SEC001: {
    name: "Aptitude Test",
    icon: Brain,
    description: "Measure your reasoning, problem-solving, and analytical strengths.",
  },
  SEC002: {
    name: "Career Interest",
    icon: Compass,
    description: "Explore the careers and fields that naturally draw you in.",
  },
  SEC003: {
    name: "Learning Orientation",
    icon: ListChecks,
    description: "See how you plan, learn, and handle exam pressure.",
  },
};

export const DEFAULT_SECTION_ICON = Brain;
export const DEFAULT_SUBSECTION_ICON = BookOpen;

export const getSectionName = (sectionCode) => SECTION_META[sectionCode]?.name || sectionCode;

// Any subsection_code the backend sends that ISN'T listed below lands
// here — kept visible (as its own group) instead of disappearing, so
// a gap in this map is obvious in QA instead of silently dropping
// content.
export const UNASSIGNED_SECTION_CODE = "SEC_UNASSIGNED";

// THE static mapping: backend subsection_code -> our local
// section_code. CONFIRMED against the real /subsections response.
export const SUBSECTION_TO_SECTION = {
  SUBSEC001: "SEC001", // Quantitative Reasoning
  SUBSEC002: "SEC001", // Verbal Reasoning
  SUBSEC003: "SEC001", // Logical Reasoning
  SUBSEC004: "SEC001", // Rapid Assessment
  SUBSEC005: "SEC001", // Visual Reasoning
  SUBSEC008: "SEC001", // Mental Ability

  SUBSEC006: "SEC002", // Career Interest
  SUBSEC007: "SEC003", // Learning Orientation

};

// ------------------------------------------------------------------
// QUESTION_BANKS — keyed by REAL backend `subsection_code`.
// Supplies icon + static subtitle/instructions/difficulty + question
// content. `title` and `timeLimit` come from the backend at runtime
// (see useTestSubsections) and are NOT duplicated here.
// ------------------------------------------------------------------
export const QUESTION_BANKS = {
  // ---- SUBSEC001 — Quantitative Reasoning (SEC001) --------------------------
  SUBSEC001: {
    icon: Calculator,
    subtitle: "Arithmetic, Number Sequences & Mathematics",
    difficulty: "Adaptive",
    layout: "multi-question",
    totalQuestions: 21,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
    // questions: [
    //   { prompt: "Add 32 + 63 + 67 + 47", options: ["308", "206", "209", "241"], answer: "209" },
    //   { prompt: "Subtract 874 - 187", options: ["653", "687", "587", "692"], answer: "687" },
    //   { prompt: "Multiply 537 × 4", options: ["2248", "2438", "3118", "2148"], answer: "2148" },
    //   { prompt: "Divide 2135 ÷ 7", options: ["305", "311", "287", "321"], answer: "305" },
    //   { prompt: "Calculate 3.86 × 18.47", options: ["72.3456", "70.1243", "76.3792", "71.2942"], answer: "71.2942" },
    //   { prompt: "Which of the following is a prime number?", options: ["97", "44", "81", "1"], answer: "97" },
    //   { prompt: "Add 7.43 + 8.99", options: ["15.88", "16.42", "16.05", "14.45"], answer: "16.42" },
    //   { prompt: "120% of 40 is:", options: ["48", "45", "52", "35"], answer: "48" },
    //   { prompt: "Calculate 4 + 44 + 444 + 4.44", options: ["505.44", "450.04", "485.44", "496.44"], answer: "496.44" },
    //   { prompt: "666 ÷ 6 ÷ 3 = ?", options: ["37", "28", "22", "25"], answer: "37" },
    //   { prompt: "Complete the series: 3, 4, 7, 8, 11, 12, ?", options: ["18", "15", "10", "21"], answer: "15" },
    //   { prompt: "Complete the series: 2, 6, 18, 54, ?", options: ["182", "199", "140", "162"], answer: "162" },
    //   { prompt: "Complete the series: 2, 4, 8, 14, 22, ?", options: ["31", "40", "32", "25"], answer: "32" },
    //   { prompt: "Find the odd one out.", options: ["422", "189", "144", "248"], answer: "189" },
    //   { prompt: "Find the odd one out.", options: ["1", "4", "15", "9"], answer: "15" },
    //   {
    //     prompt: "The sum of the digits of a two-digit number is 15 and the difference between the digits is 3. What is the number?",
    //     options: ["36", "87", "46", "69"],
    //     answer: "69",
    //   },
    //   {
    //     prompt: "A two-digit number has a product of digits equal to 8. Adding 18 reverses its digits. What is the number?",
    //     options: ["24", "42", "18", "None"],
    //     answer: "24",
    //   },
    //   { prompt: "(?) + 369 + 198 - 2047 = 3412", options: ["4015", "4751", "4892", "3548"], answer: "4892" },
    //   { prompt: "Choose the option that does not belong to the group.", options: ["137", "149", "157", "173"], answer: "149" },
    //   { prompt: "The sum of the first five prime numbers is:", options: ["12", "29", "31", "28"], answer: "28" },
    //   { prompt: "Calculate 4 + 33 + 333 + 3.33", options: ["182", "195", "100", "185"], answer: "195" },
    // ],
  },

  // ---- SUBSEC002 — Verbal Reasoning (SEC001) ---------------------------------
  SUBSEC002: {
    icon: MessageSquare,
    subtitle: "Vocabulary, Analogies, Comprehension & Language Skills",
    difficulty: "Adaptive",
    layout: "multi-question",
    totalQuestions: 23,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
    // questions: [
    //   { prompt: "BRIEF means:", options: ["Limited", "Small", "Little", "Short"], answer: "Short" },
    //   { prompt: "FAKE means:", options: ["Original", "Imitation", "Trustworthy", "Loyal"], answer: "Imitation" },
    //   { prompt: "ATTEMPT means:", options: ["Serve", "Explore", "Try", "Explain"], answer: "Try" },
    //   { prompt: "MINOR - Choose the antonym:", options: ["Big", "Major", "Tall", "Heavy"], answer: "Major" },
    //   { prompt: "PRELIMINARY - Choose the antonym:", options: ["Final", "First", "Secondary", "Initial"], answer: "Final" },
    //   { prompt: "ENCOURAGE - Choose the antonym:", options: ["Dampen", "Disapprove", "Discourage", "Warn"], answer: "Discourage" },
    //   {
    //     prompt: "She never visits any zoo because she is a strong opponent of the idea of ______.",
    //     options: [
    //       "setting the animals free into forest",
    //       "feeding the animals while others are watching",
    //       "going out of the house on a holiday",
    //       "holding the animals in captivity for our joy",
    //     ],
    //     answer: "holding the animals in captivity for our joy",
    //   },
    //   {
    //     prompt: "I felt somewhat more relaxed ______.",
    //     options: [
    //       "but tense as compared to earlier",
    //       "and tense as compared to earlier",
    //       "as there was already no tension at all",
    //       "and tension-free as compared to earlier",
    //     ],
    //     answer: "but tense as compared to earlier",
    //   },
    //   {
    //     prompt: "The officer who had neglected to file his income tax returns had to ______.",
    //     options: ["return the files", "pay a fine", "be rewarded", "play mischief"],
    //     answer: "pay a fine",
    //   },
    //   {
    //     prompt: "His behaviour is so unpredictable that he ______.",
    //     options: [
    //       "never depends upon others for getting his work done",
    //       "is seldom trusted by others",
    //       "always finds it difficult to keep his word",
    //       "always insists on getting the work completed on time",
    //     ],
    //     answer: "is seldom trusted by others",
    //   },
    //   { prompt: "LIGHT : BLIND", options: ["speech : dumb", "language : deaf", "tongue : sound", "voice : vibration"], answer: "speech : dumb" },
    //   { prompt: "TEN : DECIMAL", options: ["seven : septet", "four : quartet", "two : binary", "five : quince"], answer: "two : binary" },
    //   { prompt: "GRAVITY : PULL", options: ["iron : metal", "north pole : directions", "magnetism : attraction", "dust : desert"], answer: "magnetism : attraction" },
    //   { prompt: "AFTER : BEFORE", options: ["first : second", "present : past", "contemporary : historic", "successor : predecessor"], answer: "successor : predecessor" },
    //   {
    //     prompt: "To keep one's temper means:",
    //     options: ["To become hungry", "To be in good mood", "To preserve one's energy", "To be aloof from", "None of these"],
    //     answer: "To be in good mood",
    //   },
    //   {
    //     prompt: "To pick holes means:",
    //     options: ["To find some reason to quarrel", "To destroy something", "To criticise someone", "To cut some part of an item"],
    //     answer: "To criticise someone",
    //   },
    //   {
    //     prompt: "To hit the nail right on the head means:",
    //     options: ["To do the right thing", "To destroy one's reputation", "To announce one's fixed views", "To teach someone a lesson"],
    //     answer: "To do the right thing",
    //   },
    //   {
    //     prompt: "A man of straw means:",
    //     options: ["A man of no substance", "A very active person", "A worthy fellow", "An unreasonable person"],
    //     answer: "A man of no substance",
    //   },
    //   { prompt: "Better late than ______.", options: ["Today", "Sometime", "Never", "Ever"], answer: "Never" },
    //   { prompt: "The grass is always greener on the other ______.", options: ["East", "Part", "Side", "Coast"], answer: "Side" },
    //   { prompt: "Don't cry over spilled ______.", options: ["Broth", "Beans", "Honey", "Milk"], answer: "Milk" },
    //   {
    //     prompt: "I told him that he was not working hard.",
    //     options: [
    //       'I said to him, "You are not working hard."',
    //       'I told to him, "You are not working hard."',
    //       'I said, "You are not working hard."',
    //       'I said to him, "He is not working hard."',
    //     ],
    //     answer: 'I said to him, "You are not working hard."',
    //   },
    //   {
    //     prompt: "She exclaimed with sorrow that it was a very miserable plight.",
    //     options: [
    //       'She said with sorrow, "What a pity it is."',
    //       'She said, "What a mystery it is."',
    //       'She said, "What a miserable sight it is."',
    //       'She said, "What a miserable plight it is."',
    //     ],
    //     answer: 'She said, "What a miserable plight it is."',
    //   },
    // ],
  },

  // ---- SUBSEC003 — Logical Reasoning (SEC001) --------------------------------
  SUBSEC003: {
    icon: Puzzle,
    subtitle: "Logical & Analytical Reasoning",
    difficulty: "Adaptive",
    layout: "multi-question",
    totalQuestions: 22,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
    // questions: [
    //   { prompt: "Complete the series: ELFA, GLHA, ILJA, ____, MLNA", options: ["OLPA", "KLMA", "LLMA", "KLLA"], answer: "KLMA" },
    //   { prompt: "Complete the series: QAR, RAS, SAT, TAU, ____", options: ["UAV", "VAT", "TWA", "TBR"], answer: "UAV" },
    //   { prompt: "Complete the series: JAK, KBL, LCM, MDN, ____", options: ["REP", "NEO", "ENG", "SPW"], answer: "NEO" },
    //   { prompt: "Complete the series: CMM, EOO, GQQ, ____, KUU", options: ["IRR", "HSS", "ISS", "GTT"], answer: "ISS" },
    //   { prompt: "Complete the series: C-45, D-40, E-35, ____, G-25", options: ["F-21", "H-30", "F-30", "G-30"], answer: "F-30" },
    //   {
    //     prompt: "Sanya is older than Sahil. Soham is older than Sanya. Sahil is older than Soham. If the first two statements are true, the third statement is:",
    //     options: ["True", "False", "Uncertain"],
    //     answer: "False",
    //   },
    //   {
    //     prompt: "Blackberries cost more than strawberries. Blackberries cost less than raspberries. Raspberries cost more than strawberries and blackberries. If the first two statements are true, the third statement is:",
    //     options: ["True", "False", "Uncertain"],
    //     answer: "True",
    //   },
    //   {
    //     prompt: "During the past year, Anil saw more movies than Mohan. Mohan saw fewer movies than Dinesh. Dinesh saw more movies than Anil. If the first two statements are true, the third statement is:",
    //     options: ["True", "False", "Uncertain"],
    //     answer: "Uncertain",
    //   },
    //   { prompt: "If LEAK → MHYF and RAFT → SDDO, how will FIFE be coded?", options: ["GLDZ", "HLDV", "GLZD", "IFFE"], answer: "GLDZ" },
    //   { prompt: "If CONSULT is written as FOQRVWX, how will MAGNETS be written?", options: ["FROWQVX", "DHROPWV", "DHJPQVW", "LCUTESR"], answer: "DHJPQVW" },
    //   { prompt: "Find the odd one out.", options: ["Leaf", "Oxygen", "Stem", "Flower"], answer: "Oxygen" },
    //   { prompt: "Find the odd one out.", options: ["District", "State", "City", "Road"], answer: "Road" },
    //   { prompt: "Find the odd one out.", options: ["Bucket", "Door", "Room", "Window"], answer: "Bucket" },
    //   { prompt: "Find the odd one out.", options: ["Index", "Mark", "Chapters", "Preface"], answer: "Mark" },
    //   { prompt: "PETAL : FLOWER", options: ["salt : pepper", "tire : bicycle", "base : ball", "sandals : shoes"], answer: "tire : bicycle" },
    //   {
    //     prompt: "DEPRESSED : SAD",
    //     options: ["towering : cringing", "rapid : plodding", "progressive : regressive", "exhausted : tired"],
    //     answer: "exhausted : tired",
    //   },
    //   { prompt: "BRISTLE : BRUSH", options: ["arm : leg", "stage : curtain", "recline : chair", "key : piano"], answer: "key : piano" },
    //   {
    //     prompt:
    //       "Here are some words translated from an artificial language.\n\n'granamelke' means big tree\n'pinimelke' means little tree\n'melkehoon' means tree house\n\nWhich word could mean 'big house'?",
    //     options: ["granahoon", "pinishur", "pinihoon", "melkegrana"],
    //     answer: "granahoon",
    //   },
    //   {
    //     prompt:
    //       "Here are some words translated from an artificial language.\n\n'lelibroon' means yellow hat\n'plekafroti' means flower garden\n'frotimix' means garden salad\n\nWhich word could mean 'yellow flower'?",
    //     options: ["lelifroti", "lelipleka", "plekabroon", "frotibroon"],
    //     answer: "lelipleka",
    //   },
    //   { prompt: "Which word does NOT belong with the others?", options: ["Triangle", "Circle", "Oval", "Sphere"], answer: "Triangle" },
    //   { prompt: "Which word does NOT belong with the others?", options: ["Biology", "Chemistry", "Theology", "Zoology"], answer: "Theology" },
    //   { prompt: "Which word does NOT belong with the others?", options: ["Area", "Variable", "Circumference", "Quadrilateral"], answer: "Variable" },
    // ],
  },

  // ---- SUBSEC004 — Rapid Assessment (SEC001) ---------------------------------
  SUBSEC004: {
    icon: BarChart3,
    layout: "single-page",
    subtitle: "Letter, Number & Pattern Comparison",
    difficulty: "Speed Test",
    totalQuestions: 55,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
    // groups: [
    //   {
    //     id: "find-larger",
    //     heading: "Find the Larger Number",
    //     type: "compare-larger",
    //     items: [
    //       { id: "q1", values: ["487", "385"], answer: "487" },
    //       { id: "q2", values: ["785", "723"], answer: "785" },
    //       { id: "q3", values: ["123", "234"], answer: "234" },
    //       { id: "q4", values: ["444", "333"], answer: "444" },
    //       { id: "q5", values: ["25", "30"], answer: "30" },
    //       { id: "q6", values: ["9990", "10000"], answer: "10000" },
    //       { id: "q7", values: ["678", "645"], answer: "678" },
    //       { id: "q8", values: ["821", "805"], answer: "821" },
    //       { id: "q9", values: ["212", "232"], answer: "232" },
    //       { id: "q10", values: ["5555", "5455"], answer: "5555" },
    //       { id: "q11", values: ["52", "54"], answer: "54" },
    //       { id: "q12", values: ["305", "304"], answer: "305" },
    //     ],
    //   },
    //   {
    //     id: "find-smaller",
    //     heading: "Find the Smaller Number",
    //     type: "compare-smaller",
    //     items: [
    //       { id: "q13", values: ["46665", "46668"], answer: "46665" },
    //       { id: "q14", values: ["69", "68"], answer: "68" },
    //       { id: "q15", values: ["70", "78"], answer: "70" },
    //       { id: "q16", values: ["101", "201"], answer: "101" },
    //       { id: "q17", values: ["342", "324"], answer: "324" },
    //       { id: "q18", values: ["231", "241"], answer: "231" },
    //       { id: "q19", values: ["467", "465"], answer: "465" },
    //       { id: "q20", values: ["530", "535"], answer: "530" },
    //       { id: "q21", values: ["9999", "9998"], answer: "9998" },
    //       { id: "q22", values: ["52", "55"], answer: "52" },
    //       { id: "q23", values: ["803", "805"], answer: "803" },
    //       { id: "q24", values: ["67", "68"], answer: "67" },
    //     ],
    //   },
    //   {
    //     id: "string-match",
    //     heading: "Find the Same Strings",
    //     type: "string-match",
    //     items: [
    //       { id: "q25", pair: ["58394172", "58394172"], answer: "Similar" },
    //       { id: "q26", pair: ["92048615", "92046815"], answer: "Different" },
    //       { id: "q27", pair: ["74185639", "74185639"], answer: "Similar" },
    //       { id: "q28", pair: ["36815294", "36815249"], answer: "Different" },
    //       { id: "q29", pair: ["# @ % & $", "# @ % & $"], answer: "Similar" },
    //       { id: "q30", pair: ["xyz@gmail.com", "xyw@gmail.com"], answer: "Different" },
    //       { id: "q31", pair: ["Rat, cat, mat, bat, at", "Rat, cat, mat, dat, at"], answer: "Different" },
    //       { id: "q32", pair: ["oo000ooo", "oo000ooo"], answer: "Similar" },
    //       { id: "q33", pair: ["pppqqqpp", "pppqqqpp"], answer: "Similar" },
    //       { id: "q34", pair: ["abc::def::ghi", "abc::bef::ghi"], answer: "Different" },
    //       { id: "q35", pair: ["100::25::4", "100::25::4"], answer: "Different" },
    //       { id: "q36", pair: ["log, blog, fog", "log, blog, fog"], answer: "Similar" },
    //       { id: "q37", pair: ["999666", "666999"], answer: "Different" },
    //       { id: "q38", pair: ["receive", "recieve"], answer: "Different" },
    //       { id: "q39", pair: ["mammoth", "mammoth"], answer: "Similar" },
    //       { id: "q40", pair: ["qualitative", "quantitative"], answer: "Different" },
    //     ],
    //   },
    //   {
    //     id: "odd-even",
    //     heading: "Identify Odd / Even Number",
    //     type: "parity",
    //     items: [
    //       { id: "q41", value: "1235436905", answer: "Odd" },
    //       { id: "q42", value: "5432958088", answer: "Even" },
    //       { id: "q43", value: "4390123901", answer: "Odd" },
    //       { id: "q44", value: "8943592345", answer: "Odd" },
    //       { id: "q45", value: "321349054366", answer: "Even" },
    //       { id: "q46", value: "432222222222", answer: "Even" },
    //       { id: "q47", value: "8034234321", answer: "Odd" },
    //       { id: "q48", value: "312420087", answer: "Odd" },
    //       { id: "q49", value: "53400002225", answer: "Odd" },
    //       { id: "q50", value: "2340994226", answer: "Even" },
    //       { id: "q51", value: "680774264869", answer: "Odd" },
    //       { id: "q52", value: "247656899998", answer: "Even" },
    //       { id: "q53", value: "679860860761", answer: "Odd" },
    //       { id: "q54", value: "47693", answer: "Odd" },
    //       { id: "q55", value: "809711", answer: "Odd" },
    //     ],
    //   },
    //   {
    //     id: "months-30-31",
    //     heading: "Select Months with 30 or 31 Days",
    //     type: "month-multiselect",
    //     months: ["January", "March", "April", "May", "June", "July", "August", "September", "October", "November"],
    //   },
    // ],
  },

  // ---- SUBSEC005 — Visual Reasoning (SEC001) ---------------------------------
  SUBSEC005: {
    icon: Boxes,
    layout: "single-page-image",
    subtitle: "Visual & Spatial Reasoning",
    difficulty: "Adaptive",
    totalQuestions: 15,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
    // questions: [
    //   { type: "spatial", prompt: "Choose the alternative which closely resembles the water-image of the given combination.", questionImage: "/images/spatial/q1.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Choose the alternative which closely resembles the water-image of the given combination.", questionImage: "/images/spatial/q2.png", options: ["1", "2", "3", "4"], answer: 0 },
    //   { type: "spatial", prompt: "Choose the alternative which closely resembles the mirror image of the given combination.", questionImage: "/images/spatial/q3.png", options: ["1", "2", "3", "4"], answer: 0 },
    //   { type: "spatial", prompt: "Choose the alternative which closely resembles the mirror image of the given combination.", questionImage: "/images/spatial/q4.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Find out from amongst the four alternatives as to how the pattern would appear when the transparent sheet is folded at the dotted line.", questionImage: "/images/spatial/q5.png", options: ["1", "2", "3", "4"], answer: 2 },
    //   { type: "spatial", prompt: "Find out from amongst the four alternatives as to how the pattern would appear when the transparent sheet is folded at the dotted line.", questionImage: "/images/spatial/q6.png", options: ["1", "2", "3", "4"], answer: 1 },
    //   { type: "spatial", prompt: "Find out from amongst the four alternatives as to how the pattern would appear when the transparent sheet is folded at the dotted line.", questionImage: "/images/spatial/q7.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Select a figure from the given four alternatives which fits exactly into Figure-X to form a complete square.", questionImage: "/images/spatial/q8.png", options: ["1", "2", "3", "4"], answer: 0 },
    //   { type: "spatial", prompt: "Select a figure from the given four alternatives which fits exactly into Figure-X to form a complete square.", questionImage: "/images/spatial/q9.png", options: ["1", "2", "3", "4"], answer: 2 },
    //   { type: "spatial", prompt: "Select a figure from the given four alternatives which fits exactly into Figure-X to form a complete square.", questionImage: "/images/spatial/q10.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Choose a figure which would most closely resemble the unfolded form of Figure (Z).", questionImage: "/images/spatial/q11.png", options: ["1", "2", "3", "4"], answer: 1 },
    //   { type: "spatial", prompt: "Choose a figure which would most closely resemble the unfolded form of Figure (Z).", questionImage: "/images/spatial/q12.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Choose a figure which would most closely resemble the unfolded form of Figure (Z).", questionImage: "/images/spatial/q13.png", options: ["1", "2", "3", "4"], answer: 1 },
    //   { type: "spatial", prompt: "Find out the figure which contains figure (X) as its part.", questionImage: "/images/spatial/q14.png", options: ["1", "2", "3", "4"], answer: 2 },
    //   { type: "spatial", prompt: "Find out the figure which contains figure (X) as its part.", questionImage: "/images/spatial/q15.png", options: ["1", "2", "3", "4"], answer: 3 },
    // ],
  },


  SUBSEC008: {
    icon: BrainCircuit,
    layout: "single-page-image",
    subtitle: "Pattern Recognition & Abstract Reasoning",
    difficulty: "Adaptive",
    totalQuestions: 35,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
    // questions: [
    //   { type: "spatial", prompt: "Choose the alternative which closely resembles the water-image of the given combination.", questionImage: "/images/spatial/q1.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Choose the alternative which closely resembles the water-image of the given combination.", questionImage: "/images/spatial/q2.png", options: ["1", "2", "3", "4"], answer: 0 },
    //   { type: "spatial", prompt: "Choose the alternative which closely resembles the mirror image of the given combination.", questionImage: "/images/spatial/q3.png", options: ["1", "2", "3", "4"], answer: 0 },
    //   { type: "spatial", prompt: "Choose the alternative which closely resembles the mirror image of the given combination.", questionImage: "/images/spatial/q4.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Find out from amongst the four alternatives as to how the pattern would appear when the transparent sheet is folded at the dotted line.", questionImage: "/images/spatial/q5.png", options: ["1", "2", "3", "4"], answer: 2 },
    //   { type: "spatial", prompt: "Find out from amongst the four alternatives as to how the pattern would appear when the transparent sheet is folded at the dotted line.", questionImage: "/images/spatial/q6.png", options: ["1", "2", "3", "4"], answer: 1 },
    //   { type: "spatial", prompt: "Find out from amongst the four alternatives as to how the pattern would appear when the transparent sheet is folded at the dotted line.", questionImage: "/images/spatial/q7.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Select a figure from the given four alternatives which fits exactly into Figure-X to form a complete square.", questionImage: "/images/spatial/q8.png", options: ["1", "2", "3", "4"], answer: 0 },
    //   { type: "spatial", prompt: "Select a figure from the given four alternatives which fits exactly into Figure-X to form a complete square.", questionImage: "/images/spatial/q9.png", options: ["1", "2", "3", "4"], answer: 2 },
    //   { type: "spatial", prompt: "Select a figure from the given four alternatives which fits exactly into Figure-X to form a complete square.", questionImage: "/images/spatial/q10.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Choose a figure which would most closely resemble the unfolded form of Figure (Z).", questionImage: "/images/spatial/q11.png", options: ["1", "2", "3", "4"], answer: 1 },
    //   { type: "spatial", prompt: "Choose a figure which would most closely resemble the unfolded form of Figure (Z).", questionImage: "/images/spatial/q12.png", options: ["1", "2", "3", "4"], answer: 3 },
    //   { type: "spatial", prompt: "Choose a figure which would most closely resemble the unfolded form of Figure (Z).", questionImage: "/images/spatial/q13.png", options: ["1", "2", "3", "4"], answer: 1 },
    //   { type: "spatial", prompt: "Find out the figure which contains figure (X) as its part.", questionImage: "/images/spatial/q14.png", options: ["1", "2", "3", "4"], answer: 2 },
    //   { type: "spatial", prompt: "Find out the figure which contains figure (X) as its part.", questionImage: "/images/spatial/q15.png", options: ["1", "2", "3", "4"], answer: 3 },
    // ],
  },

  // ---- SUBSEC006 — Career Interest (SEC002) ----------------------------------
  SUBSEC006: {
    icon: Compass,
    layout: "single-page-interest",
    subtitle: "Career Interest Areas",
    difficulty: "Self-paced",
    totalQuestions: 60,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
    // questions: interestQuestions([
    //   { category: "Engineering & Technology", prompt: "I enjoy understanding how machines or gadgets work." },
    //   { category: "Engineering & Technology", prompt: "I like repairing things." },
    //   { category: "Engineering & Technology", prompt: "I enjoy solving logical puzzles and math riddles." },
    //   { category: "Engineering & Technology", prompt: "I am curious about new inventions and technology." },
    //   { category: "Engineering & Technology", prompt: "I enjoy making 2D, 3D models & puzzles." },
    //   { category: "Engineering & Technology", prompt: "I enjoy finding ways to solve problems." },
    //   { category: "Engineering & Technology", prompt: "I am interested in learning about robots and automation." },
    //   { category: "Engineering & Technology", prompt: "I like understanding how vehicles work." },
    //   { category: "Engineering & Technology", prompt: "I like star gazing and learning about galaxies." },
    //   { category: "Engineering & Technology", prompt: "I like to learn about solar panels and windmills." },
    //   { category: "Medical & Health Sciences", prompt: "I enjoy learning about the human body." },
    //   { category: "Medical & Health Sciences", prompt: "I like helping people when they are unwell." },
    //   { category: "Medical & Health Sciences", prompt: "I am curious about how medicines work." },
    //   { category: "Medical & Health Sciences", prompt: "I enjoy observing plants, and living creatures." },
    //   { category: "Medical & Health Sciences", prompt: "I would like to learn about dental care." },
    //   { category: "Medical & Health Sciences", prompt: "I like understanding how diseases occur." },
    //   { category: "Medical & Health Sciences", prompt: "I am interested in how diet and exercise keep the human body healthy." },
    //   { category: "Medical & Health Sciences", prompt: "I enjoy taking care of animals." },
    //   { category: "Medical & Health Sciences", prompt: "I would enjoy working in a laboratory." },
    //   { category: "Medical & Health Sciences", prompt: "I am curious to learn about why people have different blood groups." },
    //   { category: "Creative Arts, Design & Media", prompt: "I like drawing or creating different artworks." },
    //   { category: "Creative Arts, Design & Media", prompt: "I notice colors, patterns, designs in spaces around me." },
    //   { category: "Creative Arts, Design & Media", prompt: "I enjoy writing." },
    //   { category: "Creative Arts, Design & Media", prompt: "I take a lot of photos with different angles and light." },
    //   { category: "Creative Arts, Design & Media", prompt: "I like to design clothes." },
    //   { category: "Creative Arts, Design & Media", prompt: "I enjoy decorating my room or arrange things in my home." },
    //   { category: "Creative Arts, Design & Media", prompt: "I like to create my own jewellery." },
    //   { category: "Creative Arts, Design & Media", prompt: "I enjoy creating videos for social platforms." },
    //   { category: "Creative Arts, Design & Media", prompt: "I like to compose new music." },
    //   { category: "Creative Arts, Design & Media", prompt: "I like creating animated characters and stories." },
    //   { category: "Business & Administration", prompt: "I like to volunteer in cultural functions in my school." },
    //   { category: "Business & Administration", prompt: "I enjoy saving money and planning how to spend it." },
    //   { category: "Business & Administration", prompt: "I enjoy convincing friends to support my idea." },
    //   { category: "Business & Administration", prompt: "I like reading stories about how people run businesses." },
    //   { category: "Business & Administration", prompt: "I like to be a class monitor/representative." },
    //   { category: "Business & Administration", prompt: "I like setting targets and completing them." },
    //   { category: "Business & Administration", prompt: "I like comparing different things before buying." },
    //   { category: "Business & Administration", prompt: "I enjoy looking at what are popular topics." },
    //   { category: "Business & Administration", prompt: "I would like to start my own business someday." },
    //   { category: "Business & Administration", prompt: "I enjoy making plans to learn something new." },
    //   { category: "Social Studies & Humanities", prompt: "I enjoy learning about history and different cultures." },
    //   { category: "Social Studies & Humanities", prompt: "I like discussing social issues." },
    //   { category: "Social Studies & Humanities", prompt: "I like to understand why people behave differently." },
    //   { category: "Social Studies & Humanities", prompt: "I am interested in current affairs and world events." },
    //   { category: "Social Studies & Humanities", prompt: "I enjoy helping solve community problems." },
    //   { category: "Social Studies & Humanities", prompt: "I would like to learn to play different instruments." },
    //   { category: "Social Studies & Humanities", prompt: "I enjoy reading about politics, and economics." },
    //   { category: "Social Studies & Humanities", prompt: "I am interested in understanding laws." },
    //   { category: "Social Studies & Humanities", prompt: "I like to participate in activities like singing." },
    //   { category: "Social Studies & Humanities", prompt: "I like participating in debates and discussions." },
    //   { category: "Hospitality & Service Industry", prompt: "I enjoy talking to new people." },
    //   { category: "Hospitality & Service Industry", prompt: "I like making guests feel comfortable." },
    //   { category: "Hospitality & Service Industry", prompt: "I enjoy planning events or celebrations." },
    //   { category: "Hospitality & Service Industry", prompt: "I like to plant flowers or vegetables in the garden." },
    //   { category: "Hospitality & Service Industry", prompt: "I enjoy preparing and serving food and drinks." },
    //   { category: "Hospitality & Service Industry", prompt: "I like helping customers solve their problems." },
    //   { category: "Hospitality & Service Industry", prompt: "I enjoy travelling and learning about new places." },
    //   { category: "Hospitality & Service Industry", prompt: "I can remain polite even when dealing with difficult people." },
    //   { category: "Hospitality & Service Industry", prompt: "I like giving surprises to others." },
    //   { category: "Hospitality & Service Industry", prompt: "I would enjoy learning how to fly an airplane." },
    // ]),
  },

  // ---- SUBSEC007 — Learning Orientation (SEC003) -----------------------------
  SUBSEC007: {
    icon: ListChecks,
    layout: "single-page-interest",
    subtitle: "How You Plan, Learn & Handle Exams",
    difficulty: "Self-paced",
    totalQuestions: 40,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
    // questions: studyHabitsQuestions([
    //   { category: "Study Planning & Time Management", prompt: "I follow a regular study timetable." },
    //   { category: "Study Planning & Time Management", prompt: "I complete my homework and assignments on time." },
    //   { category: "Study Planning & Time Management", prompt: "I divide large tasks into smaller, manageable steps." },
    //   { category: "Study Planning & Time Management", prompt: "I plan my studies well before examinations." },
    //   { category: "Study Planning & Time Management", prompt: "I set daily or weekly study goals for myself." },
    //   { category: "Study Planning & Time Management", prompt: "I avoid distractions such as mobile phones or television while studying." },
    //   { category: "Study Planning & Time Management", prompt: "I spend enough time revising each subject regularly." },
    //   { category: "Study Planning & Time Management", prompt: "I do important tasks before less important ones." },
    //   { category: "Study Planning & Time Management", prompt: "I maintain an organized study space with all the required materials." },
    //   { category: "Study Planning & Time Management", prompt: "I complete my planned study schedule without frequently delaying it." },
    //   { category: "Understanding vs. Memorization", prompt: "I try to understand concepts instead of memorizing them without meaning." },
    //   { category: "Understanding vs. Memorization", prompt: "I ask questions whenever I do not understand a topic." },
    //   { category: "Understanding vs. Memorization", prompt: "I connect new learning with things I already know." },
    //   { category: "Understanding vs. Memorization", prompt: "I revise topics regularly to remember them for a longer time." },
    //   { category: "Understanding vs. Memorization", prompt: "I make notes, summaries, or mind maps while studying." },
    //   { category: "Understanding vs. Memorization", prompt: "I can explain what I have learned in my own words." },
    //   { category: "Understanding vs. Memorization", prompt: "I solve practice questions after learning a new concept." },
    //   { category: "Understanding vs. Memorization", prompt: "I remember important formulas, definitions, or facts during tests." },
    //   { category: "Understanding vs. Memorization", prompt: "I review my mistakes and learn from them." },
    //   { category: "Understanding vs. Memorization", prompt: "I use different learning methods such as diagrams, videos, discussions, or examples to understand difficult topics." },
    //   { category: "Confidence & Resilience", prompt: "I believe I can improve my performance through regular practice and hard work." },
    //   { category: "Confidence & Resilience", prompt: "I stay motivated even when a subject feels difficult." },
    //   { category: "Confidence & Resilience", prompt: "I continue trying even after making mistakes." },
    //   { category: "Confidence & Resilience", prompt: "I remain positive when I receive lower marks than expected." },
    //   { category: "Confidence & Resilience", prompt: "I ask teachers or classmates for help when I need it." },
    //   { category: "Confidence & Resilience", prompt: "I enjoy learning new and challenging topics." },
    //   { category: "Confidence & Resilience", prompt: "I believe bad results or failure help me become a better learner." },
    //   { category: "Confidence & Resilience", prompt: "I stay focused on my goals even when others perform better." },
    //   { category: "Confidence & Resilience", prompt: "I feel confident while answering questions in class." },
    //   { category: "Confidence & Resilience", prompt: "I keep working until I complete a difficult task." },
    //   { category: "Exam Stress Control", prompt: "I remain calm while preparing for examinations." },
    //   { category: "Exam Stress Control", prompt: "I manage my time effectively during examinations." },
    //   { category: "Exam Stress Control", prompt: "I sleep well before an important examination." },
    //   { category: "Exam Stress Control", prompt: "I stay focused without panicking during tests." },
    //   { category: "Exam Stress Control", prompt: "I avoid last-minute cramming before examinations." },
    //   { category: "Exam Stress Control", prompt: "I use healthy ways to reduce stress, such as exercise, relaxation, or hobbies." },
    //   { category: "Exam Stress Control", prompt: "I recover quickly after performing poorly in an examination." },
    //   { category: "Exam Stress Control", prompt: "I remain confident even when examination questions seem difficult." },
    //   { category: "Exam Stress Control", prompt: "I avoid comparing my preparation with that of others during exams." },
    //   { category: "Exam Stress Control", prompt: "I believe I can perform well when I prepare consistently." },
    // ]),
  },
};

// ------------------------------------------------------------------
// Small formatting helpers shared by TestSelection / TestInstructions
// ------------------------------------------------------------------
export const formatMinutes = (minutes) => {
  const m = Number(minutes) || 0;
  return `${String(m).padStart(2, "0")}:00`;
};

// Backend `instructions` is one string, not an array. Split it into
// short bullet lines; falls back to null if there's nothing usable.
// (No longer used by useTestSubsections now that instructions are
// static-only, but kept in case something else still needs it.)
export const splitInstructions = (text) => {
  if (!text || typeof text !== "string") return null;
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
};