import { useRef } from "react";
import { AlertTriangle, Check, CheckCircle2, GripVertical, Image as ImageIcon, Trash2, Plus, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import {
    OPTION_BASED_TYPES,
    OPTION_LETTERS,
    LIKERT_5_LABELS,
    LIKERT_4_LABELS,
    LIKERT_3_LABELS,
    QUESTION_TYPE_META,
    FieldLabel,
    TextInput,
    NumberInput,
    Switch,
    SimpleListEditor,
    PairListEditor,
} from "../CreateQuestion";

// ---- Step 2: Configuration -----------------------------------------------

// Card-style option row: radio/checkbox "correct" selector (radio for
// single-answer types, checkbox for Multiple Choice), editable text +
// internal value, optional reference image, drag handle, and delete.
const OptionCard = ({ option, index, allowImage, allowMultipleCorrect, onTextChange, onValueChange, onImageChange, onSetCorrect, onRemove, canRemove }) => {
    const imageInputRef = useRef(null);
    const letter = OPTION_LETTERS[index] ?? index + 1;

    return (
        <div
            className={cn(
                "rounded-xl border p-4 transition",
                option.isCorrect ? "border-slate-900 bg-slate-50/70" : "border-slate-200 bg-white"
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={onSetCorrect} className="flex items-center gap-2.5">
                    <span
                        className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition",
                            allowMultipleCorrect ? "rounded" : "rounded-full",
                            option.isCorrect ? "border-slate-900 bg-slate-900" : "border-slate-300"
                        )}
                    >
                        {option.isCorrect && (allowMultipleCorrect ? <Check className="h-3 w-3 text-white" /> : <span className="h-2 w-2 rounded-full bg-white" />)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Option {letter}
                        {option.isCorrect && <span className="ml-1 text-emerald-600">(Correct)</span>}
                    </span>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                    {allowImage && (
                        <>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(e) => onImageChange(e.target.files?.[0]?.name ?? null)}
                            />
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                title="Attach reference image"
                                className={cn(
                                    "rounded-md p-1.5 transition",
                                    option.image ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    <GripVertical className="h-4 w-4 cursor-grab text-slate-300" />
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={!canRemove}
                        className={cn(
                            "rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600",
                            !canRemove && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-300"
                        )}
                        aria-label="Remove option"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                    <TextInput
                        value={option.text}
                        onChange={(e) => onTextChange(e.target.value)}
                        placeholder={`Enter option ${letter} text...`}
                    />
                </div>
                {/* <TextInput
                    value={option.value}
                    onChange={(e) => onValueChange(e.target.value)}
                    placeholder="Internal value (optional)"
                /> */}
            </div>
            {option.image && <p className="mt-1.5 text-xs text-slate-400">Attached: {option.image}</p>}
        </div>
    );
};

const AnswerConfigurationCard = ({ form, onFieldChange }) => {
    const setOptionText = (id, text) => onFieldChange("options", form.options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
    const setOptionValue = (id, value) => onFieldChange("options", form.options.map((opt) => (opt.id === id ? { ...opt, value } : opt)));
    const setOptionImage = (id, image) => onFieldChange("options", form.options.map((opt) => (opt.id === id ? { ...opt, image } : opt)));

    const isMulti = form.questionType === "MULTIPLE_CHOICE";
    const setCorrectOption = (id) =>
        onFieldChange(
            "options",
            form.options.map((opt) => (isMulti ? (opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt) : { ...opt, isCorrect: opt.id === id }))
        );

    const addOption = () =>
        onFieldChange("options", [...form.options, { id: `opt-${Date.now()}`, text: "", value: "", image: null, isCorrect: false }]);
    const removeOption = (id) => onFieldChange("options", form.options.filter((opt) => opt.id !== id));

    const isOptionsType = OPTION_BASED_TYPES.includes(form.questionType);
    const isLikert = form.questionType === "LIKERT_5" || form.questionType === "LIKERT_4"|| form.questionType === "LIKERT_3";
    const likertLabels = form.questionType === "LIKERT_4" ? LIKERT_4_LABELS : form.questionType === "LIKERT_3" ? LIKERT_3_LABELS : LIKERT_5_LABELS;

    return (
        <div className="space-y-6">
            <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                {!form.questionType && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">Answer Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Select a question type in Setup &amp; Content to configure its answer options.</p>
                    </>
                )}

                {isOptionsType && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">{QUESTION_TYPE_META[form.questionType].label} Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>
                            {isMulti ? "Add options and mark every correct answer." : "Add options and define the single correct answer."}
                        </p>

                        <div className="mt-6">
                            <div className="mb-3 flex items-center justify-between">
                                <FieldLabel>
                                    {form.questionType === "IMAGE_SELECTION" ? "Answer options (attach a reference image per option)" : "Answer options"}
                                </FieldLabel>
                                <button type="button" onClick={addOption} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                    <Plus className="h-4 w-4" />
                                    Add Option
                                </button>
                            </div>

                            <div className="space-y-3">
                                {form.options.map((option, index) => (
                                    <OptionCard
                                        key={option.id}
                                        option={option}
                                        index={index}
                                        allowImage={form.questionType === "IMAGE_SELECTION"}
                                        allowMultipleCorrect={isMulti}
                                        onTextChange={(text) => setOptionText(option.id, text)}
                                        onValueChange={(value) => setOptionValue(option.id, value)}
                                        onImageChange={(image) => setOptionImage(option.id, image)}
                                        onSetCorrect={() => setCorrectOption(option.id)}
                                        onRemove={() => removeOption(option.id)}
                                        canRemove={form.options.length > 2}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {form.questionType === "TRUE_FALSE" && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">True/False Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Stored as two options; set which one is correct.</p>
                        <div className="mt-6">
                            <FieldLabel>Correct Answer</FieldLabel>
                            <div className="grid grid-cols-2 gap-2 sm:w-64">
                                {["True", "False"].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => onFieldChange("trueFalseAnswer", val)}
                                        className={cn(
                                            "h-11 rounded-lg border text-sm font-semibold transition",
                                            form.trueFalseAnswer === val ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400 hover:border-slate-300"
                                        )}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {form.questionType === "YES_NO" && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">Yes/No Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Stored as two options; set which one is correct.</p>
                        <div className="mt-6">
                            <FieldLabel>Correct Answer</FieldLabel>
                            <div className="grid grid-cols-2 gap-2 sm:w-64">
                                {["Yes", "No"].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => onFieldChange("yesNoAnswer", val)}
                                        className={cn(
                                            "h-11 rounded-lg border text-sm font-semibold transition",
                                            form.yesNoAnswer === val ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400 hover:border-slate-300"
                                        )}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {isLikert && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">{QUESTION_TYPE_META[form.questionType].label} Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>
                            Self-report scale \u2014 stored as {likertLabels.length} options with no correct answer.
                        </p>
                        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <FieldLabel>Low End Label</FieldLabel>
                                <TextInput value={form.likertLowLabel} onChange={(e) => onFieldChange("likertLowLabel", e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel>High End Label</FieldLabel>
                                <TextInput value={form.likertHighLabel} onChange={(e) => onFieldChange("likertHighLabel", e.target.value)} />
                            </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between rounded-lg border border-dashed border-slate-200 p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Reverse Scored</p>
                                <p className="mt-0.5 text-xs text-slate-400">Flip scoring direction for this item within its dimension.</p>
                            </div>
                            <Switch checked={form.likertReverseScored} onChange={(val) => onFieldChange("likertReverseScored", val)} />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {likertLabels.map((label) => (
                                <span key={label} className={cn(adminTheme.badge.neutral)}>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </>
                )}

                {(form.questionType === "SHORT_TEXT" || form.questionType === "INTEGER" || form.questionType === "DECIMAL") && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">{QUESTION_TYPE_META[form.questionType].label} Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>
                            Define the expected answer{form.questionType !== "SHORT_TEXT" && " and an acceptable margin of error"}.
                        </p>
                        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:max-w-md">
                            <div>
                                <FieldLabel>Expected Answer</FieldLabel>
                                <TextInput
                                    value={form.expectedAnswer}
                                    onChange={(e) => onFieldChange("expectedAnswer", e.target.value)}
                                    placeholder={form.questionType === "SHORT_TEXT" ? "e.g. Acceleration" : "e.g. 9"}
                                />
                            </div>
                            {form.questionType !== "SHORT_TEXT" && (
                                <div>
                                    <FieldLabel>Acceptable Range (&plusmn;)</FieldLabel>
                                    <NumberInput min={0} step="0.01" value={form.acceptableRange} onChange={(e) => onFieldChange("acceptableRange", e.target.value)} />
                                </div>
                            )}
                        </div>
                        <p className="mt-4 text-xs text-amber-600">
                            Schema gap: `questions` has no column to persist this expected answer for non-option types \u2014
                            confirm the storage location with backend before this goes live.
                        </p>
                    </>
                )}

                {form.questionType === "LONG_TEXT" && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">Long Text Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Describe what graders should look for in a full-credit response.</p>
                        <div className="mt-6">
                            <FieldLabel>Grading Rubric Notes</FieldLabel>
                            <textarea
                                rows={4}
                                value={form.rubric}
                                onChange={(e) => onFieldChange("rubric", e.target.value)}
                                placeholder="Describe what a full-credit response should include..."
                                className={cn(
                                    "w-full resize-none text-sm",
                                    adminTheme.radius.md,
                                    adminTheme.border.default,
                                    "border px-3 py-2.5 text-slate-900 placeholder:text-slate-400",
                                    "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                )}
                            />
                        </div>
                        <p className="mt-4 text-xs text-amber-600">Schema gap: no `rubric` column on `questions` yet \u2014 confirm storage with backend.</p>
                    </>
                )}

                {form.questionType === "RANK_ORDER" && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">Rank Order Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Candidates will drag these items into their preferred order.</p>
                        <div className="mt-6">
                            <FieldLabel>Items to Rank</FieldLabel>
                            <SimpleListEditor items={form.rankItems} onChange={(items) => onFieldChange("rankItems", items)} itemLabel="Item" minItems={2} />
                        </div>
                    </>
                )}

                {form.questionType === "MATCH_THE_FOLLOWING" && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">Match the Following Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Define the correct left-to-right pairing.</p>
                        <div className="mt-6">
                            <FieldLabel>Pairs</FieldLabel>
                            <PairListEditor pairs={form.matchPairs} onChange={(pairs) => onFieldChange("matchPairs", pairs)} />
                        </div>
                    </>
                )}

                {form.questionType === "MATRIX" && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">Matrix Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Define the rows and the shared set of columns candidates choose from.</p>
                        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
                            <div>
                                <FieldLabel>Rows</FieldLabel>
                                <SimpleListEditor items={form.matrixRows} onChange={(rows) => onFieldChange("matrixRows", rows)} itemLabel="Row" minItems={1} />
                            </div>
                            <div>
                                <FieldLabel>Columns</FieldLabel>
                                <SimpleListEditor items={form.matrixCols} onChange={(cols) => onFieldChange("matrixCols", cols)} itemLabel="Column" minItems={2} />
                            </div>
                        </div>
                    </>
                )}

                {form.questionType === "SLIDER" && (
                    <>
                        <h2 className="text-lg font-semibold text-slate-900">Slider Configuration</h2>
                        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Set the numeric range candidates can select from.</p>
                        <div className="mt-6 grid grid-cols-2 gap-5 sm:max-w-lg sm:grid-cols-4">
                            <div>
                                <FieldLabel>Min</FieldLabel>
                                <NumberInput value={form.sliderMin} onChange={(e) => onFieldChange("sliderMin", Number(e.target.value))} />
                            </div>
                            <div>
                                <FieldLabel>Max</FieldLabel>
                                <NumberInput value={form.sliderMax} onChange={(e) => onFieldChange("sliderMax", Number(e.target.value))} />
                            </div>
                            <div>
                                <FieldLabel>Step</FieldLabel>
                                <NumberInput value={form.sliderStep} onChange={(e) => onFieldChange("sliderStep", Number(e.target.value))} />
                            </div>
                            <div>
                                <FieldLabel>Default</FieldLabel>
                                <NumberInput value={form.sliderDefault} onChange={(e) => onFieldChange("sliderDefault", Number(e.target.value))} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Mirrors the "Answer Key Logic" panel — shows which option(s) are currently
// marked correct so it's obvious at a glance. Applies to any option-based
// type. Rendered in the sidebar (see CreateQuestion.jsx) only on Step 2, so
// it's attached to the default export below rather than exported standalone.
const AnswerKeyLogicCard = ({ form }) => {
    const isOptionsType = OPTION_BASED_TYPES.includes(form.questionType);
    if (!isOptionsType) return null;

    const correctOptions = form.options.filter((opt) => opt.isCorrect);
    const hasCorrect = correctOptions.length > 0;
    const letters = form.options
        .map((opt, i) => (opt.isCorrect ? OPTION_LETTERS[i] ?? i + 1 : null))
        .filter(Boolean)
        .join(", ");

    return (
        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Answer Key Logic</p>
            <div className={cn("mt-4 flex items-start gap-2.5 rounded-lg p-3", hasCorrect ? "bg-emerald-50" : "bg-amber-50")}>
                {hasCorrect ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                <div>
                    <p className={cn("text-sm font-semibold", hasCorrect ? "text-emerald-800" : "text-amber-800")}>
                        {hasCorrect ? `Option${correctOptions.length > 1 ? "s" : ""} ${letters} set as correct` : "No correct option selected"}
                    </p>
                    <p className={cn("mt-1 text-xs", hasCorrect ? "text-emerald-700/80" : "text-amber-700/80")}>
                        {hasCorrect
                            ? `System will auto-grade this item using Option${correctOptions.length > 1 ? "s" : ""} ${letters}.`
                            : "Select at least one option to mark it correct."}
                    </p>
                </div>
            </div>
        </div>
    );
};

// ---- Step 2 wrapper --------------------------------------------------------

const Configuration = ({ form, onFieldChange }) => <AnswerConfigurationCard form={form} onFieldChange={onFieldChange} />;

// Attached so CreateQuestion.jsx can render the sidebar-only Answer Key
// Logic card (Step 2 exclusive) as `Step2Configuration.AnswerKeyLogicCard`
// without needing a 6th file.
Configuration.AnswerKeyLogicCard = AnswerKeyLogicCard;

export default Configuration;