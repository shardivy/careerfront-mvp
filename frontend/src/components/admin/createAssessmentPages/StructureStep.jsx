import { useState } from "react";
import { Trash2, Pencil, GripVertical, Plus, Check, Clock, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";

// ---------------------------------------------------------------------------
// Options / constants used only by the Structure step
// ---------------------------------------------------------------------------

// sections.name — predefined section catalog
export const SECTION_NAME_OPTIONS = [
  { value: "", label: "Select Section" },
  { value: "Aptitude", label: "Aptitude" },
];

// subsections.name — predefined subsection catalog
export const SUBSECTION_NAME_OPTIONS = [
  { value: "", label: "Select Subsection" },
  { value: "Logical Reasoning", label: "Logical Reasoning" },
  { value: "Numerical Aptitude", label: "Numerical Aptitude" },
  { value: "Verbal Ability", label: "Verbal Ability" },
  { value: "Spatial Ability", label: "Spatial Ability" },
  { value: "Interest Inventory", label: "Interest Inventory" },
  { value: "Personality Assessment", label: "Personality Assessment" },
  { value: "Custom Section", label: "Custom Section" },
];

// dimensions (referenced by subsections.dimension_id)
export const DIMENSION_OPTIONS = [
  { value: "", label: "No Primary Dimension" },
  { value: "LOGICAL", label: "Logical Reasoning" },
  { value: "NUMERICAL", label: "Numerical Ability" },
  { value: "VERBAL", label: "Verbal Ability" },
  { value: "SPATIAL", label: "Spatial Ability" },
  { value: "REALISTIC", label: "Realistic (Interest)" },
  { value: "INVESTIGATIVE", label: "Investigative (Interest)" },
  { value: "ARTISTIC", label: "Artistic (Interest)" },
  { value: "SOCIAL", label: "Social (Interest)" },
  { value: "ENTERPRISING", label: "Enterprising (Interest)" },
  { value: "CONVENTIONAL", label: "Conventional (Interest)" },
  { value: "OPENNESS", label: "Openness (Personality)" },
  { value: "CONSCIENTIOUSNESS", label: "Conscientiousness (Personality)" },
  { value: "EXTRAVERSION", label: "Extraversion (Personality)" },
  { value: "AGREEABLENESS", label: "Agreeableness (Personality)" },
  { value: "NEUROTICISM", label: "Neuroticism (Personality)" },
];

export const DIMENSION_LABELS = DIMENSION_OPTIONS.reduce((acc, option) => {
  if (option.value) acc[option.value] = option.label;
  return acc;
}, {});

// sections + nested subsections (Step 4 default/seed state)
export const INITIAL_SECTIONS = [
  {
    id: "section-1",
    name: "Logical Reasoning",
    sectionCode: "LOGICAL",
    description: "",
    instructions: "",
    timeLimitMinutes: 20,
    isMandatory: true,
    randomizeQuestions: false,
    subsections: [
      {
        id: "section-1-sub-1",
        name: "Pattern Recognition",
        subsectionCode: "PATTERN",
        dimensionId: "LOGICAL",
        questionLimit: 10,
        description: "Focuses on visual sequences and pattern completion.",
        instructions: "",
      },
      {
        id: "section-1-sub-2",
        name: "Syllogisms & Deduction",
        subsectionCode: "SYLLOGISM",
        dimensionId: "LOGICAL",
        questionLimit: 5,
        description: "Analytical thinking and logical inference.",
        instructions: "",
      },
    ],
  },
  {
    id: "section-2",
    name: "Numerical Aptitude",
    sectionCode: "NUMERICAL",
    description: "",
    instructions: "",
    timeLimitMinutes: 25,
    isMandatory: true,
    randomizeQuestions: false,
    subsections: [],
  },
];

// ---------------------------------------------------------------------------
// Local field atoms.
//
// NOTE: if your project already keeps FieldLabel / TextInput / SelectInput /
// NumberInput / Checkbox in a shared file (they're also used by the other
// wizard steps in CreateAssessment.jsx), delete this block and import them
// from there instead. They're duplicated here only so this file works
// standalone.
// ---------------------------------------------------------------------------

const FieldLabel = ({ children, required }) => (
  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
    {children}
    {required && <span className={cn(adminTheme.text.danger, "ml-0.5")}>*</span>}
  </label>
);

const TextInput = ({ id, value, onChange, placeholder, disabled, required = false, error }) => (
  <div>
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={cn(
        "h-11 w-full text-sm",
        adminTheme.radius.md,
        adminTheme.border.default,
        "border px-3 text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
        disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
        error && "border-red-300 focus:ring-red-200"
      )}
    />
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

const SelectInput = ({ id, value, onChange, options, required = false, error }) => (
  <div>
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className={cn(
        "h-11 w-full text-sm",
        adminTheme.radius.md,
        adminTheme.border.default,
        "border bg-white px-3 text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
        error && "border-red-300 focus:ring-red-200"
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

const NumberInput = ({ id, value, onChange, icon: Icon, suffix, error }) => (
  <div>
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input
        id={id}
        type="number"
        value={value}
        onChange={onChange}
        className={cn(
          "h-11 w-full text-sm",
          adminTheme.radius.md,
          adminTheme.border.default,
          "border text-slate-900",
          Icon ? "pl-9" : "pl-3",
          suffix ? "pr-9" : "pr-3",
          "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
          error && "border-red-300 focus:ring-red-200"
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
          {suffix}
        </span>
      )}
    </div>
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

const Checkbox = ({ id, checked, onChange, title, description }) => (
  <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
    />
    <span>
      <span className="block text-sm font-medium text-slate-900">{title}</span>
      {description && <span className="block text-xs text-slate-400">{description}</span>}
    </span>
  </label>
);

// ---------------------------------------------------------------------------
// Subsection row
// ---------------------------------------------------------------------------

const SubsectionRow = ({ subsection, isNew, onFieldChange, onRequestRemove }) => {
  const [isEditing, setIsEditing] = useState(isNew);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 border border-dashed p-3.5 transition-colors",
        adminTheme.border.default,
        adminTheme.radius.lg,
        !isEditing && "hover:border-slate-300"
      )}
    >
      {isEditing ? (
        <div className="min-w-0 flex-1 space-y-3 pr-16">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <FieldLabel>Subsection Name</FieldLabel>
              <SelectInput
                id={`${subsection.id}-name`}
                value={subsection.name}
                onChange={(e) => onFieldChange(subsection.id, "name", e.target.value)}
                options={SUBSECTION_NAME_OPTIONS}
              />
            </div>
            <div className="sm:col-span-3">
              <FieldLabel>Subsection Code</FieldLabel>
              <TextInput
                id={`${subsection.id}-code`}
                value={subsection.subsectionCode}
                onChange={(e) => onFieldChange(subsection.id, "subsectionCode", e.target.value)}
                placeholder="PATTERN"
              />
            </div>
            <div className="sm:col-span-4">
              <FieldLabel>Primary Dimension</FieldLabel>
              <SelectInput
                id={`${subsection.id}-dimension`}
                value={subsection.dimensionId}
                onChange={(e) => onFieldChange(subsection.id, "dimensionId", e.target.value)}
                options={DIMENSION_OPTIONS}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Question Limit</FieldLabel>
            <NumberInput
              id={`${subsection.id}-limit`}
              value={subsection.questionLimit}
              onChange={(e) => onFieldChange(subsection.id, "questionLimit", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Short Description</FieldLabel>
            <TextInput
              id={`${subsection.id}-description`}
              value={subsection.description}
              onChange={(e) => onFieldChange(subsection.id, "description", e.target.value)}
              placeholder="Short description"
            />
          </div>
          <div>
            <FieldLabel>Instructions</FieldLabel>
            <textarea
              id={`${subsection.id}-instructions`}
              rows={3}
              value={subsection.instructions}
              onChange={(e) => onFieldChange(subsection.id, "instructions", e.target.value)}
              placeholder="Add subsection instructions for students"
              className={cn(
                "w-full resize-none text-sm",
                adminTheme.radius.md,
                adminTheme.border.default,
                "border px-3 py-2 text-slate-900 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              )}
            />
          </div>
          <div className="sm:col-span-6">
            <Checkbox
              id={`${subsection.id}-randomize`}
              checked={subsection.randomizeQuestions}
              onChange={(e) => onFieldChange(subsection.id, "randomizeQuestions", e.target.checked)}
              title="Randomize questions"
              description="Shuffle question order within this subsection."
            />
          </div>
        </div>
      ) : (
        <div className="min-w-0 flex-1 pr-16">
          <p className="truncate text-sm font-semibold text-slate-900">
            {subsection.name || "Untitled Subsection"}
          </p>
          <p className="mt-1 truncate text-xs text-slate-400">
            {subsection.description || "No description added yet."}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {subsection.instructions || "No instructions added yet."}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {subsection.dimensionId && (
              <span className={adminTheme.badge.neutral}>{DIMENSION_LABELS[subsection.dimensionId]}</span>
            )}
            <span className="text-xs text-slate-400">Max {subsection.questionLimit || 0} questions</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          "absolute right-3 top-3 flex shrink-0 items-center gap-1 transition-opacity",
          isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        )}
      >
        {isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50"
            aria-label="Done editing subsection"
          >
            <Check className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Edit subsection"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRequestRemove(subsection.id)}
          className="rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Delete subsection"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const AddSubsectionButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center justify-center gap-1.5 border border-dashed p-3.5 text-sm font-medium text-slate-400",
      "hover:border-slate-300 hover:text-slate-600",
      adminTheme.border.default,
      adminTheme.radius.lg
    )}
  >
    <Plus className="h-3.5 w-3.5" />
    Add Subsection
  </button>
);

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

const SectionCard = ({
  section,
  isNew,
  newSubsectionIds,
  onFieldChange,
  onRequestRemove,
  onAddSubsection,
  onSubsectionFieldChange,
  onRequestRemoveSubsection,
}) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const questionLimitTotal = section.subsections.reduce(
    (sum, sub) => sum + (Number(sub.questionLimit) || 0),
    0
  );

  return (
    <div className={cn(adminTheme.card.base, adminTheme.shadow.sm, "group relative p-5")}>
      <div
        className={cn(
          "absolute right-4 top-4 flex shrink-0 items-center gap-1 transition-opacity",
          isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        )}
      >
        {isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50"
            aria-label="Done editing section"
          >
            <Check className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Edit section"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRequestRemove(section.id)}
          className="rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-start gap-3 pr-16">
        <GripVertical className="mt-1 h-4 w-4 shrink-0 cursor-grab text-slate-300" />

        {isEditing ? (
          <div className="min-w-0 flex-1 grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <FieldLabel>Section Name</FieldLabel>
              <SelectInput
                id={`${section.id}-name`}
                value={section.name}
                onChange={(e) => onFieldChange(section.id, "name", e.target.value)}
                options={SECTION_NAME_OPTIONS}
              />
            </div>
            <div className="sm:col-span-3">
              <FieldLabel>Section Code</FieldLabel>
              <TextInput
                id={`${section.id}-code`}
                value={section.sectionCode}
                onChange={(e) => onFieldChange(section.id, "sectionCode", e.target.value)}
                placeholder="APT001"
              />
            </div>
            <div className="sm:col-span-4">
              <FieldLabel>Time Limit (mins)</FieldLabel>
              <NumberInput
                id={`${section.id}-timeLimit`}
                value={section.timeLimitMinutes}
                onChange={(e) => onFieldChange(section.id, "timeLimitMinutes", e.target.value)}
                icon={Clock}
              />
            </div>
            <div className="sm:col-span-12">
              <TextInput
                id={`${section.id}-description`}
                value={section.description}
                onChange={(e) => onFieldChange(section.id, "description", e.target.value)}
                placeholder="Short description"
              />
            </div>
            <div className="sm:col-span-6">
              <Checkbox
                id={`${section.id}-mandatory`}
                checked={section.isMandatory}
                onChange={(e) => onFieldChange(section.id, "isMandatory", e.target.checked)}
                title="Mandatory section"
                description="Candidate must attempt this section."
              />
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {section.name || "Untitled Section"}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {section.timeLimitMinutes} Mins
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="inline-flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                Up to {questionLimitTotal || 0} Questions
              </span>
              <span className="text-slate-300">&bull;</span>
              <span>{section.isMandatory ? "Mandatory" : "Optional"}</span>
              {section.randomizeQuestions && (
                <>
                  <span className="text-slate-300">&bull;</span>
                  <span>Randomized</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3 pl-7">
        {section.subsections.map((subsection) => (
          <SubsectionRow
            key={subsection.id}
            subsection={subsection}
            isNew={newSubsectionIds.has(subsection.id)}
            onFieldChange={(subsectionId, field, value) =>
              onSubsectionFieldChange(section.id, subsectionId, field, value)
            }
            onRequestRemove={(subsectionId) => onRequestRemoveSubsection(section.id, subsectionId)}
          />
        ))}
        <AddSubsectionButton onClick={() => onAddSubsection(section.id)} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Public component — Step 4: Structure (sections & subsections)
// ---------------------------------------------------------------------------

const StructureStep = ({
  sections,
  newSectionIds,
  newSubsectionIds,
  onAddSection,
  onRequestRemoveSection,
  onSectionFieldChange,
  onAddSubsection,
  onSubsectionFieldChange,
  onRequestRemoveSubsection,
}) => (
  <div>
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <h2 className="text-base font-semibold text-slate-900">Sections & Subsections</h2>
      <p className="mt-1 text-sm text-slate-500">
        Define the sections that make up this assessment version, and break each one down into subsections with
        their own dimension, question limit, and instructions.
      </p>
    </div>

    <div className="mt-6 space-y-6">
      {sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          isNew={newSectionIds.has(section.id)}
          newSubsectionIds={newSubsectionIds}
          onFieldChange={onSectionFieldChange}
          onRequestRemove={onRequestRemoveSection}
          onAddSubsection={onAddSubsection}
          onSubsectionFieldChange={onSubsectionFieldChange}
          onRequestRemoveSubsection={onRequestRemoveSubsection}
        />
      ))}

      <button
        type="button"
        onClick={onAddSection}
        className={cn(adminTheme.actionButton.secondary, "w-full justify-center border-dashed")}
      >
        <Plus className="h-4 w-4" />
        Add Section
      </button>
    </div>
  </div>
);

export default StructureStep;