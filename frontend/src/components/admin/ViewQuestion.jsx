import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Circle,
    Image as ImageIcon,
    GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubsections } from "../../slices/subsectionSlice";
import { fetchGrades } from "../../slices/gradeSlice";
import { getQuestionById, resetSelectedQuestion } from "../../slices/questionSlice";
import {
    mapQuestionToForm,
    DIFFICULTY_LABEL,
    DIFFICULTY_META,
    QUESTION_TYPE_META,
    OPTION_BASED_TYPES,
    OPTION_LETTERS,
    LIKERT_5_LABELS,
    LIKERT_4_LABELS,
    LIKERT_3_LABELS,
    RTE_STYLES,
    LivePreviewCard,
    MetadataInsightCard,
} from "./CreateQuestion";

// ============================================================================
// PAGE: ViewQuestion — read-only detail view for a single question.
// Reached from QuestionLibrary's "View" (eye) action:
//   /s-admin/question-library/:questionId
// Reuses the same data-shaping helpers as the wizard (`mapQuestionToForm`)
// so option ordering, fixed-type answers, and type-specific extras all
// resolve exactly the same way they do in edit mode.
// ============================================================================

const STATUS_META = {
    PUBLISHED: { label: "Published", badge: "bg-emerald-50 text-emerald-700" },
    DRAFT: { label: "Draft", badge: "bg-amber-50 text-amber-700" },
};

const SummaryRow = ({ label, children }) => (
    <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-1.5 text-sm font-semibold text-slate-900">{children}</div>
    </div>
);

// ---- Answer detail (full breakdown, per question type) --------------------

