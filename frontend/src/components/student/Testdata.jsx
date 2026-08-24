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
  //10th
  SUBSEC001: "SEC001", // Quantitative Reasoning
  SUBSEC002: "SEC001", // Verbal Reasoning
  SUBSEC003: "SEC001", // Logical Reasoning
  SUBSEC004: "SEC001", // Rapid Assessment
  SUBSEC005: "SEC001", // Visual Reasoning
  SUBSEC008: "SEC001", // Mental Ability

  SUBSEC006: "SEC002", // Career Interest
  SUBSEC007: "SEC003", // Learning Orientation

  //9th
    SUBSEC009: "SEC001", // Quantitative Reasoning
  SUBSEC010: "SEC001", // Verbal Reasoning
  SUBSEC011: "SEC001", // Logical Reasoning
  SUBSEC012: "SEC001", // Rapid Assessment
  SUBSEC013: "SEC001", // Visual Reasoning
  SUBSEC014: "SEC001", // Mental Ability

  SUBSEC015: "SEC002", // Career Interest
  SUBSEC016: "SEC003", // Learning Orientation

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
  
  },

  // ---- SUBSEC004 — Rapid Assessment (SEC001) ---------------------------------
  SUBSEC004: {
    icon: BarChart3,
    layout: "single-page",
    subtitle: "Letter, Number & Pattern Comparison",
    difficulty: "Speed Test",
    totalQuestions: 65,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
   
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
   
  },

    // ---- SUBSEC009 — Quantitative Reasoning (SEC009) --------------------------
  SUBSEC009: {
    icon: Calculator,
    subtitle: "Arithmetic, Number Sequences & Mathematics",
    difficulty: "Adaptive",
    layout: "multi-question",
    totalQuestions: 15,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
   
  },

  // ---- SUBSEC010 — Verbal Reasoning (SEC010) ---------------------------------
  SUBSEC010: {
    icon: MessageSquare,
    subtitle: "Vocabulary, Analogies, Comprehension & Language Skills",
    difficulty: "Adaptive",
    layout: "multi-question",
    totalQuestions: 18,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
   
  },

  // ---- SUBSEC011 — Logical Reasoning (SEC011) --------------------------------
  SUBSEC011: {
    icon: Puzzle,
    subtitle: "Logical & Analytical Reasoning",
    difficulty: "Adaptive",
    layout: "multi-question",
    totalQuestions: 15,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
  
  },

  // ---- SUBSEC012 — Rapid Assessment (SEC012) ---------------------------------
  SUBSEC012: {
    icon: BarChart3,
    layout: "single-page",
    subtitle: "Letter, Number & Pattern Comparison",
    difficulty: "Speed Test",
    totalQuestions: 45,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
   
  },

  // ---- SUBSEC013 — Visual Reasoning (SEC013) ---------------------------------
  SUBSEC013: {
    icon: Boxes,
    layout: "single-page-image",
    subtitle: "Visual & Spatial Reasoning",
    difficulty: "Adaptive",
    totalQuestions: 10,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
  
  },


  SUBSEC014: {
    icon: BrainCircuit,
    layout: "single-page-image",
    subtitle: "Pattern Recognition & Abstract Reasoning",
    difficulty: "Adaptive",
    totalQuestions: 30,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
   
  },

  // ---- SUBSEC015 — Career Interest (SEC015) ----------------------------------
  SUBSEC015: {
    icon: Compass,
    layout: "single-page-interest",
    subtitle: "Career Interest Areas",
    difficulty: "Self-paced",
    totalQuestions: 50,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
   
  },

  // ---- SUBSEC016 — Learning Orientation (SEC016) -----------------------------
  SUBSEC016: {
    icon: ListChecks,
    layout: "single-page-interest",
    subtitle: "How You Plan, Learn & Handle Exams",
    difficulty: "Self-paced",
    totalQuestions: 42,
    instructions: [
      "Read each question carefully before selecting your answer.",
      "Work as quickly as possible while maintaining accuracy.",
      "If you are unsure of an answer, make your best choice and move on.",
    ],
   
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