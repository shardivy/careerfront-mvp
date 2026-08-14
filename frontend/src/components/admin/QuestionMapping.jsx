import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shuffle,
  Eye,
  EyeOff,
  Hash,
  Layers,
  ListTree,
  Save,
  Sparkles,
  GraduationCap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import AssignQuestion from "./modal/AssignQuestionModal";


// ---- Grade reference list ---------------------------------------------
// Assumption: numeric school grades 6-12. Swap for whatever grade taxonomy
// the real `grades` table uses (could be ids, could be "Junior"/"Senior"
// bands, etc.) — this is just the picker's option list.

const GRADE_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];
const ASSESSMENT_OPTIONS = [
  { id: "career", name: "Career Assessment" },
  { id: "aptitude", name: "Aptitude Assessment" },
];

// ---- Assessment Version -> Section -> Subsection hierarchy ---------------
// (Same ids as CreateQuestion.jsx so a question's subsection_id lines up.)
// Each version now also carries the grade it targets (assessment_versions.grade).

const ASSESSMENT_VERSIONS = [
  { id: "av-career-g10", assessmentId: "career", name: "Career Assessment – Grade 10 (V1.0)", grade: "10", totalQuestionsTarget: 80, totalMarksTarget: 80 },
  { id: "av-aptitude-junior", assessmentId: "aptitude", name: "Aptitude Assessment – Junior (V2.0)", grade: "8", totalQuestionsTarget: 40, totalMarksTarget: 40 },
];

const SECTIONS_BY_VERSION = {
  "av-career-g10": [
    { id: "sec-aptitude", name: "Aptitude" },
    { id: "sec-interest", name: "Interest" },
    { id: "sec-personality", name: "Personality" },
  ],
  "av-aptitude-junior": [{ id: "sec-aptitude-jr", name: "Aptitude" }],
};

const SUBSECTIONS_BY_SECTION = {
  "sec-aptitude": [
    { id: "sub-logical", code: "LR", name: "Logical Reasoning", dimension: "Logical Reasoning", questionLimit: 20 },
    { id: "sub-numerical", code: "NA", name: "Numerical Ability", dimension: "Numerical Ability", questionLimit: 20 },
    { id: "sub-verbal", code: "VA", name: "Verbal Ability", dimension: "Verbal Ability", questionLimit: 15 },
    { id: "sub-abstract", code: "AR", name: "Abstract Reasoning", dimension: "Abstract Reasoning", questionLimit: 15 },
    { id: "sub-spatial", code: "SR", name: "Spatial Reasoning", dimension: "Spatial Reasoning", questionLimit: 10 },
  ],
  "sec-interest": [{ id: "sub-riasec", code: "RI", name: "RIASEC", dimension: "Investigative", questionLimit: 20 }],
  "sec-personality": [{ id: "sub-ocean", code: "OC", name: "OCEAN Traits", dimension: "Conscientiousness", questionLimit: 15 }],
  "sec-aptitude-jr": [
    { id: "sub-logical-jr", code: "LR", name: "Logical Reasoning", dimension: "Logical Reasoning", questionLimit: 15 },
    { id: "sub-situational", code: "SJ", name: "Situational Judgement", dimension: "Situational Judgement", questionLimit: 10 },
  ],
};

