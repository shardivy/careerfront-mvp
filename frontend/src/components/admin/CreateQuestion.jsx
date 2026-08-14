import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Rocket,
    Plus,
    Minus,
    X,
    Bold,
    Italic,
    Underline,
    ListOrdered,
    List as ListIcon,
    ListChecks,
    CheckSquare,
    ToggleLeft,
    HelpCircle,
    SlidersHorizontal,
    BarChart3,
    Hash,
    Divide,
    FileText,
    GitCompare,
    Grid3x3,
    ArrowLeftRight,
    Image as ImageIcon,
    Sigma,
    UploadCloud,
    Loader2,
    Info,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    GripVertical,
    Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubsections } from "../../slices/subsectionSlice";
import {
    generateQuestionCode,
    resetQuestionCode,
    createQuestion,
    getQuestionById,
    resetSelectedQuestion,
    updateQuestion,
} from "../../slices/questionSlice";
import { fetchGrades } from "../../slices/gradeSlice";

import SetupContent from "./createquestion/Setupcontent";
import Configuration from "./createquestion/Configuration";
import ScoringWeightage from "./createquestion/ScoringWeightage";
import Review from "./createquestion/Review";

// ============================================================================
// SHARED CONSTANTS, HELPERS & UI ATOMS
// Everything in this section is exported so the four step files can import
// what they need. The page component (CreateQuestion) lives at the bottom.
// ============================================================================

// ---- Step config ------------------------------------------------------

export const STEPS = [
    { id: 1, label: "Setup & Content" },
    { id: 2, label: "Configuration" },
    { id: 3, label: "Scoring & Weightage" },
    { id: 4, label: "Review" },
];

// ---- Subsection list ------------------------------------------------------

// Sample prompts keyed by official subsection code returned from the API
export const SAMPLE_BY_SUBSECTION_CODE = {
    LR: { prompt: "<p>Complete the series: 2, 6, 12, 20, 30, __</p>" },
    NA: { prompt: "<p>If 15 workers finish a task in 12 days, how many days will 20 workers take?</p>" },
    VA: { prompt: "<p>Choose the word most similar in meaning to <em>&ldquo;Ephemeral.&rdquo;</em></p>" },
    AR: { prompt: "<p>Identify the figure that completes the given sequence.</p>" },
    SR: { prompt: "<p>Which 3D shape is formed when this net is folded?</p>" },
    RI: { prompt: "<p>I enjoy investigating how things work and solving technical puzzles.</p>" },
    OC: { prompt: "<p>I stay organized and follow through on my commitments.</p>" },
    SJ: { prompt: "<p>You notice a teammate copying answers during a mock test. What do you do?</p>" },
};

// NOTE: There is intentionally no static `GRADES` list anymore. Grade
// Level(s) is populated entirely from the `grades` API (see `fetchGrades`,
// `state.grade`, and `availableGrades` inside `CreateQuestion` below).

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
export const DIFFICULTY_LABEL = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export const LANGUAGES = ["English", "Hindi", "Marathi", "Tamil", "Telugu"];

// ---- Question type enum (mirrors `questions.question_type`) --------------

export const QUESTION_TYPES = [
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "YES_NO",
    "LIKERT_3",
    "LIKERT_4",
    "LIKERT_5",
    "INTEGER",
    "DECIMAL",
    "SHORT_TEXT",
    "LONG_TEXT",
    "IMAGE_SELECTION",
    "RANK_ORDER",
    "MATCH_THE_FOLLOWING",
    "MATRIX",
    "SLIDER",
];

export const QUESTION_TYPE_META = {
    SINGLE_CHOICE: { icon: ListChecks, label: "Single Choice" },
    MULTIPLE_CHOICE: { icon: CheckSquare, label: "Multi Choice" },
    TRUE_FALSE: { icon: ToggleLeft, label: "True/False" },
    YES_NO: { icon: HelpCircle, label: "Yes/No" },
    LIKERT_3: { icon: SlidersHorizontal, label: "Likert-3" },
    LIKERT_4: { icon: SlidersHorizontal, label: "Likert-4" },
    LIKERT_5: { icon: SlidersHorizontal, label: "Likert-5" },
    INTEGER: { icon: Hash, label: "Integer" },
    DECIMAL: { icon: Divide, label: "Decimal" },
    SHORT_TEXT: { icon: Type, label: "Short Text" },
    LONG_TEXT: { icon: FileText, label: "Long Text" },
    IMAGE_SELECTION: { icon: ImageIcon, label: "Image Select" },
    RANK_ORDER: { icon: ListOrdered, label: "Rank Order" },
    MATCH_THE_FOLLOWING: { icon: GitCompare, label: "Matching" },
    MATRIX: { icon: Grid3x3, label: "Matrix" },
    SLIDER: { icon: ArrowLeftRight, label: "Slider" },
};

// Types whose answer key is stored via question_options (is_correct).
export const OPTION_BASED_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "IMAGE_SELECTION"];

export const DIFFICULTY_META = {
    EASY: { badge: "bg-emerald-50 text-emerald-700", ring: "border-emerald-400 bg-emerald-50 text-emerald-700", time: 20 },
    MEDIUM: { badge: "bg-amber-50 text-amber-700", ring: "border-amber-400 bg-amber-50 text-amber-700", time: 45 },
    HARD: { badge: "bg-red-50 text-red-700", ring: "border-red-400 bg-red-50 text-red-700", time: 90 },
};

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const MATH_SYMBOLS = ["\u00d7", "\u00f7", "\u00b1", "\u221a", "\u03c0", "\u2264", "\u2265", "\u2260"];
export const LIKERT_5_LABELS = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
export const LIKERT_4_LABELS = ["Never","Sometimes","Often","Always ",];
export const LIKERT_3_LABELS = ["Dislike","Neutral","Like",];

export const DEFAULT_SCORING_BY_QUESTION_TYPE = {
    SINGLE_CHOICE: { points: 1, negativeMarks: 0},
    MULTIPLE_CHOICE: { points: 1, negativeMarks: 0},
    IMAGE_SELECTION: { points: 1, negativeMarks: 0},
    TRUE_FALSE: { points: 1, negativeMarks: 0 },
    YES_NO: { points: 1, negativeMarks: 0 },
    LIKERT_5: { points: 0, negativeMarks: 0 },
    LIKERT_4: { points: 0, negativeMarks: 0 },
    LIKERT_3: { points: 0, negativeMarks: 0 },
    INTEGER: { points: 1, negativeMarks: 0 },
    DECIMAL: { points: 1, negativeMarks: 0 },
    SHORT_TEXT: { points: 1, negativeMarks: 0 },
    LONG_TEXT: { points: 2, negativeMarks: 0 },
    RANK_ORDER: { points: 1, negativeMarks: 0 },
    MATCH_THE_FOLLOWING: { points: 1, negativeMarks: 0 },
    MATRIX: { points: 1, negativeMarks: 0 },
    SLIDER: { points: 0, negativeMarks: 0 },
};

