import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Circle, Info, Image as ImageIcon, Video, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { OPTION_BASED_TYPES, QUESTION_TYPE_META, DIFFICULTY_LABEL, RTE_STYLES } from "../CreateQuestion";

// ---- Step 4: Review --------------------------------------------------------

const SummaryRow = ({ label, children }) => (
    <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-1.5 text-sm font-semibold text-slate-900">{children}</div>
    </div>
);

const ChecklistItem = ({ title, description, isComplete }) => (
    <div className="flex items-start gap-3">
        {isComplete ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />}
        <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        </div>
    </div>
);

// ---- Supporting media summary ---------------------------------------------
// Mirrors the preview logic in LivePreviewCard (CreateQuestion.jsx): handles
// a freshly-uploaded File object (Dropzone) as well as a persisted URL
// string hydrated from the API in edit mode (mapQuestionToForm).
// Kept compact (small thumbnails, tight gaps) so it sits directly under the
// prompt instead of opening a big vertical gap before it.

const isLikelyImageUrl = (value) =>
    typeof value === "string" && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value.trim());

const isLikelyVideoUrl = (value) =>
    (typeof value === "string" && /\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(value.trim())) ||
    (typeof value === "string" && /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(value.trim()));

const SupportingMediaSummary = ({ form }) => {
    const imagePreviewSrc = useMemo(() => {
        if (form.supportingImage instanceof File) return URL.createObjectURL(form.supportingImage);
        if (typeof form.supportingImage === "string" && isLikelyImageUrl(form.supportingImage)) return form.supportingImage;
        return null;
    }, [form.supportingImage]);

    const videoPreviewSrc = useMemo(() => {
        if (form.supportingMedia instanceof File) return URL.createObjectURL(form.supportingMedia);
        if (typeof form.supportingMediaUrl === "string" && form.supportingMediaUrl.trim()) return form.supportingMediaUrl;
        if (typeof form.supportingMedia === "string" && isLikelyVideoUrl(form.supportingMedia)) return form.supportingMedia;
        return null;
    }, [form.supportingMedia, form.supportingMediaUrl]);

    const imageFileName = form.supportingImage instanceof File ? form.supportingImage.name : form.supportingImage;
    const mediaFileName = form.supportingMedia instanceof File ? form.supportingMedia.name : form.supportingMedia;

    const hasImage = Boolean(form.supportingImage);
    const hasMedia = Boolean(form.supportingMedia || form.supportingMediaUrl);

    if (!hasImage && !hasMedia) return null;

    return (
        <div className="mt-3 flex flex-wrap gap-3">
            {hasImage && (
                <div className="flex w-48 items-center gap-2.5 overflow-hidden rounded-lg border border-slate-200 p-1.5">
                    {imagePreviewSrc ? (
                        <img src={imagePreviewSrc} alt="Supporting media preview" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                    ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                            <ImageIcon className="h-4 w-4" />
                        </span>
                    )}
                    <span className="truncate text-xs font-medium text-slate-600">{imageFileName}</span>
                </div>
            )}

            {hasMedia && (
                <div className="flex w-56 items-center gap-2.5 overflow-hidden rounded-lg border border-slate-200 p-1.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                        <Video className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 items-center gap-1 truncate text-xs font-medium text-slate-600">
                        {form.supportingMediaUrl && <LinkIcon className="h-3 w-3 shrink-0" />}
                        {mediaFileName || form.supportingMediaUrl}
                    </span>
                </div>
            )}
        </div>
    );
};

