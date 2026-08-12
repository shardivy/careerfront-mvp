import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { FieldLabel, TextInput, DateInput, Checkbox } from "./WizardFormFields";

// ---------------------------------------------------------------------------
// Step 2: Version Settings (assessment_versions)
// Rendered by CreateAssessment.jsx when currentStep === 2.
// ---------------------------------------------------------------------------

const VersionSettingsStep = ({ form, onFieldChange, validationErrors = {} }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <h2 className="text-base font-semibold text-slate-900">Version Settings</h2>

    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <FieldLabel required>Version Number</FieldLabel>
        <TextInput
          id="versionNumber"
          value={form.versionNumber}
          onChange={(e) => onFieldChange("versionNumber", e.target.value)}
          placeholder="V1.0"
          error={validationErrors["assessment_version.version_number"]}
        />
      </div>
      <div>
        <FieldLabel>Version Name</FieldLabel>
        <TextInput
          id="versionName"
          value={form.versionName}
          onChange={(e) => onFieldChange("versionName", e.target.value)}
          placeholder="2026 Edition"
        />
      </div>
      <div>
        <FieldLabel required>Effective From</FieldLabel>
        <DateInput
          id="effectiveFrom"
          value={form.effectiveFrom}
          onChange={(e) => onFieldChange("effectiveFrom", e.target.value)}
          error={validationErrors["assessment_version.effective_from"]}
        />
      </div>
      <div>
        <FieldLabel>Effective To</FieldLabel>
        <DateInput
          id="effectiveTo"
          value={form.effectiveTo}
          onChange={(e) => onFieldChange("effectiveTo", e.target.value)}
        />
      </div>
    </div>

    <div className="mt-5">
      <FieldLabel>Candidate Instructions</FieldLabel>
      <textarea
        id="instructions"
        rows={3}
        value={form.instructions}
        onChange={(e) => onFieldChange("instructions", e.target.value)}
        placeholder="Shown to the candidate before they start this version, e.g. 'Read each question carefully.'"
        className={cn(
          "w-full resize-none text-sm",
          adminTheme.radius.md,
          adminTheme.border.default,
          "border px-3 py-2.5 text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        )}
      />
    </div>

    <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
      <div>
        <p className={cn(adminTheme.nav.groupLabel, "mb-4")}>Runtime Behavior</p>
        <div className="space-y-4">
          <Checkbox
            id="allowResume"
            checked={form.allowResume}
            onChange={(e) => onFieldChange("allowResume", e.target.checked)}
            title="Allow resume"
            description="Candidate can resume an interrupted attempt."
          />
          <Checkbox
            id="allowReview"
            checked={form.allowReview}
            onChange={(e) => onFieldChange("allowReview", e.target.checked)}
            title="Allow review before submission"
            description="Candidate can revisit answers before submitting."
          />
          <Checkbox
            id="randomizeSections"
            checked={form.randomizeSections}
            onChange={(e) => onFieldChange("randomizeSections", e.target.checked)}
            title="Randomize sections"
            description="Shuffle section order per candidate."
          />
          <Checkbox
            id="randomizeQuestions"
            checked={form.randomizeQuestions}
            onChange={(e) => onFieldChange("randomizeQuestions", e.target.checked)}
            title="Randomize questions"
            description="Shuffle question order within each section."
          />
        </div>
      </div>

      <div>
        <p className={cn(adminTheme.nav.groupLabel, "mb-4")}>Reporting</p>
        <div className="space-y-4">
          <Checkbox
            id="showResultImmediately"
            checked={form.showResultImmediately}
            onChange={(e) => onFieldChange("showResultImmediately", e.target.checked)}
            title="Show result immediately"
            description="Display pass/fail status to candidate after submission."
          />
        </div>
      </div>
    </div>
  </div>
);

export default VersionSettingsStep;