export const getDefaultScoringForQuestionType = (questionType) => {
    return DEFAULT_SCORING_BY_QUESTION_TYPE[questionType] ?? { points: 1, negativeMarks: 0 };
};

export const buildInitialForm = () => ({
    // Setup & Content — maps to questions.subsection_id + question_grade_mapping
    // `subsectionId` is left null so we can initialize it from the API when available.
    subsectionId: null,
    // `gradeIds` starts empty (no static grade list to seed a default from
    // anymore) — a default grade is selected once the `grades` API responds,
    // see the effect in `CreateQuestion`.
    gradeIds: [],
    difficulty: "MEDIUM",
    language: "English",
    isMandatory: true,
    expectedTimeSeconds: DIFFICULTY_META.MEDIUM.time,
    prompt: "",
    supportingImage: null,
    supportingMedia: null,
    supportingMediaUrl: "",
    questionType: "",
    points: 0,
    negativeMarks: 0,
    shuffleOptions: true,
      fixedOptionIds: [],

    options: [
        { id: "opt-1", text: "", value: "", image: null, isCorrect: false },
        { id: "opt-2", text: "", value: "", image: null, isCorrect: false },
    ],

    // fixed two-option types
    trueFalseAnswer: "True",
    yesNoAnswer: "Yes",

    // scale types (self-report — no correctness, so no answer key)
    likertLowLabel: "Strongly Disagree",
    likertHighLabel: "Strongly Agree",
    likertReverseScored: false,

    // text / numeric types — see schema-gap note in file header
    expectedAnswer: "",
    acceptableRange: 0,
    rubric: "",

    // rank order
    rankItems: ["Item 1", "Item 2", "Item 3"],

    // match the following
    matchPairs: [
        { id: "pair-1", left: "", right: "" },
        { id: "pair-2", left: "", right: "" },
    ],

    // matrix
    matrixRows: ["Row 1", "Row 2"],
    matrixCols: ["Column 1", "Column 2", "Column 3"],

    // slider
    sliderMin: 0,
    sliderMax: 10,
    sliderStep: 1,
    sliderDefault: 5,
});

// ---- Publish payload builders ---------------------------------------------
// Single source of truth for turning wizard state into the create-question
// API payload. Field names below are best-effort guesses based on the
// schema notes in the file header — confirm the exact contract with
// backend and adjust here; every other part of the file is unaffected.
export const isPersistedOptionId = (id) => id != null && /^\d+$/.test(String(id));

export const buildQuestionOptionsPayload = (form) => {
   const buildOption = (text, index, isCorrect = false, image = null, id = null) => ({
        ...(isPersistedOptionId(id) ? { id: Number(id) } : {}),
        option_code: OPTION_LETTERS[index] ?? String(index + 1),
        option_text: text,
        display_order: index + 1,
        option_image: image || null,
        is_correct: isCorrect,
    });

   if (OPTION_BASED_TYPES.includes(form.questionType)) {
        return form.options.map((opt, index) =>
            buildOption(opt.text, index, opt.isCorrect, opt.image, opt.id)
        );
    }

    if (form.questionType === "TRUE_FALSE") {
        return ["True", "False"].map((val, index) =>
            buildOption(val, index, form.trueFalseAnswer === val, null, form.fixedOptionIds[index])
        );
    }

    if (form.questionType === "YES_NO") {
        return ["Yes", "No"].map((val, index) =>
            buildOption(val, index, form.yesNoAnswer === val, null, form.fixedOptionIds[index])
        );
    }

    if (form.questionType === "LIKERT_5" || form.questionType === "LIKERT_4" || form.questionType === "LIKERT_3") {
        const labels = form.questionType === "LIKERT_4" ? LIKERT_4_LABELS : form.questionType === "LIKERT_3" ? LIKERT_3_LABELS : LIKERT_5_LABELS;
        return labels.map((label, index) => ({
            ...buildOption(label, index, false, null, form.fixedOptionIds[index]),
            option_value: String(index + 1),
        }));
    }

    return [];
};

export const resolveMediaType = (form) => {
    if (form.supportingImage) return "IMAGE";
    if (form.supportingMedia || form.supportingMediaUrl) return "VIDEO";
    return "NONE";
};

// Only one of supportingImage / supportingMedia / supportingMediaUrl 
export const resolveMediaFile = (form) => {
    if (form.supportingImage) return form.supportingImage;
    if (form.supportingMedia && !form.supportingMediaUrl) return form.supportingMedia;
    return null;
};

export const resolveMediaUrl = (form) => {
    // Do not send whitespace or an old file name as a URL.  A pasted link is
    // the only value that belongs in media_url.
    if (typeof form.supportingMediaUrl === "string" && form.supportingMediaUrl.trim()) {
        return form.supportingMediaUrl.trim();
    }
    return null;
};

export const buildQuestionPayload = (form, questionCode, isDraft = false) => {
    const mediaType = resolveMediaType(form);
    const base = {
        question_code: questionCode,
        is_draft: isDraft,
        subsection: form.subsectionId,
        grade_ids: form.gradeIds,
          question_type: form.questionType || null,
        question_text: form.prompt,
       media_type: mediaType,
media_file: resolveMediaFile(form),
media_url: resolveMediaUrl(form),
        difficulty_level: form.difficulty,
        language: form.language,
        // is_mandatory: form.isMandatory,
        expected_time_seconds: form.expectedTimeSeconds,
        points: form.points,
        negative_marks: form.negativeMarks,
        shuffle_options: form.shuffleOptions,
        options: buildQuestionOptionsPayload(form),
    };

    // Type-specific extras that don't map to question_options.
    // Flagged in this file's header as schema gaps — confirm storage
    // with backend before relying on these keys.
    if (["SHORT_TEXT", "INTEGER", "DECIMAL"].includes(form.questionType)) {
        base.expected_answer = form.expectedAnswer;
        if (form.questionType !== "SHORT_TEXT") {
            base.acceptable_range = Number(form.acceptableRange) || 0;
        }
    }

    if (form.questionType === "LONG_TEXT") {
        base.rubric = form.rubric;
    }

    if (form.questionType === "RANK_ORDER") {
        base.rank_items = form.rankItems;
    }

    if (form.questionType === "MATCH_THE_FOLLOWING") {
        base.match_pairs = form.matchPairs.map(({ left, right }) => ({ left, right }));
    }

    if (form.questionType === "MATRIX") {
        base.matrix_rows = form.matrixRows;
        base.matrix_cols = form.matrixCols;
    }

    if (form.questionType === "SLIDER") {
        base.slider_min = form.sliderMin;
        base.slider_max = form.sliderMax;
        base.slider_step = form.sliderStep;
        base.slider_default = form.sliderDefault;
    }

    return base;
};

// ---- Client-side validation ------------------------------------------------

export const getStep1ValidationError = (form) => {
    if (!form.subsectionId) {
        return "Please select a Subsection before continuing.";
    }
    if (!form.gradeIds || form.gradeIds.length === 0) {
        return "Please select at least one Grade Level before continuing.";
    }
    if (!form.questionType) {
        return "Please select a Question Type before continuing.";
    }
    return null;
};