const AnswerDetailCard = ({ form }) => {
    const isOptionsType = OPTION_BASED_TYPES.includes(form.questionType);
    const isLikert = form.questionType === "LIKERT_5" || form.questionType === "LIKERT_4" || form.questionType === "LIKERT_3";
    const likertLabels = form.questionType === "LIKERT_4" ? LIKERT_4_LABELS : form.questionType === "LIKERT_3" ? LIKERT_3_LABELS : LIKERT_5_LABELS;

    return (
        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {form.questionType ? `${QUESTION_TYPE_META[form.questionType].label} — Answer Key` : "Answer Key"}
            </p>

            {!form.questionType && <p className="mt-3 text-sm text-slate-400">No question type set.</p>}

            {isOptionsType && (
                <div className="mt-4 space-y-2.5">
                    {form.options.map((opt, index) => (
                        <div
                            key={opt.id}
                            className={cn(
                                "flex items-start gap-3 rounded-lg border p-3",
                                opt.isCorrect ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white"
                            )}
                        >
                            <span
                                className={cn(
                                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                                    opt.isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"
                                )}
                            >
                                {OPTION_LETTERS[index] ?? index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900">{opt.text || <span className="italic text-slate-400">Empty option</span>}</p>
                                {opt.value && <p className="mt-0.5 text-xs text-slate-400">Value: {opt.value}</p>}
                                {opt.image && (
                                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                                        <ImageIcon className="h-3 w-3" />
                                        {opt.image}
                                    </p>
                                )}
                            </div>
                            {opt.isCorrect && <span className="shrink-0 text-xs font-semibold text-emerald-700">Correct</span>}
                        </div>
                    ))}
                </div>
            )}

            {form.questionType === "TRUE_FALSE" && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:w-64">
                    {["True", "False"].map((val) => (
                        <div
                            key={val}
                            className={cn(
                                "flex h-11 items-center justify-center rounded-lg border text-sm font-semibold",
                                form.trueFalseAnswer === val ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400"
                            )}
                        >
                            {val}
                        </div>
                    ))}
                </div>
            )}

            {form.questionType === "YES_NO" && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:w-64">
                    {["Yes", "No"].map((val) => (
                        <div
                            key={val}
                            className={cn(
                                "flex h-11 items-center justify-center rounded-lg border text-sm font-semibold",
                                form.yesNoAnswer === val ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400"
                            )}
                        >
                            {val}
                        </div>
                    ))}
                </div>
            )}

            {isLikert && (
                <div className="mt-4 space-y-3">
                    <p className="text-sm text-slate-600">
                        {form.likertLowLabel} <span className="text-slate-300">&harr;</span> {form.likertHighLabel}
                        {form.likertReverseScored && <span className="ml-2 text-xs font-semibold text-amber-600">(reverse scored)</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {likertLabels.map((label) => (
                            <span key={label} className={adminTheme.badge.neutral}>
                                {label}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400">Self-report scale — no correct answer.</p>
                </div>
            )}

            {(form.questionType === "SHORT_TEXT" || form.questionType === "INTEGER" || form.questionType === "DECIMAL") && (
                <div className="mt-4 grid grid-cols-1 gap-5 sm:max-w-md sm:grid-cols-2">
                    <SummaryRow label="Expected Answer">{form.expectedAnswer || "\u2014"}</SummaryRow>
                    {form.questionType !== "SHORT_TEXT" && (
                        <SummaryRow label="Acceptable Range">
                            {Number(form.acceptableRange) > 0 ? `\u00b1${form.acceptableRange}` : "Exact match"}
                        </SummaryRow>
                    )}
                </div>
            )}

            {form.questionType === "LONG_TEXT" && (
                <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Grading Rubric</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{form.rubric || <span className="italic text-slate-400">No rubric notes added.</span>}</p>
                </div>
            )}

            {form.questionType === "RANK_ORDER" && (
                <ol className="mt-4 space-y-2">
                    {form.rankItems.map((item, index) => (
                        <li key={index} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                {index + 1}
                            </span>
                            {item}
                        </li>
                    ))}
                </ol>
            )}

            {form.questionType === "MATCH_THE_FOLLOWING" && (
                <div className="mt-4 space-y-2">
                    {form.matchPairs.map((pair, index) => (
                        <div key={pair.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                            <span className="w-5 shrink-0 text-xs font-bold text-slate-400">{index + 1}</span>
                            <span className="flex-1 font-medium text-slate-900">{pair.left || "\u2014"}</span>
                            <GitCompare className="h-4 w-4 shrink-0 text-slate-300" />
                            <span className="flex-1 text-slate-700">{pair.right || "\u2014"}</span>
                        </div>
                    ))}
                </div>
            )}

            {form.questionType === "MATRIX" && (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="border-b border-slate-200 p-2 text-left text-xs font-semibold uppercase text-slate-400"></th>
                                {form.matrixCols.map((col) => (
                                    <th key={col} className="border-b border-slate-200 p-2 text-center text-xs font-semibold uppercase text-slate-400">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {form.matrixRows.map((row) => (
                                <tr key={row}>
                                    <td className="border-b border-slate-100 p-2 font-medium text-slate-700">{row}</td>
                                    {form.matrixCols.map((col) => (
                                        <td key={col} className="border-b border-slate-100 p-2 text-center text-slate-300">
                                            <Circle className="mx-auto h-3.5 w-3.5" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {form.questionType === "SLIDER" && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>{form.sliderMin}</span>
                        <span>{form.sliderMax}</span>
                    </div>
                    <div className="relative mt-2 h-1.5 rounded-full bg-slate-100">
                        <div
                            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-slate-900"
                            style={{
                                left: `${((form.sliderDefault - form.sliderMin) / (form.sliderMax - form.sliderMin || 1)) * 100}%`,
                            }}
                        />
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                        Step {form.sliderStep} &middot; Default value {form.sliderDefault}
                    </p>
                </div>
            )}
        </div>
    );
};

// ---- Page -------------------------------------------------------------

const ViewQuestion = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const params = useParams();
    const questionId = params.questionId ?? params.id;

    const { subsections, subsectionsLoading } = useSelector((state) => state.subsection);
    const { selectedQuestion, getQuestionByIdLoading, getQuestionByIdError } = useSelector((state) => state.question);
    const { grades, gradesLoading } = useSelector((state) => state.grade);

    useEffect(() => {
        dispatch(getQuestionById(questionId));
        dispatch(fetchSubsections());
        dispatch(fetchGrades());
        return () => dispatch(resetSelectedQuestion());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionId]);

    const availableSubsections = subsections || [];

    const availableGrades = useMemo(() => {
        let list = [];
        if (Array.isArray(grades)) list = grades;
        else if (grades && Array.isArray(grades.data)) list = grades.data;
        else if (grades && grades.results && Array.isArray(grades.results.data)) list = grades.results.data;

        return list.map((g) => ({
            id: g.id,
            name: g.grade_name ?? g.name ?? String(g.id),
            code: g.grade_code ?? g.code,
            status: g.status,
        }));
    }, [grades]);

    const isLoading = getQuestionByIdLoading || subsectionsLoading || gradesLoading || !selectedQuestion;

    const form = useMemo(() => mapQuestionToForm(selectedQuestion), [selectedQuestion]);
    const activeSubsection = availableSubsections.find((s) => String(s.id) === String(form.subsectionId));
    const questionCode = selectedQuestion?.question_code ?? questionId;
    const status = selectedQuestion?.question_status === "DRAFT"
        ? "DRAFT"
        : "PUBLISHED";
    const isPromptEmpty = !form.prompt || form.prompt === "<br>" || form.prompt === "<p></p>";

    const handleBack = () => {
        if (window.history.state?.idx > 0) navigate(-1);
        else navigate("/s-admin/question-library");
    };

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

    if (isLoading) {
        return (
            <div className={cn("flex min-h-screen items-center justify-center gap-2 text-slate-400", adminTheme.surface.page)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading question...
            </div>
        );
    }

    return (
        <div className={cn("min-h-screen", adminTheme.surface.page)}>
            <style>{RTE_STYLES}</style>

            <header className={cn("sticky top-0 z-50 border-b bg-white", adminTheme.border.default)}>
                <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-4">
                        <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Library
                        </button>
                        <span className="font-mono text-sm text-slate-400">{questionCode}</span>
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider", STATUS_META[status].badge)}>
                            {STATUS_META[status].label}
                        </span>
                    </div>

                    {status === "DRAFT" && (
                        <button
                            type="button"
                            onClick={() => navigate(`/s-admin/edit-question/${questionId}`)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Question
                        </button>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                            <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <SummaryRow label="Subsection">{activeSubsection?.name ?? "\u2014"}</SummaryRow>
                                <SummaryRow label="Language">{form.language}</SummaryRow>
                                <SummaryRow label="Grade Level(s)">
                                    {form.gradeIds
                                        .map((id) => availableGrades.find((g) => String(g.id) === String(id))?.name)
                                        .filter(Boolean)
                                        .join(", ") || "\u2014"}
                                </SummaryRow>
                                <SummaryRow label="Difficulty">
                                    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium uppercase", DIFFICULTY_META[form.difficulty].badge)}>
                                        {DIFFICULTY_LABEL[form.difficulty]}
                                    </span>
                                </SummaryRow>
                                <SummaryRow label="Expected Time">{form.expectedTimeSeconds}s</SummaryRow>

                            </div>
                        </div>

                        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                            <h2 className="text-lg font-semibold text-slate-900">Question Prompt</h2>
                            {isPromptEmpty ? (
                                <p className="mt-4 text-sm text-slate-400">No prompt content.</p>
                            ) : (
                                <div className="rte-content mt-4 text-sm leading-relaxed text-slate-900" dangerouslySetInnerHTML={{ __html: form.prompt }} />
                            )}
                            {(form.supportingImage || form.supportingMediaUrl) && (
                                <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                                    {form.supportingImage && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            {form.supportingImage}
                                        </span>
                                    )}
                                    {form.supportingMediaUrl && <span>Media: {form.supportingMediaUrl}</span>}
                                </div>
                            )}
                        </div>

                        <AnswerDetailCard form={form} />

                        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                            <h2 className="text-lg font-semibold text-slate-900">Scoring & Weightage</h2>
                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <SummaryRow label="Correct Mark(s)">{Number(form.points).toFixed(1)}</SummaryRow>
                                <SummaryRow label="Negative Mark(s)">{Number(form.negativeMarks).toFixed(1)}</SummaryRow>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                        <LivePreviewCard form={form} activeSubsection={activeSubsection} gradeOptions={availableGrades} />
                        <MetadataInsightCard form={form} gradeOptions={availableGrades} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewQuestion;