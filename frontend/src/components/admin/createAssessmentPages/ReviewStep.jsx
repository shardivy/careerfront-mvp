import { Pencil, AlertTriangle, Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { GRADE_LABELS } from "./GradeMappingStep";

// ---------------------------------------------------------------------------
// Step 6: Review & Publish
//
// Pulled out of CreateAssessment.jsx so it lives alongside the other wizard
// steps (StructureStep, QuestionMappingStep, GradeMappingStep,
// VersionSettingsStep). CreateAssessment renders this directly, passing in
// the live wizard state plus a couple of handlers (onGoToStep, onPublish).
//
// `assessmentTypeLabels` is passed in from CreateAssessment.jsx (built from
// its local ASSESSMENT_TYPES list) rather than duplicated here, so the two
// files stay in sync without a circular import.
// ---------------------------------------------------------------------------

const ReadyToPublishBanner = ({ isReady }) => (
  <div
    className={cn(
      "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium",
      isReady ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
    )}
  >
    {isReady ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
    {isReady ? "This assessment is ready to publish." : "A few things still need attention before publishing."}
  </div>
);

const SummaryRow = ({ label, children }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <div className="mt-1 text-sm font-medium text-slate-900">{children}</div>
  </div>
);

const AssessmentDetailsSummaryCard = ({ form, assessmentTypeLabels, onEdit }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-slate-900">Assessment Details</h3>
      <button type="button" onClick={onEdit} className={adminTheme.actionButton.secondary}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
      <SummaryRow label="Name">{form.name || "Untitled Assessment"}</SummaryRow>
      <SummaryRow label="Short Name">{form.shortName || "—"}</SummaryRow>
      <SummaryRow label="Type">
        {form.type ? (
          <span className={adminTheme.badge.neutral}>{assessmentTypeLabels[form.type]}</span>
        ) : (
          <span className="text-sm font-normal text-slate-400">Not set</span>
        )}
      </SummaryRow>
      <SummaryRow label="Language">{form.language}</SummaryRow>
    </div>
  </div>
);

const VersionSettingsSummaryCard = ({ form, onEdit }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-slate-900">Version Settings</h3>
      <button type="button" onClick={onEdit} className={adminTheme.actionButton.secondary}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
      <SummaryRow label="Version">{form.versionNumber || "—"}</SummaryRow>
      <SummaryRow label="Version Name">{form.versionName || "—"}</SummaryRow>
      <SummaryRow label="Effective From">{form.effectiveFrom || "—"}</SummaryRow>
      <SummaryRow label="Effective To">{form.effectiveTo || "—"}</SummaryRow>
    </div>
  </div>
);

const GradeMappingSummaryCard = ({ grades, onEdit }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-slate-900">Grade & Board Mapping</h3>
      <button type="button" onClick={onEdit} className={adminTheme.actionButton.secondary}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
    </div>

    <div className="mt-4 divide-y divide-slate-100">
      {grades.map((grade) => (
        <div key={grade.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {GRADE_LABELS[grade.grade] || "Untitled Grade"}
              {grade.isDefault && <span className={cn(adminTheme.badge.neutral, "ml-2 align-middle")}>Default</span>}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {grade.board} &middot; Ages {grade.minimumAge}–{grade.maximumAge}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StructureTimingCard = ({ sections, onEdit }) => {
  const totalSubsections = sections.reduce((sum, section) => sum + section.subsections.length, 0);
  const totalQuestionLimit = sections.reduce(
    (sum, section) => sum + section.subsections.reduce((subSum, sub) => subSum + (Number(sub.questionLimit) || 0), 0),
    0
  );

  return (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Structure & Timing</h3>
        <button type="button" onClick={onEdit} className={adminTheme.actionButton.secondary}>
          <Pencil className="h-3.5 w-3.5" />
          Edit Structure
        </button>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {sections.map((section, index) => (
          <div key={section.id} className="flex items-center gap-4 py-4 first:pt-0">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold text-slate-400",
                adminTheme.radius.md,
                "bg-slate-50"
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{section.name}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {section.subsections.length} Subsections &middot; Up to{" "}
                {section.subsections.reduce((sum, sub) => sum + (Number(sub.questionLimit) || 0), 0)} Questions
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-slate-900">{section.timeLimitMinutes} Mins</span>
          </div>
        ))}
      </div>

      <div className={cn("mt-4 flex items-center justify-between border-t pt-4", adminTheme.border.default)}>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {sections.length} Sections &middot; {totalSubsections} Subsections
        </span>
        <span className="text-base font-bold text-slate-900">Up to {totalQuestionLimit} Questions</span>
      </div>
    </div>
  );
};

// Per-subsection mapped-vs-limit counts, shown on Review so a gap in Step 5
// is visible without having to reopen the structure tree.
const QuestionMappingSummaryCard = ({ sections, blueprintItems, onEdit }) => {
  const countsBySubsection = blueprintItems.reduce((acc, item) => {
    acc[item.subsectionId] = (acc[item.subsectionId] ?? 0) + 1;
    return acc;
  }, {});

  const rows = sections.flatMap((section) =>
    section.subsections.map((sub) => ({
      sectionName: section.name,
      subsectionName: sub.name,
      id: sub.id,
      mapped: countsBySubsection[sub.id] ?? 0,
      limit: Number(sub.questionLimit) || 0,
    }))
  );

  return (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Question Mapping</h3>
        <button type="button" onClick={onEdit} className={adminTheme.actionButton.secondary}>
          <Pencil className="h-3.5 w-3.5" />
          Edit Mapping
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No subsections to map yet — add structure in Step 4 first.</p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {rows.map((row) => {
            const isComplete = row.limit > 0 && row.mapped >= row.limit;
            return (
              <div key={row.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{row.subsectionName || "Untitled Subsection"}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{row.sectionName}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                    isComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}
                >
                  {row.mapped}/{row.limit}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ChecklistItem = ({ title, description, isComplete, isOptional }) => (
  <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
    {isComplete ? (
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
    ) : (
      <Circle className={cn("mt-0.5 h-4 w-4 shrink-0", isOptional ? "text-slate-300" : "text-amber-500")} />
    )}
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-900">
        {title}
        {isOptional && <span className="ml-1.5 text-xs font-normal text-slate-400">(Optional)</span>}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{description}</p>
    </div>
  </div>
);

const LaunchChecklistCard = ({ checklist }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <h3 className="text-base font-semibold text-slate-900">Launch Checklist</h3>
    <div className="mt-2 divide-y divide-slate-100">
      {checklist.map((item) => (
        <ChecklistItem key={item.title} {...item} />
      ))}
    </div>
  </div>
);

// Surfaces the flat field-path -> message map from validateAssessmentPayload
// whenever a publish attempt was blocked. Purely presentational — the state
// living in CreateAssessment decides when this is populated / cleared.
const ValidationErrorsBanner = ({ errors }) => {
  const messages = Object.values(errors);
  if (!messages.length) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Fix {messages.length} {messages.length === 1 ? "issue" : "issues"} before publishing
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-red-600">
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

// Publish button now respects two independent gates: the launch checklist
// (isReady) and whether a publish request is currently in flight
// (isPublishing, driven by state.assessment.loading). Either one disables
// it, and the label/spinner reflect which state we're in so a slow network
// doesn't invite a second click.
const ReadyToLaunchCard = ({ isReady, isPublishing, onPublish }) => {
  const isDisabled = !isReady || isPublishing;

  return (
    <div className={cn(adminTheme.callout.base, "p-5")}>
      <h3 className="text-base font-semibold text-slate-900">Ready to Launch?</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        Once published, this assessment version will be available for candidate assignments. Grade mapping,
        structure, and question mapping will be locked.
      </p>
      <button
        type="button"
        onClick={onPublish}
        disabled={isDisabled}
        className={cn(adminTheme.callout.button, isDisabled && adminTheme.callout.buttonDisabled)}
      >
        {isPublishing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Publishing...
          </>
        ) : (
          "Publish Version"
        )}
      </button>
    </div>
  );
};

const ReviewStep = ({
  form,
  grades,
  sections,
  blueprintItems,
  isPublishing,
  validationErrors,
  assessmentTypeLabels,
  onGoToStep,
  onPublish,
}) => {
  const totalQuestionLimit = sections.reduce(
    (sum, s) => sum + s.subsections.reduce((subSum, sub) => subSum + (Number(sub.questionLimit) || 0), 0),
    0
  );
  const isQuestionMappingComplete = totalQuestionLimit > 0 && blueprintItems.length >= totalQuestionLimit;

  const checklist = [
    {
      title: "Assessment Details",
      description: form.name && form.type ? "Name and type are all set." : "Name or type is missing.",
      isComplete: Boolean(form.name && form.type),
    },
    {
      title: "Version Settings",
      description: "Duration, qualifying score, and effective date set.",
      isComplete: Boolean(form.duration && form.effectiveFrom),
    },
    {
      title: "Grade & Board Mapping",
      description: grades.length > 0 ? "At least one grade mapping is configured." : "Add at least one grade mapping.",
      isComplete: grades.length > 0,
    },
    {
      title: "Section Hierarchy",
      description: sections.length > 0 ? "Valid structure with timings." : "Add at least one section.",
      isComplete: sections.length > 0,
    },
    {
      title: "Question Bank Mapping",
      description: isQuestionMappingComplete
        ? "Every subsection has reached its question limit."
        : `${blueprintItems.length}/${totalQuestionLimit} questions mapped across all subsections.`,
      isComplete: isQuestionMappingComplete,
    },
    {
      title: "Candidate Instructions",
      description: form.instructions ? "Candidate-facing instructions added." : "Optional: no candidate instructions added yet.",
      isComplete: Boolean(form.instructions),
      isOptional: true,
    },
  ];

  const isReady = checklist.filter((item) => !item.isOptional).every((item) => item.isComplete);

  return (
    <div className="space-y-6">
      <ReadyToPublishBanner isReady={isReady} />
      <ValidationErrorsBanner errors={validationErrors} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AssessmentDetailsSummaryCard form={form} assessmentTypeLabels={assessmentTypeLabels} onEdit={() => onGoToStep(1)} />
          <VersionSettingsSummaryCard form={form} onEdit={() => onGoToStep(2)} />
          <GradeMappingSummaryCard grades={grades} onEdit={() => onGoToStep(3)} />
          <StructureTimingCard sections={sections} onEdit={() => onGoToStep(4)} />
          <QuestionMappingSummaryCard sections={sections} blueprintItems={blueprintItems} onEdit={() => onGoToStep(5)} />
        </div>

        <div className="space-y-6">
          <LaunchChecklistCard checklist={checklist} />
          <ReadyToLaunchCard isReady={isReady} isPublishing={isPublishing} onPublish={onPublish} />
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;