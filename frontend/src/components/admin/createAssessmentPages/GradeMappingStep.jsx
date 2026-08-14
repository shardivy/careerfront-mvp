import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { FieldLabel, SelectInput, NumberInput } from "./WizardFormFields";

// ---------------------------------------------------------------------------
// Step 3: Grade & Board Mapping (assessment_version_grade_mapping)
// Rendered by CreateAssessment.jsx when currentStep === 3.
//
// This file also owns the grade/board option lists and labels, since they're
// specific to this step's domain. CreateAssessment.jsx imports the named
// exports below wherever it needs them (payload building, validation,
// review-step summaries, seeding initial state) — same pattern used for
// INITIAL_SECTIONS in StructureStep.jsx.
// ---------------------------------------------------------------------------

// assessment_version_grade_mapping.grade (backed by grades master)
export const GRADE_OPTIONS = [
  { value: "", label: "Select Grade" },
  { value: "GRADE_6", label: "Grade 6" },
  { value: "GRADE_7", label: "Grade 7" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
  { value: "UG", label: "Undergraduate" },
  { value: "PG", label: "Postgraduate" },
];

export const GRADE_LABELS = GRADE_OPTIONS.reduce((acc, option) => {
  if (option.value) acc[option.value] = option.label;
  return acc;
}, {});

// assessment_version_grade_mapping.board
export const BOARD_OPTIONS = [
  { value: "ALL", label: "All Boards" },
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "STATE", label: "State Board" },
  { value: "IB", label: "IB" },
  { value: "IGCSE", label: "IGCSE" },
];

export const VALID_BOARDS = BOARD_OPTIONS.map((o) => o.value);

// Default seed rows used when starting a brand-new assessment draft.
export const INITIAL_GRADES = [
  {
    id: "grade-1",
    grade: "GRADE_6",
    board: "CBSE",
    minimumAge: 11,
    maximumAge: 13,
    isDefault: false,
  },
  {
    id: "grade-2",
    grade: "GRADE_9",
    board: "CBSE",
    minimumAge: 14,
    maximumAge: 15,
    isDefault: true,
  },
  {
    id: "grade-3",
    grade: "GRADE_11",
    board: "CBSE",
    minimumAge: 16,
    maximumAge: 17,
    isDefault: false,
  },
];

const GradeRow = ({ grade, onFieldChange, onSetDefault, onRemove }) => (
  <div className={cn(adminTheme.card.base, "flex items-start gap-3 p-4")}>
    <div className="min-w-0 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-12">
      <div className="sm:col-span-4">
        <FieldLabel required>Grade</FieldLabel>
        <SelectInput
          id={`${grade.id}-grade`}
          value={grade.grade}
          onChange={(e) => onFieldChange(grade.id, "grade", e.target.value)}
          options={GRADE_OPTIONS}
        />
      </div>

      <div className="sm:col-span-3">
        <FieldLabel>Board</FieldLabel>
        <SelectInput
          id={`${grade.id}-board`}
          value={grade.board}
          onChange={(e) => onFieldChange(grade.id, "board", e.target.value)}
          options={BOARD_OPTIONS}
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel>Min. Age</FieldLabel>
        <NumberInput
          id={`${grade.id}-minAge`}
          value={grade.minimumAge}
          onChange={(e) => onFieldChange(grade.id, "minimumAge", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel>Max. Age</FieldLabel>
        <NumberInput
          id={`${grade.id}-maxAge`}
          value={grade.maximumAge}
          onChange={(e) => onFieldChange(grade.id, "maximumAge", e.target.value)}
        />
      </div>

      <div className="flex items-end sm:col-span-1">
        <label htmlFor={`${grade.id}-default`} className="flex cursor-pointer items-center gap-2 pb-2.5">
          <input
            id={`${grade.id}-default`}
            type="radio"
            name="default-grade-mapping"
            checked={grade.isDefault}
            onChange={() => onSetDefault(grade.id)}
            className="h-4 w-4 shrink-0 border-slate-300 text-slate-900 focus:ring-slate-900/20"
          />
          <span className="text-xs font-semibold text-slate-500">Default</span>
        </label>
      </div>
    </div>

    <button
      type="button"
      onClick={() => onRemove(grade.id)}
      className="mt-1 shrink-0 rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
      aria-label="Remove grade mapping"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);

const AddGradeButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(adminTheme.actionButton.secondary, "w-full justify-center border-dashed")}
  >
    <Plus className="h-4 w-4" />
    Add Grade / Board Mapping
  </button>
);

const GradeMappingStep = ({ grades, onAddGrade, onRemoveGrade, onGradeFieldChange, onSetDefaultGrade }) => (
  <div>
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <h2 className="text-base font-semibold text-slate-900">Grade & Board Mapping</h2>
      <p className="mt-1 text-sm text-slate-500">
        Choose which grades and boards this assessment version is eligible for, along with the age range for
        each. Mark one mapping as the default.
      </p>
    </div>

    <div className="mt-6 space-y-4">
      {grades.map((grade) => (
        <GradeRow
          key={grade.id}
          grade={grade}
          onFieldChange={onGradeFieldChange}
          onSetDefault={onSetDefaultGrade}
          onRemove={onRemoveGrade}
        />
      ))}

      <AddGradeButton onClick={onAddGrade} />
    </div>
  </div>
);

export default GradeMappingStep;