// ---- Question Library pool, scoped per subsection (mock) ------------------
const QUESTION_POOL_BY_SUBSECTION = {
  "sub-logical": [
    { id: "LR-1108", prompt: "Complete the series: 2, 6, 12, 20, __", type: "SHORT_TEXT", difficulty: "HARD", grades: ["9", "10", "11"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "LR-0233", prompt: "If all Bloops are Razzles and all Razzles are Lazzles, are all Bloops Lazzles?", type: "TRUE_FALSE", difficulty: "EASY", grades: ["8", "9", "10"], defaultMarks: 1, defaultNegative: 0 },
    { id: "LR-0389", prompt: "Two statements are followed by two conclusions. Which conclusion logically follows?", type: "SHORT_TEXT", difficulty: "HARD", grades: ["10", "11", "12"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "LR-0466", prompt: "Identify the next number in the pattern: 5, 11, 23, 47, __", type: "SHORT_TEXT", difficulty: "HARD", grades: ["10", "11", "12"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "LR-0501", prompt: "All squares are rectangles. Some rectangles are not squares. Which conclusion is valid?", type: "TRUE_FALSE", difficulty: "MEDIUM", grades: ["9", "10"], defaultMarks: 1, defaultNegative: 0 },
  ],
  "sub-numerical": [
    { id: "NA-0421", prompt: "Solve for x: 2x\u00b2 + 5x \u2212 3 = 0", type: "INTEGER", difficulty: "MEDIUM", grades: ["9", "10", "11"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "NA-0912", prompt: "If 15 workers finish a task in 12 days, how many days for 20 workers?", type: "INTEGER", difficulty: "MEDIUM", grades: ["8", "9", "10"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "NA-0187", prompt: "A train 120m long crosses a pole in 8 seconds. Find its speed in km/h.", type: "INTEGER", difficulty: "HARD", grades: ["9", "10"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "NA-0640", prompt: "Simplify: (3/4) \u00f7 (9/16)", type: "SHORT_TEXT", difficulty: "EASY", grades: ["6", "7", "8"], defaultMarks: 1, defaultNegative: 0 },
    { id: "NA-0733", prompt: "A shopkeeper marks an item 40% above cost and sells at 10% discount. Find profit %.", type: "INTEGER", difficulty: "HARD", grades: ["10", "11", "12"], defaultMarks: 1, defaultNegative: 0.25 },
  ],
  "sub-verbal": [
    { id: "VA-2230", prompt: "Analyze the tone conveyed in the given passage.", type: "LONG_TEXT", difficulty: "HARD", grades: ["10", "11", "12"], defaultMarks: 2, defaultNegative: 0 },
    { id: "VA-0455", prompt: 'Choose the word most similar in meaning to "Ephemeral."', type: "SINGLE_CHOICE", difficulty: "MEDIUM", grades: ["9", "10", "11"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "VA-0522", prompt: "Fill in the blank with the most appropriate preposition.", type: "SINGLE_CHOICE", difficulty: "EASY", grades: ["6", "7", "8"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "VA-0617", prompt: "Identify the sentence with correct subject-verb agreement.", type: "SINGLE_CHOICE", difficulty: "EASY", grades: ["7", "8", "9"], defaultMarks: 1, defaultNegative: 0.25 },
  ],
  "sub-abstract": [
    { id: "AR-2044", prompt: "Identify the odd figure among the given set.", type: "IMAGE_SELECTION", difficulty: "EASY", grades: ["8", "9"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "AR-0781", prompt: "Identify the figure that completes the given sequence.", type: "IMAGE_SELECTION", difficulty: "HARD", grades: ["10", "11", "12"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "AR-0918", prompt: "Select the mirror image of the given figure.", type: "IMAGE_SELECTION", difficulty: "MEDIUM", grades: ["9", "10"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "AR-1022", prompt: "Determine the missing piece needed to complete the pattern grid.", type: "IMAGE_SELECTION", difficulty: "MEDIUM", grades: ["9", "10", "11"], defaultMarks: 1, defaultNegative: 0.25 },
  ],
  "sub-spatial": [
    { id: "SR-0201", prompt: "Rotate the given shape 90\u00b0 clockwise and select the correct match.", type: "IMAGE_SELECTION", difficulty: "HARD", grades: ["10", "11", "12"], defaultMarks: 1, defaultNegative: 0.25 },
    { id: "SR-0342", prompt: "Count the number of triangles in the given figure.", type: "INTEGER", difficulty: "MEDIUM", grades: ["8", "9", "10"], defaultMarks: 1, defaultNegative: 0 },
    { id: "SR-0455", prompt: "Identify how many cubes are used to build the given structure.", type: "INTEGER", difficulty: "HARD", grades: ["9", "10", "11"], defaultMarks: 1, defaultNegative: 0.25 },
  ],
  "sub-riasec": [
    { id: "RI-0101", prompt: "I enjoy investigating how things work and solving technical puzzles.", type: "LIKERT_5", difficulty: "EASY", grades: ["9", "10", "11", "12"], defaultMarks: 0, defaultNegative: 0 },
    { id: "RI-0102", prompt: "I like conducting experiments to test a hypothesis.", type: "LIKERT_5", difficulty: "EASY", grades: ["9", "10", "11", "12"], defaultMarks: 0, defaultNegative: 0 },
    { id: "RI-0103", prompt: "I prefer analyzing data over presenting it to a group.", type: "LIKERT_5", difficulty: "EASY", grades: ["9", "10", "11", "12"], defaultMarks: 0, defaultNegative: 0 },
  ],
  "sub-ocean": [
    { id: "OC-0201", prompt: "I stay organized and follow through on my commitments.", type: "LIKERT_5", difficulty: "EASY", grades: ["9", "10", "11", "12"], defaultMarks: 0, defaultNegative: 0 },
    { id: "OC-0202", prompt: "I remain calm even in high-pressure situations.", type: "LIKERT_5", difficulty: "EASY", grades: ["9", "10", "11", "12"], defaultMarks: 0, defaultNegative: 0 },
  ],
  "sub-logical-jr": [
    { id: "LRJ-0301", prompt: "Complete the series: 3, 6, 9, 12, __", type: "SHORT_TEXT", difficulty: "EASY", grades: ["6", "7", "8"], defaultMarks: 1, defaultNegative: 0 },
    { id: "LRJ-0302", prompt: "Which shape does not belong with the others?", type: "IMAGE_SELECTION", difficulty: "EASY", grades: ["6", "7", "8"], defaultMarks: 1, defaultNegative: 0 },
  ],
  "sub-situational": [
    { id: "SJ-0154", prompt: "A group member disagrees with the plan during a timed group task. Best response?", type: "SINGLE_CHOICE", difficulty: "MEDIUM", grades: ["7", "8", "9"], defaultMarks: 1, defaultNegative: 0 },
    { id: "SJ-0210", prompt: "You are given conflicting instructions by two supervisors. What's your first step?", type: "SINGLE_CHOICE", difficulty: "HARD", grades: ["8", "9"], defaultMarks: 1, defaultNegative: 0 },
    { id: "SJ-0312", prompt: "A client is unhappy about a delay outside your control. How do you respond?", type: "SINGLE_CHOICE", difficulty: "MEDIUM", grades: ["7", "8", "9"], defaultMarks: 1, defaultNegative: 0 },
  ],
};

const ALL_QUESTIONS_BY_ID = Object.values(QUESTION_POOL_BY_SUBSECTION)
  .flat()
  .reduce((acc, q) => ({ ...acc, [q.id]: q }), {});

// ---- Blueprint items (mock) ------------------------------------------------
let blueprintIdCounter = 500;
const nextBlueprintId = () => {
  blueprintIdCounter += 1;
  return `bp-${blueprintIdCounter}`;
};

const INITIAL_BLUEPRINT_ITEMS = [
  { id: "bp-1", assessmentVersionId: "av-career-g10", sectionId: "sec-aptitude", subsectionId: "sub-logical", questionId: "LR-1108", sequenceNo: 1, marksOverride: 1, negativeMarksOverride: 0.25, isMandatory: true, isRandomizable: false, isVisible: true, status: "ACTIVE" },
  { id: "bp-2", assessmentVersionId: "av-career-g10", sectionId: "sec-aptitude", subsectionId: "sub-logical", questionId: "LR-0233", sequenceNo: 2, marksOverride: 1, negativeMarksOverride: 0, isMandatory: true, isRandomizable: true, isVisible: true, status: "ACTIVE" },
  { id: "bp-3", assessmentVersionId: "av-career-g10", sectionId: "sec-aptitude", subsectionId: "sub-logical", questionId: "LR-0389", sequenceNo: 3, marksOverride: 2, negativeMarksOverride: 0.5, isMandatory: false, isRandomizable: true, isVisible: true, status: "ACTIVE" },
  { id: "bp-4", assessmentVersionId: "av-career-g10", sectionId: "sec-aptitude", subsectionId: "sub-numerical", questionId: "NA-0421", sequenceNo: 1, marksOverride: 1, negativeMarksOverride: 0.25, isMandatory: true, isRandomizable: false, isVisible: true, status: "ACTIVE" },
  { id: "bp-5", assessmentVersionId: "av-career-g10", sectionId: "sec-interest", subsectionId: "sub-riasec", questionId: "RI-0101", sequenceNo: 1, marksOverride: 0, negativeMarksOverride: 0, isMandatory: true, isRandomizable: false, isVisible: true, status: "ACTIVE" },
];

// ---- Small building blocks -------------------------------------------------

const DIFFICULTY_STYLES = {
  EASY: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HARD: "bg-red-50 text-red-700",
};

const TypeBadge = ({ type }) => (
  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
    {type.replace(/_/g, " ")}
  </span>
);

const DifficultyBadge = ({ difficulty }) => (
  <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", DIFFICULTY_STYLES[difficulty])}>
    {difficulty}
  </span>
);

// Shows the grade(s) a question is approved for (questions.grades). Renders
// nothing if the question has no grades tagged, rather than showing an
// empty pill.
const GradeBadge = ({ grades, highlightGrade }) => {
  if (!grades || grades.length === 0) return null;
  const isOffGrade = highlightGrade != null && !grades.includes(highlightGrade);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        isOffGrade ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
      )}
      title={isOffGrade ? "Not tagged for the current assessment version's grade" : undefined}
    >
      <GraduationCap className="h-3 w-3" />
      {grades.length === 1 ? `Grade ${grades[0]}` : `Grades ${grades.join(", ")}`}
    </span>
  );
};

const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition",
      checked ? "bg-slate-900" : "bg-slate-200"
    )}
  >
    <span
      className={cn(
        "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition",
        checked ? "translate-x-4.5" : "translate-x-1"
      )}
    />
  </button>
);

const InlineNumberInput = ({ value, onChange, min, max, step = 0.5, className }) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={(e) => onChange(Number(e.target.value))}
    className={cn(
      "h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-slate-900",
      "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
      className
    )}
  />
);

const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      {message}
    </div>
  );
};

const ActionConfirmDialog = ({ open, title, description, confirmLabel, onClose, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4" onClick={onClose} role="presentation">
      <div
        className={cn(adminTheme.card.base, "w-full max-w-sm p-5")}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="action-confirm-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id="action-confirm-title" className="text-base font-semibold text-slate-900">
              {title}
            </p>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={adminTheme.actionButton.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white",
              confirmLabel === "Publish" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Sidebar: Assessment Version summary + Section/Subsection tree --------

const StructureTree = ({ sections, subsectionsBySection, countsBySubsection, selectedSubsectionId, onSelectSubsection }) => (
  <div className={cn(adminTheme.card.base, "overflow-hidden")}>
    <div className="border-b border-slate-100 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        <ListTree className="h-3.5 w-3.5" />
        Assessment Structure
      </p>
    </div>
    <div className="max-h-[520px] overflow-y-auto p-2">
      {sections.map((section) => (
        <div key={section.id} className="mb-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Layers className="h-3.5 w-3.5" />
            {section.name}
          </div>
          {(subsectionsBySection[section.id] ?? []).map((sub) => {
            const count = countsBySubsection[sub.id] ?? 0;
            const isSelected = sub.id === selectedSubsectionId;
            const isOverLimit = count > sub.questionLimit;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubsection(sub.id, section.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                  isSelected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="truncate font-medium">{sub.name}</span>
                <span
                  className={cn(
                    "ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    isSelected
                      ? "bg-white/15 text-white"
                      : isOverLimit
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {count}/{sub.questionLimit}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  </div>
);

// ---- Main panel: mapped items list -----------------------------------------

const BlueprintItemRow = ({ item, question, versionGrade, index, total, onMoveUp, onMoveDown, onFieldChange, onToggleVisibility, onRemove }) => (
  <div className={cn(adminTheme.card.base, "p-4")}>
    <div className="flex items-start gap-3">
      <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
        <GripVertical className="h-4 w-4 text-slate-300" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
          {item.sequenceNo}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">{question?.id ?? item.questionId}</span>
          {question && <TypeBadge type={question.type} />}
          {question && <DifficultyBadge difficulty={question.difficulty} />}
          {question && <GradeBadge grades={question.grades} highlightGrade={versionGrade} />}
        </div>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900">
          {question?.prompt ?? "Question no longer in the library \u2014 remove or replace this mapping."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Marks
            <InlineNumberInput value={item.marksOverride} min={0} onChange={(v) => onFieldChange(item.id, "marksOverride", v)} />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Negative
            <InlineNumberInput value={item.negativeMarksOverride} min={0} onChange={(v) => onFieldChange(item.id, "negativeMarksOverride", v)} />
          </label>

          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Switch checked={item.isMandatory} onChange={(v) => onFieldChange(item.id, "isMandatory", v)} label="Mandatory" />
            Mandatory
          </label>
          {/* <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Switch checked={item.isRandomizable} onChange={(v) => onFieldChange(item.id, "isRandomizable", v)} label="Randomizable" />
            <Shuffle className="h-3.5 w-3.5" />
            Random
          </label> */}
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Switch checked={item.isVisible} onChange={(v) => onToggleVisibility(item.id, v)} label="Visible" />
            {item.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Visible
          </label>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => onMoveUp(item.id)}
          disabled={index === 0}
          className={cn(
            "rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900",
            index === 0 && "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-slate-400"
          )}
          aria-label="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(item.id)}
          disabled={index === total - 1}
          className={cn(
            "rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900",
            index === total - 1 && "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-slate-400"
          )}
          aria-label="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="mt-1 rounded-md p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
          aria-label="Remove from blueprint"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

// ---- Page -------------------------------------------------------------

const QuestionMapping = () => {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(ASSESSMENT_VERSIONS[0].assessmentId);
  const [selectedVersionId, setSelectedVersionId] = useState(ASSESSMENT_VERSIONS[0].id);
  const [selectedSectionId, setSelectedSectionId] = useState(SECTIONS_BY_VERSION[ASSESSMENT_VERSIONS[0].id][0].id);
  const [selectedSubsectionId, setSelectedSubsectionId] = useState(
    SUBSECTIONS_BY_SECTION[SECTIONS_BY_VERSION[ASSESSMENT_VERSIONS[0].id][0].id][0].id
  );
  const [blueprintItems, setBlueprintItems] = useState(INITIAL_BLUEPRINT_ITEMS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingVisibilityChange, setPendingVisibilityChange] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const selectedVersion = ASSESSMENT_VERSIONS.find((v) => v.id === selectedVersionId);
  const versionOptionsForAssessment = ASSESSMENT_VERSIONS.filter((version) => version.assessmentId === selectedAssessmentId);
  const sections = SECTIONS_BY_VERSION[selectedVersionId] ?? [];
  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedSubsection = (SUBSECTIONS_BY_SECTION[selectedSectionId] ?? []).find((s) => s.id === selectedSubsectionId);

  // All blueprint items for the version currently being edited.
  const versionItems = useMemo(
    () => blueprintItems.filter((item) => item.assessmentVersionId === selectedVersionId),
    [blueprintItems, selectedVersionId]
  );

  // Items for just the selected subsection, in sequence order.
  const subsectionItems = useMemo(
    () =>
      versionItems
        .filter((item) => item.subsectionId === selectedSubsectionId)
        .sort((a, b) => a.sequenceNo - b.sequenceNo),
    [versionItems, selectedSubsectionId]
  );

  // Question count per subsection, for the structure tree badges.
  const countsBySubsection = useMemo(() => {
    const counts = {};
    versionItems.forEach((item) => {
      counts[item.subsectionId] = (counts[item.subsectionId] ?? 0) + 1;
    });
    return counts;
  }, [versionItems]);

  const mappedMarksTotal = useMemo(
    () => versionItems.reduce((sum, item) => sum + Number(item.marksOverride || 0), 0),
    [versionItems]
  );


  const mappedQuestionIdsInVersion = useMemo(() => new Set(versionItems.map((item) => item.questionId)), [versionItems]);

  const availableQuestionsForSubsection = useMemo(() => {
    const pool = QUESTION_POOL_BY_SUBSECTION[selectedSubsectionId] ?? [];
    return pool.filter((q) => !mappedQuestionIdsInVersion.has(q.id));
  }, [selectedSubsectionId, mappedQuestionIdsInVersion]);

  const handleSelectAssessment = (assessmentId) => {
    setSelectedAssessmentId(assessmentId);
    const nextVersion = ASSESSMENT_VERSIONS.find((version) => version.assessmentId === assessmentId);
    if (!nextVersion) return;

    setSelectedVersionId(nextVersion.id);
    const firstSection = SECTIONS_BY_VERSION[nextVersion.id][0];
    setSelectedSectionId(firstSection.id);
    setSelectedSubsectionId(SUBSECTIONS_BY_SECTION[firstSection.id][0].id);
  };

  const handleSelectVersion = (versionId) => {
    setSelectedVersionId(versionId);
    const version = ASSESSMENT_VERSIONS.find((item) => item.id === versionId);
    if (version) setSelectedAssessmentId(version.assessmentId);
    const firstSection = SECTIONS_BY_VERSION[versionId][0];
    setSelectedSectionId(firstSection.id);
    setSelectedSubsectionId(SUBSECTIONS_BY_SECTION[firstSection.id][0].id);
  };

  const handleSelectSubsection = (subsectionId, sectionId) => {
    setSelectedSubsectionId(subsectionId);
    setSelectedSectionId(sectionId);
  };

  const handleAddQuestions = (questionIds) => {
    const startingSequence = subsectionItems.length;
    const newItems = questionIds.map((questionId, index) => {
      const question = ALL_QUESTIONS_BY_ID[questionId];
      return {
        id: nextBlueprintId(),
        assessmentVersionId: selectedVersionId,
        sectionId: selectedSectionId,
        subsectionId: selectedSubsectionId,
        questionId,
        sequenceNo: startingSequence + index + 1,
        marksOverride: question?.defaultMarks ?? 1,
        negativeMarksOverride: question?.defaultNegative ?? 0,
        isMandatory: true,
        isRandomizable: false,
        isVisible: true,
        status: "ACTIVE",
      };
    });
    setBlueprintItems((prev) => [...prev, ...newItems]);
    setIsAddModalOpen(false);
    showToast(`Added ${newItems.length} question${newItems.length > 1 ? "s" : ""} to ${selectedSubsection?.name}`);
  };

  const handleRemoveItem = (itemId) => {
    setPendingDeleteId(itemId);
  };

  const confirmRemoveItem = () => {
    if (!pendingDeleteId) return;

    setBlueprintItems((prev) => {
      const removed = prev.find((item) => item.id === pendingDeleteId);
      if (!removed) return prev;
      return prev
        .filter((item) => item.id !== pendingDeleteId)
        .map((item) =>
          item.subsectionId === removed.subsectionId && item.sequenceNo > removed.sequenceNo
            ? { ...item, sequenceNo: item.sequenceNo - 1 }
            : item
        );
    });
    showToast("Question removed from subsection.");
    setPendingDeleteId(null);
  };

  const handleFieldChange = (itemId, field, value) => {
    setBlueprintItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  };

  const openVisibilityConfirm = (itemId, nextValue) => {
    setPendingVisibilityChange({ itemId, nextValue });
  };

  const confirmVisibilityChange = () => {
    if (!pendingVisibilityChange) return;

    handleFieldChange(pendingVisibilityChange.itemId, "isVisible", pendingVisibilityChange.nextValue);
    showToast(
      pendingVisibilityChange.nextValue ? "Question made visible." : "Question hidden from candidates."
    );
    setPendingVisibilityChange(null);
  };

  const swapSequence = (itemId, direction) => {
    setBlueprintItems((prev) => {
      const list = prev.filter((item) => item.subsectionId === selectedSubsectionId).sort((a, b) => a.sequenceNo - b.sequenceNo);
      const index = list.findIndex((item) => item.id === itemId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return prev;

      const current = list[index];
      const swapWith = list[swapIndex];

      return prev.map((item) => {
        if (item.id === current.id) return { ...item, sequenceNo: swapWith.sequenceNo };
        if (item.id === swapWith.id) return { ...item, sequenceNo: current.sequenceNo };
        return item;
      });
    });
  };

  const validateBeforePublish = () => {
  const errors = [];

  sections.forEach((section) => {
    const subsections = SUBSECTIONS_BY_SECTION[section.id] || [];

    subsections.forEach((subsection) => {
      const mappedCount = blueprintItems.filter(
        (item) =>
          item.assessmentVersionId === selectedVersionId &&
          item.subsectionId === subsection.id
      ).length;

      if (mappedCount === 0) {
        errors.push(`${subsection.name} has no questions.`);
      }

      if (mappedCount < subsection.questionLimit) {
        errors.push(
          `${subsection.name}: ${mappedCount}/${subsection.questionLimit} questions assigned.`
        );
      }
    });
  });

  return errors;
};

const openActionConfirm = (action) => {
  setPendingAction(action);
};

const handleDraftSave = () => {
  console.log("Saving draft...");
  showToast("Draft saved successfully.");
  setPendingAction(null);
};

const handlePublish = () => {
  const errors = validateBeforePublish();

  if (errors.length > 0) {
    showToast("Please complete all subsection mappings before publishing.");
    console.log(errors);
    setPendingAction(null);
    return;
  }

  console.log("Publishing assessment...");
  showToast("Assessment published successfully.");
  setPendingAction(null);
};

const canPublish = validateBeforePublish().length === 0;

  return (
    <div className={cn("min-h-screen", adminTheme.surface.page)}>
      {/* Top bar */}
      <div className={cn("border-b bg-white", adminTheme.border.default)}>
        <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-4 lg:px-6">
          {/* Row 1: title on the left, Save Draft / Publish on the right */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <Sparkles className="h-5 w-5 text-slate-400" />
                Question Mapping
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Map Question Library items into an assessment version's sections and subsections, in the order candidates will see them.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => openActionConfirm("draft")} className={adminTheme.actionButton.secondary}>
                <Save className="h-4 w-4" />
                Save Draft
              </button>

              <button
                type="button"
                disabled={!canPublish}
                onClick={() => openActionConfirm("publish")}
                className={cn(
                  adminTheme.actionButton.primary,
                  !canPublish && "opacity-50 cursor-not-allowed"
                )}
              >
                Publish
              </button>
            </div>
          </div>

          {/* Row 2: assessment + version selectors */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Assessment</label>
              <select
                value={selectedAssessmentId}
                onChange={(e) => handleSelectAssessment(e.target.value)}
                className={cn(
                  "h-11 min-w-[220px] text-sm font-semibold",
                  adminTheme.radius.md,
                  adminTheme.border.default,
                  "border bg-white px-3 text-slate-900",
                  "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                )}
              >
                {ASSESSMENT_OPTIONS.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {assessment.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Assessment Version</label>
              <select
                value={selectedVersionId}
                onChange={(e) => handleSelectVersion(e.target.value)}
                className={cn(
                  "h-11 min-w-[320px] text-sm font-semibold",
                  adminTheme.radius.md,
                  adminTheme.border.default,
                  "border bg-white px-3 text-slate-900",
                  "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                )}
              >
                {versionOptionsForAssessment.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-3 py-6 sm:px-4 lg:px-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left: version summary + structure tree */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:col-span-1 lg:self-start">
            <StructureTree
              sections={sections}
              subsectionsBySection={SUBSECTIONS_BY_SECTION}
              countsBySubsection={countsBySubsection}
              selectedSubsectionId={selectedSubsectionId}
              onSelectSubsection={handleSelectSubsection}
            />
          </div>

          {/* Main: selected subsection's mapped questions */}
          <div className="space-y-4 lg:col-span-3">
            <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {selectedSection?.name}
                    <ChevronRight className="h-3.5 w-3.5" />
                    {selectedSubsection?.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{selectedSubsection?.name}</h2>
                    <span className={cn(adminTheme.badge.neutral, "uppercase")}>Dimension: {selectedSubsection?.dimension}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setIsAddModalOpen(true)} className={adminTheme.actionButton.primary}>
                  <Plus className="h-4 w-4" />
                  Assign Questions
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <Hash className="mr-1 inline h-3 w-3" />
                  {subsectionItems.length} of {selectedSubsection?.questionLimit} questions mapped for this subsection
                  (subsections.question_limit).
                </span>
              </div>
            </div>

            {subsectionItems.length === 0 ? (
              <div className={cn(adminTheme.card.base, adminTheme.card.padding, "flex flex-col items-center justify-center gap-3 py-14 text-center")}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <ListTree className="h-6 w-6 text-slate-400" />
                </span>
                <p className="text-sm font-semibold text-slate-900">No questions mapped yet</p>
                <p className="max-w-sm text-sm text-slate-400">
                  Assign questions from the library into {selectedSubsection?.name} to build out this part of the assessment.
                </p>
                <button type="button" onClick={() => setIsAddModalOpen(true)} className={cn(adminTheme.actionButton.primary, "mt-2")}>
                  <Plus className="h-4 w-4" />
                  Assign Questions
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {subsectionItems.map((item, index) => (
                  <BlueprintItemRow
                    key={item.id}
                    item={item}
                    question={ALL_QUESTIONS_BY_ID[item.questionId]}
                    versionGrade={selectedVersion?.grade}
                    index={index}
                    total={subsectionItems.length}
                    onMoveUp={() => swapSequence(item.id, "up")}
                    onMoveDown={() => swapSequence(item.id, "down")}
                    onFieldChange={handleFieldChange}
                    onToggleVisibility={openVisibilityConfirm}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <AssignQuestion
        open={isAddModalOpen}
        subsection={selectedSubsection}
        versionGrade={selectedVersion?.grade}
        availableQuestions={availableQuestionsForSubsection}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddQuestions}
      />

      <ActionConfirmDialog
        open={pendingAction !== null || pendingVisibilityChange !== null || pendingDeleteId !== null}
        title={
          pendingDeleteId
            ? "Are you sure you want to remove this question?"
            : pendingVisibilityChange
              ? pendingVisibilityChange.nextValue
                ? "Make question visible?"
                : "Hide question?"
              : pendingAction === "publish"
                ? "Publish assessment?"
                : "Save draft?"
        }
        description={
          pendingDeleteId
            ? "This will remove the selected question from this subsection."
            : pendingVisibilityChange
              ? pendingVisibilityChange.nextValue
                ? "This will make the question visible to candidates in the selected assessment flow."
                : "This will hide the question from candidates in the selected assessment flow."
              : pendingAction === "publish"
                ? "This will publish the current mapping configuration for the selected assessment version."
                : "This will save the current question mapping as a draft for later review."
        }
        confirmLabel={
          pendingDeleteId
            ? "Remove"
            : pendingVisibilityChange
              ? pendingVisibilityChange.nextValue
                ? "Make Visible"
                : "Hide"
              : pendingAction === "publish"
                ? "Publish"
                : "Save Draft"
        }
        onClose={() => {
          setPendingAction(null);
          setPendingVisibilityChange(null);
          setPendingDeleteId(null);
        }}
        onConfirm={() => {
          if (pendingDeleteId) {
            confirmRemoveItem();
            return;
          }

          if (pendingVisibilityChange) {
            confirmVisibilityChange();
            return;
          }

          if (pendingAction === "publish") handlePublish();
          else handleDraftSave();
        }}
      />

      <Toast message={toast} />
    </div>
  );
};

export default QuestionMapping;