// ---- Edit-mode: map a fetched question back into wizard form state -------

export const mapQuestionOptionsToForm = (questionType, options = []) => {
    const opts = Array.isArray(options) ? options : [];
    if (!OPTION_BASED_TYPES.includes(questionType) || opts.length === 0) return null;

    return opts
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((opt, index) => ({
            id: opt.id != null ? String(opt.id) : `opt-${index}`,
            text: opt.option_text ?? opt.text ?? "",
            value: opt.option_value ?? opt.value ?? "",
            image: opt.option_image ?? opt.option_url ?? opt.image_url ?? opt.image ?? null,
            isCorrect: Boolean(opt.is_correct ?? opt.isCorrect),
        }));
};

// Extracts persisted option ids, in display_order, for the "fixed shape"
// types (TRUE_FALSE, YES_NO, LIKERT_5/7) where the form doesn't otherwise
// keep an options array. Needed so buildQuestionOptionsPayload can send
// `id` back on update instead of letting the backend guess/duplicate rows.
export const extractFixedOptionIds = (options = []) =>
    options
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((o) => o.id)
        .filter((id) => id != null);

export const mapQuestionToForm = (q) => {
    const base = buildInitialForm();
    if (!q) return base;

    const questionType = q.question_type ?? base.questionType;
    const options = q.options ?? [];

    const mediaType = String(q.media_type ?? "").toLowerCase();
    const next = {
        ...base,
        subsectionId: q.subsection_id ?? q.subsection?.id ?? base.subsectionId,
        gradeIds: Array.isArray(q.grade_ids)
            ? q.grade_ids
            : Array.isArray(q.grades)
            ? q.grades.map((g) => g.id ?? g.grade_id).filter((v) => v != null)
            : base.gradeIds,
        difficulty: q.difficulty ?? q.difficulty_level ?? base.difficulty,
        language: q.language ?? base.language,
        isMandatory: q.is_mandatory ?? base.isMandatory,
        expectedTimeSeconds: q.expected_time_seconds ?? base.expectedTimeSeconds,
        prompt: q.question_text ?? q.prompt ?? base.prompt,
        supportingImage: mediaType === "image" ? q.media_file ?? q.media_url ?? null : null,
        // A fetched question's media_url for a video/audio type is always
        // a real link (there's no separate "uploaded filename" concept on
        // the backend) — so it hydrates into supportingMediaUrl, not the
        // filename-only supportingMedia field.
        supportingMedia: null,
        // Some API responses return an uploaded media URL as media_file,
        // while others use media_url.  In either case it is a displayable
        // link when the question is opened for editing.
        supportingMediaUrl: mediaType === "video" ? q.media_url ?? q.media_file ?? "" : "",
        questionType,
        points: q.points ?? base.points,
        negativeMarks: q.negative_marks ?? base.negativeMarks,
        shuffleOptions: q.shuffle_options ?? base.shuffleOptions,
    };

    if (OPTION_BASED_TYPES.includes(questionType)) {
        next.options = mapQuestionOptionsToForm(questionType, options) ?? base.options;
    } else if (questionType === "TRUE_FALSE") {
        const sorted = options.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        const correct = sorted.find((o) => o.is_correct ?? o.isCorrect);
        next.trueFalseAnswer = correct?.option_text ?? correct?.option_value ?? base.trueFalseAnswer;
        next.fixedOptionIds = extractFixedOptionIds(sorted);
    } else if (questionType === "YES_NO") {
        const sorted = options.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        const correct = sorted.find((o) => o.is_correct ?? o.isCorrect);
        next.yesNoAnswer = correct?.option_text ?? correct?.option_value ?? base.yesNoAnswer;
        next.fixedOptionIds = extractFixedOptionIds(sorted);
    } else if (questionType === "LIKERT_5" || questionType === "LIKERT_4" || questionType === "LIKERT_3") {
        next.likertLowLabel = q.likert_low_label ?? base.likertLowLabel;
        next.likertHighLabel = q.likert_high_label ?? base.likertHighLabel;
        next.likertReverseScored = q.reverse_scored ?? base.likertReverseScored;
        next.fixedOptionIds = extractFixedOptionIds(options);
    } else if (["SHORT_TEXT", "INTEGER", "DECIMAL"].includes(questionType)) {
        next.expectedAnswer = q.expected_answer ?? base.expectedAnswer;
        next.acceptableRange = q.acceptable_range ?? base.acceptableRange;
    } else if (questionType === "LONG_TEXT") {
        next.rubric = q.rubric ?? base.rubric;
    } else if (questionType === "RANK_ORDER") {
        next.rankItems = q.rank_items ?? base.rankItems;
    } else if (questionType === "MATCH_THE_FOLLOWING") {
        next.matchPairs = Array.isArray(q.match_pairs)
            ? q.match_pairs.map((p, i) => ({ id: `pair-${i}`, left: p.left ?? "", right: p.right ?? "" }))
            : base.matchPairs;
    } else if (questionType === "MATRIX") {
        next.matrixRows = q.matrix_rows ?? base.matrixRows;
        next.matrixCols = q.matrix_cols ?? base.matrixCols;
    } else if (questionType === "SLIDER") {
        next.sliderMin = q.slider_min ?? base.sliderMin;
        next.sliderMax = q.slider_max ?? base.sliderMax;
        next.sliderStep = q.slider_step ?? base.sliderStep;
        next.sliderDefault = q.slider_default ?? base.sliderDefault;
    }

    return next;
};

export const toQuestionFormData = (payload) => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (key === "media_file") {
            if (value instanceof File) {
                formData.append("media_file", value);
            }
            // not a File (null/None) -> omit entirely, don't send {}
            return;
        }

        if (key === "options") {
            formData.append("options", JSON.stringify(value));
            return;
        }

        if (key === "grade_ids") {
            value.forEach((id) => formData.append("grade_ids", id));
            return;
        }

        if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
            return;
        }

        formData.append(key, value);
    });

    return formData;
};

// ---- Small building blocks ------------------------------------------------

export const FieldLabel = ({ children, required }) => (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {children}
        {required && <span className={cn(adminTheme.text.danger, "ml-0.5")}>*</span>}
    </label>
);

export const TextInput = ({ id, value, onChange, placeholder, disabled, readOnly }) => (
    <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
            "h-11 w-full text-sm",
            adminTheme.radius.md,
            adminTheme.border.default,
            "border px-3 text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
            (disabled || readOnly) && "bg-slate-50 text-slate-400"
        )}
    />
);