const Review = ({ form, questionCode, activeSubsection, gradeOptions, onGoToStep, isEditMode }) => {
    const grades = gradeOptions || [];
    const isPromptEmpty = !form.prompt || form.prompt === "<br>" || form.prompt === "<p></p>";
    const isOptionsType = OPTION_BASED_TYPES.includes(form.questionType);
    const correctOptionCount = form.options.filter((opt) => opt.isCorrect).length;
    const gradeNames =
        form.gradeIds
            .map((id) => grades.find((g) => String(g.id) === String(id))?.name)
            .filter(Boolean)
            .join(", ") || "None selected";

    const checklist = [
        {
            title: "Basic Information",
            description: form.subsectionId && form.gradeIds.length ? "Subsection and grade(s) set." : "Subsection or grade level missing.",
            deployLabel: (
                <>
                    Mapped to <strong>{activeSubsection?.name}</strong>, grades <strong>{gradeNames}</strong>.
                </>
            ),
            isComplete: Boolean(form.subsectionId && form.gradeIds.length),
        },
        {
            title: "Question Prompt",
            description: isPromptEmpty ? "Add the question prompt text." : "Prompt content added.",
            deployLabel: (
                <>
                    Item ID <strong>{questionCode}</strong> validated.
                </>
            ),
            isComplete: !isPromptEmpty,
        },
        {
            title: "Answer Configuration",
            description: form.questionType ? `Configured as ${QUESTION_TYPE_META[form.questionType].label}.` : "Choose a question type.",
            deployLabel: isOptionsType ? (
                <>
                    <strong>{QUESTION_TYPE_META[form.questionType].label}</strong> configuration verified with{" "}
                    <strong>
                        {correctOptionCount} correct answer{correctOptionCount === 1 ? "" : "s"}
                    </strong>
                    .
                </>
            ) : (
                <>
                    <strong>{form.questionType ? QUESTION_TYPE_META[form.questionType].label : "Question type"}</strong> configuration verified.
                </>
            ),
            isComplete: Boolean(form.questionType),
        },
        {
            title: "Scoring & Weightage",
            description: `Correct: ${Number(form.points).toFixed(1)}, Negative: ${Number(form.negativeMarks).toFixed(1)}.`,
            deployLabel: (
                <>
                    Scoring set to <strong>{Number(form.points).toFixed(1)} correct</strong> /{" "}
                    <strong>{Number(form.negativeMarks).toFixed(1)} negative</strong>.
                </>
            ),
            isComplete: true,
        },
    ];
    const isReady = checklist.every((item) => item.isComplete);

    return (
        <div className="space-y-6">
            <style>{RTE_STYLES}</style>
            <div className={cn("flex items-start gap-4 rounded-xl border p-5", isReady ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50")}>
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", isReady ? "bg-emerald-500 text-white" : "bg-amber-400 text-white")}>
                    {isReady ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                </span>
                <div>
                    <h2 className={cn("text-lg font-semibold", isReady ? "text-emerald-900" : "text-amber-900")}>
                        {isReady
                            ? isEditMode
                                ? "Question Ready to Save"
                                : "Question Ready to Publish"
                            : "A Few Things Need Attention"}
                    </h2>
                    <p className={cn("mt-1 text-sm", isReady ? "text-emerald-800/80" : "text-amber-800/80")}>
                        {isReady
                            ? isEditMode
                                ? "Everything looks great \u2014 your changes are ready to save."
                                : "Everything looks great \u2014 this question is ready to go into the library."
                            : "Review the checklist on the right before publishing."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Question Summary</p>
                            <button type="button" onClick={() => onGoToStep(1)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                Edit Setup
                            </button>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <SummaryRow label="Question Code">{questionCode}</SummaryRow>
                            <SummaryRow label="Subsection">{activeSubsection?.name}</SummaryRow>
                            <SummaryRow label="Grade Level(s)">{gradeNames}</SummaryRow>
                            <SummaryRow label="Difficulty">{DIFFICULTY_LABEL[form.difficulty]}</SummaryRow>
                            <SummaryRow label="Language">{form.language}</SummaryRow>
                        </div>

                      {/* Prompt + media kept in their own tight stack, outside the
                            5-gap metadata grid above, so there's no inherited row gap
                            between them. */}
                        <div className="mt-5 border-t border-slate-100 pt-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prompt</p>
                            {isPromptEmpty ? (
                                <p className="mt-1.5 text-sm italic text-slate-400">No prompt added.</p>
                            ) : (
                                <div
                                    className="rte-content mt-1.5 text-sm font-normal leading-relaxed text-slate-700"
                                    style={{ minHeight: 0 }}
                                    dangerouslySetInnerHTML={{ __html: form.prompt }}
                                />
                            )}
                            <SupportingMediaSummary form={form} />
                        </div>
                    </div>

                    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Answer Configuration</p>
                            <button type="button" onClick={() => onGoToStep(2)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                Edit Configuration
                            </button>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                            <SummaryRow label="Question Type">{form.questionType ? QUESTION_TYPE_META[form.questionType].label : "Not set"}</SummaryRow>
                        </div>
                    </div>

                    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Scoring & Weightage</p>
                            <button type="button" onClick={() => onGoToStep(3)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                Edit Scoring
                            </button>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <SummaryRow label="Correct Mark(s)">{Number(form.points).toFixed(1)}</SummaryRow>
                            <SummaryRow label="Negative Mark(s)">{Number(form.negativeMarks).toFixed(1)}</SummaryRow>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                        <p className="text-base font-semibold text-slate-900">Publish Checklist</p>
                        <div className="mt-5 space-y-4">
                            {checklist.map((item) => (
                                <ChecklistItem key={item.title} title={item.title} description={item.description} isComplete={item.isComplete} />
                            ))}
                        </div>
                    </div>

                    <div className={cn(adminTheme.callout.base)}>
                        <p className={cn(adminTheme.callout.title)}>
                            <Info className="h-4 w-4" />
                            {isEditMode ? "Ready to Save?" : "Ready to Add?"}
                        </p>
                        <p className={cn(adminTheme.callout.body)}>
                            {isEditMode
                                ? "Saving will update this question wherever it's already used in the shared Question Library."
                                : "Once published, this question becomes available in the shared Question Library for use across assessments."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-slate-900 text-white">
                <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-2">
                    <div>
                        <h2 className="text-2xl font-bold">{isEditMode ? "Ready to Save Changes?" : "Ready to Publish?"}</h2>
                        <div className="mt-5 space-y-3">
                            {checklist.map((item) => (
                                <div key={item.title} className="flex items-start gap-2.5 text-sm">
                                    {item.isComplete ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
                                    <span className="text-slate-200">{item.deployLabel}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl bg-white/5 p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                {isEditMode ? "Update in Repository" : "Publish to Repository"}
                            </p>
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Live Sync</span>
                        </div>
                        <div className="mt-5 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Scheduled Date</span>
                                <span className="font-semibold">Immediate</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Subsection</span>
                                <span className="font-semibold">{activeSubsection?.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Question Bank</span>
                                <span className="font-semibold">Aptitude Library</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Review;