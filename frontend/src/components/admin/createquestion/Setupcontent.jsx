import { useState } from "react";
import { AlertTriangle, Loader2, UploadCloud, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import {
    DIFFICULTIES,
    DIFFICULTY_LABEL,
    DIFFICULTY_META,
    LANGUAGES,
    QUESTION_TYPES,
    QUESTION_TYPE_META,
    FieldLabel,
    TextInput,
    NumberInput,
    SelectInput,
    MultiSelectChips,
    Dropzone,
    RichTextEditor,
} from "../CreateQuestion";

// ---- Step 1: Setup & Content -------------------------------------------

// Single flat Subsection picker. This replaces the old Assessment Version ->
// Section -> Subsection cascade: a question's subsection_id is a required
// FK, but the Version/Section pickers have been removed from this wizard, so
// Dimension is still inherited from the selected subsection while Section /
// Assessment Version are no longer collected here at all.
const SubsectionSelector = ({ form, onSubsectionChange, options, subsectionsLoading, subsectionsError }) => {
    return (
        <div>
            <FieldLabel required>Subsection</FieldLabel>
            {subsectionsLoading ? (
                <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading subsections...
                </p>
            ) : subsectionsError ? (
                <p className="text-xs text-red-500">Couldn&apos;t load subsections. Please refresh and try again.</p>
            ) : !options || options.length === 0 ? (
                <p className="text-xs text-slate-400">No subsections available yet.</p>
            ) : (
                <SelectInput
                    value={form.subsectionId || ""}
                    onChange={(e) => onSubsectionChange(e.target.value)}
                    options={options}
                    labelKey="name"
                    valueKey="id"
                />
            )}
        </div>
    );
};

const BasicInformationCard = ({
    form,
    questionCode,
    onFieldChange,
    onSubsectionChange,
    options,
    subsectionsLoading,
    subsectionsError,
    gradeOptions,
    gradesLoading,
    gradesError,
}) => (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
        <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
       <p className={cn(adminTheme.card.subtitle, "mt-1")}>
  Select the appropriate grade, subsection, and question details.
</p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
                <FieldLabel required>Question Code</FieldLabel>

                <TextInput
                    id="questionCode"
                    value={questionCode}
                    readOnly
                />
            </div>
            <div>
                <FieldLabel required>Language</FieldLabel>
                <SelectInput id="language" value={form.language} onChange={(e) => onFieldChange("language", e.target.value)} options={LANGUAGES} />
            </div>
        </div>

        <div className="mt-5">
            <SubsectionSelector
                form={form}
                onSubsectionChange={onSubsectionChange}
                options={options}
                subsectionsLoading={subsectionsLoading}
                subsectionsError={subsectionsError}
            />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
                <FieldLabel required>Grade Level(s)</FieldLabel>
                {gradesLoading ? (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading grades...
                    </p>
                ) : gradesError ? (
                    <p className="text-xs text-red-500">Couldn&apos;t load grades. Please refresh and try again.</p>
                ) : !gradeOptions || gradeOptions.length === 0 ? (
                    <p className="text-xs text-slate-400">No grades available yet.</p>
                ) : (
                    <MultiSelectChips
                        options={gradeOptions}
                        selectedIds={form.gradeIds}
                        onToggle={(id) =>
                            onFieldChange(
                                "gradeIds",
                                form.gradeIds.includes(id) ? form.gradeIds.filter((g) => g !== id) : [...form.gradeIds, id]
                            )
                        }
                    />
                )}
<p className="mt-1.5 text-xs text-slate-400">Select one or more grades for this question.</p>
            </div>

            <div>
                <FieldLabel>Expected Time (seconds)</FieldLabel>
                <NumberInput
                    id="expectedTimeSeconds"
                    min={5}
                    step={5}
                    value={form.expectedTimeSeconds}
                    onChange={(e) => onFieldChange("expectedTimeSeconds", Number(e.target.value))}
                />
            </div>

            <div className="sm:col-span-2">
                <FieldLabel required>Difficulty Level</FieldLabel>
                <div className="grid grid-cols-3 gap-2 sm:w-96">
                    {DIFFICULTIES.map((level) => {
                        const isSelected = form.difficulty === level;
                        return (
                            <button
                                key={level}
                                type="button"
                                onClick={() => onFieldChange("difficulty", level)}
                                className={cn(
                                    "h-11 rounded-lg border text-xs font-bold uppercase tracking-wider transition",
                                    isSelected ? DIFFICULTY_META[level].ring : "border-slate-200 text-slate-400 hover:border-slate-300"
                                )}
                            >
                                {DIFFICULTY_LABEL[level]}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
);

// Standalone Question Type picker — shown in Step 1 (Setup & Content),
// before the Question Content card, so the rest of the wizard (options,
// scoring, review) can be scoped to the chosen type from the start.
const QuestionTypeSelector = ({ form, onFieldChange }) => (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Select Question Type
                    <span className={cn(adminTheme.text.danger, "ml-0.5")}>*</span>
                </h2>
             <p className={cn(adminTheme.card.subtitle, "mt-1")}>Select a question type to display the relevant fields and options.</p>   
            </div>
            {!form.questionType && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Required
                </span>
            )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {QUESTION_TYPES.map((type) => {
                const meta = QUESTION_TYPE_META[type];
                const Icon = meta.icon;
                const isSelected = form.questionType === type;
                return (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onFieldChange("questionType", type)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 px-4 py-6 text-center transition",
                            isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                        )}
                    >
                        <Icon className={cn("h-6 w-6", isSelected ? "text-slate-900" : "text-slate-400")} />
                        <span className={cn("text-xs font-bold uppercase tracking-wider", isSelected ? "text-slate-900" : "text-slate-500")}>
                            {meta.label}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

// Only one supporting media source is allowed at a time
const QuestionContentCard = ({ form, resetKey, onFieldChange }) => {
    const hasImage = Boolean(form.supportingImage);
    const hasVideo = Boolean(form.supportingMedia || form.supportingMediaUrl);

    const handleImageChange = (file) => {
        onFieldChange("supportingImage", file);
        if (file) {
            onFieldChange("supportingMedia", null);
            onFieldChange("supportingMediaUrl", "");
        }
    };

    const handleRemoveImage = () => onFieldChange("supportingImage", null);

    const handleMediaFileChange = (file) => {
        onFieldChange("supportingMedia", file);
        if (file) {
            onFieldChange("supportingImage", null);
            onFieldChange("supportingMediaUrl", "");
        }
    };

    const handleRemoveMediaFile = () => onFieldChange("supportingMedia", null);

    const handleMediaUrlChange = (value) => {
        onFieldChange("supportingMediaUrl", value);
        if (value) {
            onFieldChange("supportingImage", null);
            onFieldChange("supportingMedia", null);
        }
    };

    const handleRemoveMediaUrl = () => onFieldChange("supportingMediaUrl", "");
    

    return (
        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
            <h2 className="text-lg font-semibold text-slate-900">Question Content</h2>
            <p className={cn(adminTheme.card.subtitle, "mt-1")}>
                Add the question and any supporting media.
            </p>
            <div className="mt-6">
                <FieldLabel required>Question Prompt</FieldLabel>
                <RichTextEditor
                    resetKey={resetKey}
                    initialHtml={form.prompt}
                    onChange={(html) => onFieldChange("prompt", html)}
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <FieldLabel>Supporting Image</FieldLabel>
                    <Dropzone
                        icon={UploadCloud}
                        title="Upload Image"
                        subtitle="PNG, JPG up to 5MB"
                        accept="image/png,image/jpeg"
                        fileName={form.supportingImage}
                        onChange={handleImageChange}
                        onRemove={handleRemoveImage}
                    />
                    {hasVideo && (
                        <p className="mt-1.5 text-xs text-slate-400">Uploading an image will remove the attached video/audio.</p>
                    )}
                </div>
                <div>
                    <FieldLabel>Supporting Video/Audio</FieldLabel>
                    <Dropzone
                        icon={Video}
                        title="Attach Media"
                        subtitle="MP4, MP3 file"
                        accept="video/mp4,audio/mp3"
                        fileName={form.supportingMedia}
                        onChange={handleMediaFileChange}
                        onRemove={handleRemoveMediaFile}
                    />
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span className="h-px flex-1 bg-slate-200" />
                        or paste a link
                        <span className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="relative mt-3">
                        <TextInput
                            id="supportingMediaUrl"
                            value={form.supportingMediaUrl}
                            onChange={(e) => handleMediaUrlChange(e.target.value)}
                            placeholder="https://youtube.com/watch?v=... or a direct MP4/MP3 URL"
                        />
                        {form.supportingMediaUrl && (
                            <button
                                type="button"
                                onClick={handleRemoveMediaUrl}
                                aria-label="Remove media link"
                                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    {hasImage && (
                        <p className="mt-1.5 text-xs text-slate-400">Uploading a video/audio file or link will remove the attached image.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// ---- Step 1 wrapper — everything Step 1 needs, composed together ---------

const SetupContent = ({
    form,
    questionCode,
    resetKey,
    onFieldChange,
    onSubsectionChange,
    options,
    subsectionsLoading,
    subsectionsError,
    gradeOptions,
    gradesLoading,
    gradesError,
}) => (
    <>
        <BasicInformationCard
            form={form}
            questionCode={questionCode}
            onFieldChange={onFieldChange}
            onSubsectionChange={onSubsectionChange}
            options={options}
            subsectionsLoading={subsectionsLoading}
            subsectionsError={subsectionsError}
            gradeOptions={gradeOptions}
            gradesLoading={gradesLoading}
            gradesError={gradesError}
        />
        <QuestionTypeSelector form={form} onFieldChange={onFieldChange} />
        <QuestionContentCard form={form} resetKey={resetKey} onFieldChange={onFieldChange} />
    </>
);

export default SetupContent;