export const NumberInput = ({ id, value, onChange, min, max, step = 1, placeholder }) => (
    <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={onChange}
        className={cn(
            "h-11 w-full text-sm",
            adminTheme.radius.md,
            adminTheme.border.default,
            "border px-3 text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        )}
    />
);

export const SelectInput = ({ id, value, onChange, options, labelKey, valueKey }) => (
    <select
        id={id}
        value={value}
        onChange={onChange}
        className={cn(
            "h-11 w-full text-sm",
            adminTheme.radius.md,
            adminTheme.border.default,
            "border bg-white px-3 text-slate-900",
            "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        )}
    >
        {options.map((option) => {
            const isObj = typeof option === "object";
            const val = isObj ? option[valueKey ?? "id"] : option;
            const label = isObj ? option[labelKey ?? "name"] : option;
            return (
                <option key={val} value={val}>
                    {label}
                </option>
            );
        })}
    </select>
);

// A labeled +/- stepper used for Correct Marks / Negative Marks.
export const NumberStepperCard = ({ label, value, onChange, step = 1, helper }) => (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding, "text-center")}>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="mt-4 flex items-center justify-center gap-4">
            <button
                type="button"
                onClick={() => onChange(Number((Number(value) - step).toFixed(2)))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label={`Decrease ${label}`}
            >
                <Minus className="h-4 w-4" />
            </button>
            <span className="text-2xl font-bold text-slate-900">{Number(value).toFixed(1)}</span>
            <button
                type="button"
                onClick={() => onChange(Number((Number(value) + step).toFixed(2)))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label={`Increase ${label}`}
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
        <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">{helper}</p>
    </div>
);

// Simple iOS-style toggle switch used for Shuffle Options / Partial Credit / Mandatory.
export const Switch = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
            checked ? "bg-slate-900" : "bg-slate-200"
        )}
    >
        <span
            className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                checked ? "translate-x-6" : "translate-x-1"
            )}
        />
    </button>
);



// Multi-select chip picker — used for Grade Level (question_grade_mapping is
// many-to-many, so this can never be a plain single <select>).
export const MultiSelectChips = ({ options, selectedIds, onToggle }) => (
    <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
            const isSelected = selectedIds.includes(opt.id);
            return (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => onToggle(opt.id)}
                    className={cn(
                        "h-9 rounded-full border px-4 text-xs font-bold uppercase tracking-wider transition",
                        isSelected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                >
                    {opt.name}
                </button>
            );
        })}
    </div>
);


export const TagInput = ({ tags, onAdd, onRemove }) => {
    const [draft, setDraft] = useState("");

    const commit = () => {
        const clean = draft.trim();
        if (clean && !tags.includes(clean)) onAdd(clean);
        setDraft("");
    };

    

    return (
        <div
            className={cn(
                "flex min-h-11 w-full flex-wrap items-center gap-2 p-2",
                adminTheme.radius.md,
                adminTheme.border.default,
                "border bg-white focus-within:ring-2 focus-within:ring-slate-900/10"
            )}
        >
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                >
                    {tag}
                    <button type="button" onClick={() => onRemove(tag)} aria-label={`Remove ${tag}`}>
                        <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        commit();
                    }
                }}
                onBlur={commit}
                placeholder="Add tag..."
                className="h-7 min-w-[100px] flex-1 border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
        </div>
    );
};

export const Dropzone = ({ icon: Icon, title, subtitle, fileName, onChange, onRemove, accept }) => {
    const inputRef = useRef(null);
    const displayName = typeof fileName === "string" ? fileName : fileName?.name ?? null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition",
                    adminTheme.radius.lg,
                    displayName ? "border-slate-300 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {displayName ? "Replace File" : title}
                </span>
                <span className="text-xs text-slate-400">{displayName || subtitle}</span>
            </button>

            {displayName && onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                        if (inputRef.current) inputRef.current.value = "";
                    }}
                    aria-label={`Remove ${displayName}`}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:text-red-600"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
};

// Generic add/remove/edit text list — reused for Rank Order items and Matrix
// rows/columns, which are all "just a list of labels" underneath.
export const SimpleListEditor = ({ items, onChange, itemLabel = "Item", minItems = 2 }) => {
    const setItem = (index, value) => onChange(items.map((it, i) => (i === index ? value : it)));
    const addItem = () => onChange([...items, `${itemLabel} ${items.length + 1}`]);
    const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

    return (
        <div className="space-y-2.5">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300" />
                    <div className="flex-1">
                        <TextInput value={item} onChange={(e) => setItem(index, e.target.value)} placeholder={`${itemLabel} ${index + 1}`} />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= minItems}
                        className={cn(
                            "rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600",
                            items.length <= minItems && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-300"
                        )}
                        aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
                <Plus className="h-4 w-4" />
                Add {itemLabel}
            </button>
        </div>
    );
};

// Left/right pair editor — used for Match The Following.
export const PairListEditor = ({ pairs, onChange }) => {
    const setPair = (id, side, value) => onChange(pairs.map((p) => (p.id === id ? { ...p, [side]: value } : p)));
    const addPair = () => onChange([...pairs, { id: `pair-${Date.now()}`, left: "", right: "" }]);
    const removePair = (id) => onChange(pairs.filter((p) => p.id !== id));

    return (
        <div className="space-y-2.5">
            {pairs.map((pair, index) => (
                <div key={pair.id} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-xs font-bold text-slate-400">{index + 1}</span>
                    <div className="flex-1">
                        <TextInput value={pair.left} onChange={(e) => setPair(pair.id, "left", e.target.value)} placeholder="Left item" />
                    </div>
                    <GitCompare className="h-4 w-4 shrink-0 text-slate-300" />
                    <div className="flex-1">
                        <TextInput value={pair.right} onChange={(e) => setPair(pair.id, "right", e.target.value)} placeholder="Matching right item" />
                    </div>
                    <button
                        type="button"
                        onClick={() => removePair(pair.id)}
                        disabled={pairs.length <= 2}
                        className={cn(
                            "rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600",
                            pairs.length <= 2 && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-300"
                        )}
                        aria-label={`Remove pair ${index + 1}`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={addPair}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
                <Plus className="h-4 w-4" />
                Add Pair
            </button>
        </div>
    );
};

// ---- Rich text prompt editor -----------------------------------------------
// (unchanged from before — maps 1:1 to questions.question_text)

export const RTE_STYLES = `
  .rte-content { min-height: 140px; outline: none; }
  .rte-content:empty:before { content: attr(data-placeholder); color: #94a3b8; }
  .rte-content ol { list-style: decimal; padding-left: 1.5rem; }
  .rte-content ul { list-style: disc; padding-left: 1.5rem; }
  .rte-content a { color: #4f46e5; text-decoration: underline; }
  .rte-content img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
  .rte-content p { margin: 0 0 0.5rem 0; }
`;

const ToolbarButton = ({ icon: Icon, isActive, onMouseDown, label }) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        onMouseDown={(e) => {
            e.preventDefault(); // keep the editor's selection intact
            onMouseDown();
        }}
        className={cn(
            "rounded-md p-1.5 transition",
            isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        )}
    >
        <Icon className="h-4 w-4" />
    </button>
);

export const RichTextEditor = ({ resetKey, initialHtml, onChange }) => {
    const editorRef = useRef(null);
    const symbolMenuRef = useRef(null);
    const [activeFormats, setActiveFormats] = useState({});
    const [isSymbolMenuOpen, setIsSymbolMenuOpen] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!initialHtml);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml || "";
            setIsEmpty(!initialHtml || initialHtml === "<br>");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (symbolMenuRef.current && !symbolMenuRef.current.contains(e.target)) setIsSymbolMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const syncActiveFormats = useCallback(() => {
        try {
            setActiveFormats({
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                underline: document.queryCommandState("underline"),
                insertOrderedList: document.queryCommandState("insertOrderedList"),
                insertUnorderedList: document.queryCommandState("insertUnorderedList"),
            });
        } catch {
            // queryCommandState can throw in some browsers if focus is elsewhere; ignore.
        }
    }, []);

    const handleInput = () => {
        const html = editorRef.current?.innerHTML ?? "";
        setIsEmpty(!html || html === "<br>");
        onChange(html);
    };

    const exec = (command, arg) => {
        editorRef.current?.focus();
        document.execCommand(command, false, arg);
        handleInput();
        syncActiveFormats();
    };

    const insertSymbol = (symbol) => {
        exec("insertText", symbol);
        setIsSymbolMenuOpen(false);
    };

    const clearFormatting = () => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();

        const range = document.createRange();
        range.selectNodeContents(editor);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("removeFormat");
        document.execCommand("unlink");

        handleInput();
        syncActiveFormats();
    };

    return (
        <div className={cn(adminTheme.radius.md, adminTheme.border.default, "border overflow-hidden")}>
            <style>{RTE_STYLES}</style>

            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
                <ToolbarButton icon={Bold} label="Bold" isActive={activeFormats.bold} onMouseDown={() => exec("bold")} />
                <ToolbarButton icon={Italic} label="Italic" isActive={activeFormats.italic} onMouseDown={() => exec("italic")} />
                <ToolbarButton icon={Underline} label="Underline" isActive={activeFormats.underline} onMouseDown={() => exec("underline")} />
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <ToolbarButton
                    icon={ListOrdered}
                    label="Numbered list"
                    isActive={activeFormats.insertOrderedList}
                    onMouseDown={() => exec("insertOrderedList")}
                />
                <ToolbarButton
                    icon={ListIcon}
                    label="Bulleted list"
                    isActive={activeFormats.insertUnorderedList}
                    onMouseDown={() => exec("insertUnorderedList")}
                />
                <div className="relative shrink-0" ref={symbolMenuRef}>
                    <ToolbarButton icon={Sigma} label="Insert math symbol" onMouseDown={() => setIsSymbolMenuOpen((prev) => !prev)} />
                    {isSymbolMenuOpen && (
                        <div className="absolute left-0 top-full z-20 mt-1 grid w-44 grid-cols-4 gap-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                            {MATH_SYMBOLS.map((symbol) => (
                                <button
                                    key={symbol}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insertSymbol(symbol);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                    {symbol}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {!isEmpty && (
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            clearFormatting();
                        }}
                        className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-700"
                    >
                        Clear formatting
                    </button>
                )}
            </div>

            <div
                ref={editorRef}
                className="rte-content w-full px-4 py-3 text-sm text-slate-900"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Write the question prompt candidates will see..."
                onInput={handleInput}
                onKeyUp={syncActiveFormats}
                onMouseUp={syncActiveFormats}
                onFocus={syncActiveFormats}
            />
        </div>
    );
};

// ---- Header: step tabs ------------------------------------------------

export const WizardHeader = ({
    currentStep,
    maxUnlockedStep,
    onStepClick,
    onBack,
    onDiscard,
    onNext,
    onPublish,
    isSavingDraft,
    lastSavedAt,
    isPublishing,
    isEditMode,
}) => {
    const isLastStep = currentStep === STEPS.length;
    const activeLabel = STEPS.find((s) => s.id === currentStep)?.label;

    return (
        <header className={cn("sticky top-0 z-50 border-b bg-white", adminTheme.border.default)}>
            <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                    {/* Back + step nav */}
                    <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-6">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Library</span>
                        </button>

                        {/* Full tab nav — desktop/tablet only */}
                        <nav className="hidden items-center gap-6 sm:flex">
                            {STEPS.map((step) => {
                                const isActive = step.id === currentStep;
                                const isUnlocked = step.id <= maxUnlockedStep;
                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        disabled={!isUnlocked}
                                        onClick={() => onStepClick(step.id)}
                                        className={cn(
                                            "flex items-center gap-2 border-b-2 pb-1 text-sm font-semibold transition-colors",
                                            isActive
                                                ? "border-slate-900 text-slate-900"
                                                : "border-transparent text-slate-400 hover:text-slate-600",
                                            !isUnlocked && "cursor-not-allowed opacity-50 hover:text-slate-400"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                                isActive || step.id < currentStep ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                                            )}
                                        >
                                            {step.id < currentStep ? <Check className="h-3.5 w-3.5" /> : step.id}
                                        </span>
                                        {step.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {isEditMode && (
                            <span className="hidden shrink-0 items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 sm:inline-flex">
                                Editing
                            </span>
                        )}
                    </div>

                    {/* Compact step progress — mobile only */}
                    <div className="sm:hidden">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">
                                Step {currentStep} of {STEPS.length}: {activeLabel}
                            </p>
                            {isEditMode && (
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                    Editing
                                </span>
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                            {STEPS.map((step) => (
                                <button
                                    key={step.id}
                                    type="button"
                                    disabled={step.id > maxUnlockedStep}
                                    onClick={() => onStepClick(step.id)}
                                    aria-label={step.label}
                                    className={cn(
                                        "h-1.5 flex-1 rounded-full transition-colors",
                                        step.id === currentStep ? "bg-slate-900" : step.id < currentStep ? "bg-slate-400" : "bg-slate-200"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-4">
                        <span className="hidden text-xs text-slate-400 sm:inline-flex sm:items-center sm:gap-1.5">
                            {isSavingDraft ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Saving draft...
                                </>
                            ) : (
                                lastSavedAt && `Draft saved at ${lastSavedAt}`
                            )}
                        </span>
                        <button type="button" onClick={onDiscard} className="shrink-0 text-sm font-medium text-slate-500 hover:text-red-600">
                            Discard
                        </button>
                        {isLastStep ? (
                            <button
                                type="button"
                                onClick={onPublish}
                                disabled={isPublishing}
                                className={cn(
                                    "inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:flex-none",
                                    isPublishing && "cursor-not-allowed opacity-70 hover:bg-emerald-600"
                                )}
                            >
                                {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                                {isPublishing ? "Publishing..." : "Publish Question"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onNext}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:flex-none"
                            >
                                <span className="sm:hidden">Next</span>
                                <span className="hidden sm:inline">Next: {STEPS[currentStep].label}</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

// ---- Sidebar: Live preview + Metadata insight ------------------------------
// (AnswerKeyLogicCard lives in Step2Configuration.jsx since it's step-2 only)

export const LivePreviewCard = ({ form, activeSubsection, gradeOptions }) => {
    const meta = DIFFICULTY_META[form.difficulty];
    const hasAnswerPreview = Boolean(form.questionType);
    const isPromptEmpty = !form.prompt || form.prompt === "<br>" || form.prompt === "<p></p>";
    const isOptionsType = OPTION_BASED_TYPES.includes(form.questionType);
    const isLikert = form.questionType === "LIKERT_5" || form.questionType === "LIKERT_4" || form.questionType === "LIKERT_3";
    const grades = gradeOptions || [];

    const isLikelyImageUrl = (value) =>
        typeof value === "string" && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value.trim());

    const isLikelyVideoUrl = (value) =>
        (typeof value === "string" && /\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(value.trim())) ||
        (typeof value === "string" && /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(value.trim()));

    const imagePreviewSrc = useMemo(() => {
        if (form.supportingImage instanceof File) {
            return URL.createObjectURL(form.supportingImage);
        }

        if (typeof form.supportingImage === "string" && isLikelyImageUrl(form.supportingImage)) {
            return form.supportingImage;
        }

        return null;
    }, [form.supportingImage]);

    const videoPreviewSrc = useMemo(() => {
        if (form.supportingMedia instanceof File) {
            return URL.createObjectURL(form.supportingMedia);
        }

        if (typeof form.supportingMediaUrl === "string" && form.supportingMediaUrl.trim()) {
            return form.supportingMediaUrl;
        }

        if (typeof form.supportingMedia === "string" && isLikelyVideoUrl(form.supportingMedia)) {
            return form.supportingMedia;
        }

        return null;
    }, [form.supportingMedia, form.supportingMediaUrl]);

    const hasMediaPreview = Boolean(imagePreviewSrc || videoPreviewSrc);

    return (
        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
            <style>{RTE_STYLES}</style>
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Candidate Preview</p>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={cn(adminTheme.badge.neutral, "uppercase")}>{activeSubsection?.name ?? "Subsection"}</span>
                <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium uppercase", meta.badge)}>
                    {DIFFICULTY_LABEL[form.difficulty]}
                </span>
                {form.gradeIds.map((id) => {
                    const name = grades.find((g) => String(g.id) === String(id))?.name;
                    return name ? (
                        <span key={id} className={adminTheme.badge.neutral}>
                            {name}
                        </span>
                    ) : null;
                })}
            </div>

            {isPromptEmpty ? (
                <p className="mt-4 text-sm text-slate-400">Your question prompt will appear here as you type.</p>
            ) : (
                <div className="rte-content mt-4 text-sm leading-relaxed text-slate-900" dangerouslySetInnerHTML={{ __html: form.prompt }} />
            )}

            {hasMediaPreview && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {imagePreviewSrc ? (
                        <img src={imagePreviewSrc} alt="Supporting media preview" className="h-56 w-full object-cover" />
                    ) : (
                        <video src={videoPreviewSrc} controls className="h-56 w-full bg-black object-cover" />
                    )}
                </div>
            )}

            <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
                {hasAnswerPreview ? (
                    <div className="space-y-2">
                        {isOptionsType &&
                            form.options.map((opt, i) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                    <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", opt.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-slate-300")} />
                                    <span className="text-slate-600">{opt.text || `Option ${i + 1}`}</span>
                                    {opt.image && <span className="text-xs text-slate-400">({opt.image})</span>}
                                </div>
                            ))}
                        {form.questionType === "TRUE_FALSE" && <p className="text-slate-600">Correct answer: {form.trueFalseAnswer}</p>}
                        {form.questionType === "YES_NO" && <p className="text-slate-600">Correct answer: {form.yesNoAnswer}</p>}
                        {isLikert && <p className="text-slate-600">{form.likertLowLabel} - {form.likertHighLabel}{form.likertReverseScored && " (reverse scored)"}</p>}
                        {form.questionType === "SHORT_TEXT" && <p className="text-slate-600">Expected answer: {form.expectedAnswer || "\u2014"}</p>}
                        {(form.questionType === "INTEGER" || form.questionType === "DECIMAL") && (
                            <p className="text-slate-600">
                                Expected answer: {form.expectedAnswer || "\u2014"}
                                {Number(form.acceptableRange) > 0 && ` (\u00b1${form.acceptableRange})`}
                            </p>
                        )}
                        {form.questionType === "LONG_TEXT" && <p className="text-slate-600">Rubric-graded response.</p>}
                        {form.questionType === "RANK_ORDER" && <p className="text-slate-600">{form.rankItems.length} items to rank.</p>}
                        {form.questionType === "MATCH_THE_FOLLOWING" && <p className="text-slate-600">{form.matchPairs.length} pairs to match.</p>}
                        {form.questionType === "MATRIX" && (
                            <p className="text-slate-600">
                                {form.matrixRows.length} rows &times; {form.matrixCols.length} columns.
                            </p>
                        )}
                        {form.questionType === "SLIDER" && (
                            <p className="text-slate-600">
                                Range {form.sliderMin}&ndash;{form.sliderMax}, step {form.sliderStep}.
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="italic text-slate-400">Select a question type to see answer options preview.</p>
                )}
            </div>
        </div>
    );
};

export const MetadataInsightCard = ({ form, gradeOptions }) => {
    const grades = gradeOptions || [];

    const rows = [
        { label: "Est. Time to Answer", value: `${form.expectedTimeSeconds}s` },
        {
            label: "Grade Mapping",
            value:
                form.gradeIds
                    .map((id) => grades.find((g) => String(g.id) === String(id))?.name)
                    .filter(Boolean)
                    .join(", ") || "\u2014",
        },
        { label: "Language", value: form.language },
    ];

    return (
        <div className="rounded-xl bg-slate-900 p-5 text-white">
            <p className="text-base font-semibold">Metadata Insight</p>
            <div className="mt-4 space-y-3">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{row.label}</span>
                        <span className="font-bold">{row.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ---- Discard / Publish confirmation modals --------------------------------

export const DiscardModal = ({ open, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" onClick={onCancel}>
            <div className={cn(adminTheme.card.base, adminTheme.shadow.xl, "w-full max-w-sm p-6")} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </span>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Discard this question?</h3>
                        <p className="mt-1 text-sm text-slate-500">This will clear everything you've entered. This action can't be undone.</p>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
                        Keep Editing
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PublishConfirmModal = ({ open, onConfirm, onCancel, isEditMode }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" onClick={onCancel}>
            <div className={cn(adminTheme.card.base, adminTheme.shadow.xl, "w-full max-w-sm p-6")} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <Info className="h-5 w-5 text-emerald-600" />
                    </span>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Confirm Publish</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {isEditMode
                                ? "This will save your changes and publish the updated question."
                                : "This will publish the question to the library and mark it as final."}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                        Confirm Publish
                    </button>
                </div>
            </div>
        </div>
    );
};

export const getDefaultLikertEndpoints = (questionType) => {
    if (questionType === "LIKERT_4") {
        return { low: LIKERT_4_LABELS[0], high: LIKERT_4_LABELS[LIKERT_4_LABELS.length - 1] };
    }
    if (questionType === "LIKERT_3") {
        return { low: LIKERT_3_LABELS[0], high: LIKERT_3_LABELS[LIKERT_3_LABELS.length - 1] };
    }
    if (questionType === "LIKERT_5") {
        return { low: LIKERT_5_LABELS[0], high: LIKERT_5_LABELS[LIKERT_5_LABELS.length - 1] };
    }
    return null;
};

// ============================================================================
// PAGE: CreateQuestion — orchestrates the 4 step components
// ============================================================================

const CreateQuestion = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const params = useParams();
    const questionId = params.questionId ?? params.id;
    const isEditMode = Boolean(questionId);

    const { subsections, subsectionsLoading, subsectionsError } = useSelector((state) => state.subsection);
    const {
        questionCode,
        generateCodeLoading,
        generateCodeError,
        createQuestionLoading,
        selectedQuestion,
        getQuestionByIdLoading,
        getQuestionByIdError,
        updateQuestionLoading,
    } = useSelector((state) => state.question);
    const { grades, gradesLoading, gradesError } = useSelector((state) => state.grade);

    const [currentStep, setCurrentStep] = useState(1);
    const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);
    const [form, setForm] = useState(() => buildInitialForm());
    const [editorResetKey, setEditorResetKey] = useState(0);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [isDiscardOpen, setIsDiscardOpen] = useState(false);
    const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
    const [publishError, setPublishError] = useState(null);
    const [hasHydratedFromApi, setHasHydratedFromApi] = useState(false);
    useEffect(() => {
        dispatch(fetchSubsections());
        dispatch(fetchGrades());
    }, [dispatch]);

    // Edit mode: fetch the existing question (published or draft) by id.
    // Cleared on unmount so a later "New Question" visit doesn't briefly
    // show stale data from a previously edited question.
    useEffect(() => {
        if (isEditMode) {
            dispatch(getQuestionById(questionId));
        }
        return () => {
            if (isEditMode) dispatch(resetSelectedQuestion());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, questionId]);

    // Subsections come straight from the API — no static fallback list.
    // Until the fetch resolves, this is an empty array and the UI shows a
    // loading / empty / error state instead of dummy subsections (see
    // SubsectionSelector / BasicInformationCard in Step1SetupContent.jsx).
    const availableSubsections = subsections || [];


    const availableGrades = useMemo(() => {
        let list = [];
        if (Array.isArray(grades)) {
            list = grades;
        } else if (grades && Array.isArray(grades.data)) {
            list = grades.data;
        } else if (grades && grades.results && Array.isArray(grades.results.data)) {
            list = grades.results.data;
        }

        return list
            // Uncomment to hide inactive grades from the picker entirely:
            // .filter((g) => g.status !== "INACTIVE")
            .map((g) => ({
                id: g.id,
                name: g.grade_name ?? g.name ?? String(g.id),
                code: g.grade_code ?? g.code,
                status: g.status,
            }));
    }, [grades]);

    // Initialize form once API subsections are available.
    // Skipped in edit mode — the hydrate effect below seeds subsectionId
    // (and everything else) from the fetched question instead.
    useEffect(() => {
        if (isEditMode) return;
        if (availableSubsections.length && !form.subsectionId) {
            const first = availableSubsections[0];
            setForm((prev) => {
                const next = { ...prev, subsectionId: first.id };
                const sample = SAMPLE_BY_SUBSECTION_CODE[first.subsection_code];
                if (sample) next.prompt = sample.prompt;
                return next;
            });
            setEditorResetKey((k) => k + 1);
            dispatch(generateQuestionCode(first.id));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableSubsections, isEditMode]);

    // Initialize a default grade selection once the grades API responds.
    // Only runs once, when gradeIds is still empty, so it never clobbers a
    // choice the user has already made. Skipped in edit mode for the same
    // reason as above.
    useEffect(() => {
        if (isEditMode) return;
        if (availableGrades.length && form.gradeIds.length === 0) {
            setForm((prev) => (prev.gradeIds.length === 0 ? { ...prev, gradeIds: [availableGrades[0].id] } : prev));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableGrades, isEditMode]);

    // Edit mode: hydrate the wizard form from the fetched question, once
    // both the question itself and the subsection/grade lookup lists have
    // all arrived (so grade chips / subsection dropdown resolve correctly
    // against `mapQuestionToForm`'s output). Runs once per edit session.
    useEffect(() => {
        if (!isEditMode || hasHydratedFromApi) return;
        if (!selectedQuestion || !availableSubsections.length || !availableGrades.length) return;

        setForm(mapQuestionToForm(selectedQuestion));
        setEditorResetKey((k) => k + 1);
        setHasHydratedFromApi(true);
    }, [isEditMode, hasHydratedFromApi, selectedQuestion, availableSubsections, availableGrades]);
    

const handleFieldChange = (field, value) => {
    if (field === "questionType") {
        setForm((prev) => {
            const previousScoring = getDefaultScoringForQuestionType(prev.questionType);
            const shouldResetScoring =
                (prev.points === 0 && prev.negativeMarks === 0) ||
                (prev.points === previousScoring.points && prev.negativeMarks === previousScoring.negativeMarks);
            const next = {
                ...prev,
                questionType: value,
            };

            if (shouldResetScoring) {
                const scoring = getDefaultScoringForQuestionType(value);
                next.points = scoring.points;
                next.negativeMarks = scoring.negativeMarks;
            }

            // Reset Low/High End Label to match the newly selected Likert
            // scale, unless the user already customized them away from the
            // *previous* type's defaults (in which case respect their edit).
            const prevDefaults = getDefaultLikertEndpoints(prev.questionType);
            const nextDefaults = getDefaultLikertEndpoints(value);
            if (nextDefaults) {
                const userHadCustomized =
                    prevDefaults &&
                    (prev.likertLowLabel !== prevDefaults.low || prev.likertHighLabel !== prevDefaults.high);
                if (!userHadCustomized) {
                    next.likertLowLabel = nextDefaults.low;
                    next.likertHighLabel = nextDefaults.high;
                }
            }

            return next;
        });
        return;
    }

    // Supporting image, uploaded video/audio, and pasted link are mutually
    // exclusive.  Keeping this invariant here (rather than only in the UI)
    // also prevents stale media fields from being included in the payload.
    if (field === "supportingImage" && value) {
        setForm((prev) => ({ ...prev, supportingImage: value, supportingMedia: null, supportingMediaUrl: "" }));
        return;
    }
    if (field === "supportingMedia" && value) {
        setForm((prev) => ({ ...prev, supportingImage: null, supportingMedia: value, supportingMediaUrl: "" }));
        return;
    }
    if (field === "supportingMediaUrl" && typeof value === "string" && value.trim()) {
        setForm((prev) => ({ ...prev, supportingImage: null, supportingMedia: null, supportingMediaUrl: value }));
        return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
};

    const handleSubsectionChange = (subsectionId) => {
        setForm((prev) => {
            const next = {
                ...prev,
                subsectionId,
            };

            // Sample prompts are keyed by the official subsection code returned from the API
            const found = availableSubsections.find((s) => String(s.id) === String(subsectionId));
            const sample = found && SAMPLE_BY_SUBSECTION_CODE[found.subsection_code];

            // Don't overwrite an already-authored prompt when editing an
            // existing question — only seed the sample prompt for new ones.
            if (sample && !isEditMode) {
                next.prompt = sample.prompt;
            }

            return next;
        });

        setEditorResetKey((k) => k + 1);

        // Generate question code from backend — not applicable in edit mode,
        // where the code already exists on the fetched question.
        if (!isEditMode) {
            if (subsectionId) {
                dispatch(generateQuestionCode(subsectionId));
            } else {
                dispatch(resetQuestionCode());
            }
        }
    };

    // Question code to display/send: generated live for a new question,
    // read off the fetched record when editing.
    const displayQuestionCode = isEditMode
        ? selectedQuestion?.question_code ?? questionId
        : questionCode;


    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate("/s-admin/question-library");
        }
    };

    const goToStep = (stepId) => {
        if (stepId > maxUnlockedStep) return;
        setCurrentStep(stepId);
    };

 const handleNext = async () => {
    if (currentStep === 1) {
        const validationError = getStep1ValidationError(form);
        if (validationError) {
            setPublishError(validationError);
            return;
        }
    }
    setPublishError(null);

    const next = Math.min(STEPS.length, currentStep + 1);
    setCurrentStep(next);
    setMaxUnlockedStep((prev) => Math.max(prev, next));

    setIsSavingDraft(true);
    const payload = buildQuestionPayload(form, displayQuestionCode, true);
    // A real uploaded File can't survive JSON — send multipart instead
    // whenever media_file actually holds a File.
    const requestBody = payload.media_file instanceof File ? toQuestionFormData(payload) : payload;

    try {
        if (isEditMode) {
            await dispatch(updateQuestion({ questionId, payload: requestBody })).unwrap();
        } else {
            await dispatch(createQuestion(requestBody)).unwrap();
        }
        setLastSavedAt(new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
    } catch (err) {
        console.error("Failed to save draft:", err);
    } finally {
        setIsSavingDraft(false);
    }
};
    const handleDiscard = () => setIsDiscardOpen(true);

    const handleConfirmDiscard = () => {
        setForm(buildInitialForm());
        setEditorResetKey((k) => k + 1);
        setCurrentStep(1);
        setMaxUnlockedStep(1);
        setIsDiscardOpen(false);
        navigate("/s-admin/question-library");
    };

    // Publishes / saves the question to the backend.
    const handlePublish = () => {
        const validationError = getStep1ValidationError(form);
        if (validationError) {
            setPublishError(validationError);
            setCurrentStep(1);
            setMaxUnlockedStep((prev) => Math.max(prev, 1));
            return;
        }

        setPublishError(null);
        setIsPublishConfirmOpen(true);
    };

   const handleConfirmPublish = async () => {
    setIsPublishConfirmOpen(false);
    const payload = buildQuestionPayload(form, displayQuestionCode, false);
    const requestBody = payload.media_file instanceof File ? toQuestionFormData(payload) : payload;

    try {
        if (isEditMode) {
            await dispatch(updateQuestion({ questionId, payload: requestBody })).unwrap();
        } else {
            await dispatch(createQuestion(requestBody)).unwrap();
        }
        navigate("/s-admin/question-library");
    } catch (err) {
        setPublishError(err?.detail || err?.message || "Failed to publish question. Please try again.");
    }
};

    const isReviewStep = currentStep === STEPS.length;

    const activeSubsection = availableSubsections.find((s) => String(s.id) === String(form.subsectionId));

    // Edit mode: block on the question fetch before rendering the wizard,
    // so we never flash the wizard pre-seeded with default/empty values.
    if (isEditMode && !hasHydratedFromApi) {
        if (getQuestionByIdError) {
            return (
                <div className={cn("flex min-h-screen flex-col items-center justify-center gap-3", adminTheme.surface.page)}>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    <p className="text-sm text-red-600">
                        {typeof getQuestionByIdError === "string" ? getQuestionByIdError : "Failed to load this question."}
                    </p>
                    <button type="button" onClick={handleBack} className={adminTheme.actionButton.secondary}>
                        Back to Library
                    </button>
                </div>
            );
        }
        return (
            <div className={cn("flex min-h-screen items-center justify-center gap-2 text-slate-400", adminTheme.surface.page)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading question...
            </div>
        );
    }

    return (
        <div className={cn("min-h-screen", adminTheme.surface.page)}>
            <WizardHeader
                currentStep={currentStep}
                maxUnlockedStep={maxUnlockedStep}
                onStepClick={goToStep}
                onBack={handleBack}
                onDiscard={handleDiscard}
                onNext={handleNext}
                onPublish={handlePublish}
                isSavingDraft={isSavingDraft}
                lastSavedAt={lastSavedAt}
                isPublishing={createQuestionLoading || updateQuestionLoading}
                isEditMode={isEditMode}
            />

            {publishError && (
                <div className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {publishError}
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
                {isReviewStep ? (
                    <Review
                        form={form}
                        questionCode={displayQuestionCode}
                        activeSubsection={activeSubsection}
                        gradeOptions={availableGrades}
                        onGoToStep={goToStep}
                        isEditMode={isEditMode}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            {currentStep === 1 && (
                                <SetupContent
                                    form={form}
                                    questionCode={displayQuestionCode}
                                    resetKey={editorResetKey}
                                    onFieldChange={handleFieldChange}
                                    onSubsectionChange={handleSubsectionChange}
                                    options={availableSubsections}
                                    subsectionsLoading={subsectionsLoading}
                                    subsectionsError={subsectionsError}
                                    gradeOptions={availableGrades}
                                    gradesLoading={gradesLoading}
                                    gradesError={gradesError}
                                />
                            )}
                            {currentStep === 2 && <Configuration form={form} onFieldChange={handleFieldChange} />}
                            {currentStep === 3 && <ScoringWeightage form={form} onFieldChange={handleFieldChange} />}
                        </div>

                        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                            <LivePreviewCard form={form} activeSubsection={activeSubsection} gradeOptions={availableGrades} />
                            <MetadataInsightCard form={form} gradeOptions={availableGrades} />
                            {currentStep === 2 && <Configuration.AnswerKeyLogicCard form={form} />}
                        </div>
                    </div>
                )}
            </main>

            <DiscardModal open={isDiscardOpen} onConfirm={handleConfirmDiscard} onCancel={() => setIsDiscardOpen(false)} />
            <PublishConfirmModal
                open={isPublishConfirmOpen}
                onConfirm={handleConfirmPublish}
                onCancel={() => setIsPublishConfirmOpen(false)}
                isEditMode={isEditMode}
            />
        </div>
    );
};

export default CreateQuestion;
