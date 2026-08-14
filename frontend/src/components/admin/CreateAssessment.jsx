import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Rocket,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
import {
  publishAssessmentSlice,
  updateAssessmentDraftSlice,
  fetchAssessmentDetailSlice,
  resetAssessmentDetail,
} from "@/slices/assessmentSlice";
import QuestionMappingStep from "./createAssessmentPages/QuestionMappingStep";
import StructureStep, { INITIAL_SECTIONS } from "./createAssessmentPages/StructureStep";
import VersionSettingsStep from "./createAssessmentPages/VersionSettingsStep";
import GradeMappingStep, {
  INITIAL_GRADES,
  GRADE_OPTIONS,
  GRADE_LABELS,
  BOARD_OPTIONS,
  VALID_BOARDS,
} from "./createAssessmentPages/GradeMappingStep";
import { FieldLabel, TextInput, AssessmentNameField, SelectInput } from "./createAssessmentPages/WizardFormFields";
import ReviewStep from "./createAssessmentPages/ReviewStep";

// ---- Step config ------------------------------------------------------

const STEPS = [
  {
    id: 1,
    label: "General Info",
    description: "Assessment basics",
    headerTitle: "Create New Assessment",
    headerSubtitle: "Step 1 of 6: Assessment Configuration",
  },
  {
    id: 2,
    label: "Version Settings",
    description: "Duration & availability",
    headerTitle: "Configure Version Settings",
    headerSubtitle: "Step 2 of 6: Assessment Version Configuration",
  },
  {
    id: 3,
    label: "Grade Mapping",
    description: "Eligible grades & boards",
    headerTitle: "Map Grades & Boards",
    headerSubtitle: "Step 3 of 6: Assessment Version Grade Mapping",
  },
  {
    id: 4,
    label: "Structure",
    description: "Sections & Subsections",
    headerTitle: "Configure Assessment Structure",
    headerSubtitle: "Step 4 of 6: Sections & Subsections",
  },
  {
    id: 5,
    label: "Question Mapping",
    description: "Map questions to subsections",
    headerTitle: "Map Questions to Structure",
    headerSubtitle: "Step 5 of 6: Question Bank Mapping",
  },
  {
    id: 6,
    label: "Review",
    description: "Final check",
    headerTitle: "Review Assessment",
    headerSubtitle: "Final Step: Verification & Launch",
  },
];

// assessments.assessment_type
const ASSESSMENT_TYPES = [
  { value: "", label: "Select Assessment Type" },
  { value: "CAREER", label: "Career" },
  { value: "APTITUDE", label: "Aptitude" },
  { value: "INTEREST", label: "Interest" },
  { value: "PERSONALITY", label: "Personality" },
  { value: "PSYCHOMETRIC", label: "Psychometric" },
  { value: "LEARNING_STYLE", label: "Learning Style" },
  { value: "CUSTOM", label: "Custom" },
];

const ASSESSMENT_TYPE_LABELS = ASSESSMENT_TYPES.reduce((acc, option) => {
  if (option.value) acc[option.value] = option.label;
  return acc;
}, {});

const VALID_ASSESSMENT_TYPES = ASSESSMENT_TYPES.map((o) => o.value).filter(Boolean);

const DEFAULT_ASSESSMENT_NAME_OPTIONS = [
  "Career Assessment – Grade 10",
  "Aptitude Assessment – Grade 9",
  "Interest Assessment – Grade 8",
  "Psychometric Assessment – Grade 11",
];

// assessments.default_language
const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
];

// assessments + assessment_versions (Step 1 form)
const INITIAL_FORM = {
  // assessments
  name: "",
  shortName: "", // short_name
  type: "", // assessment_type
  language: "English", // default_language
  description: "", // internal description

  // assessment_versions
  versionNumber: "V1.0", // version_number
  versionName: "", // version_name
  effectiveFrom: "", // effective_from
  effectiveTo: "", // effective_to
  duration: 60, // duration_minutes
  minQualifyingPercentage: 40, // minimum_qualifying_percentage
  minQualifyingMarks: "", // minimum_qualifying_marks
  instructions: "", // candidate-facing instructions
  allowResume: true, // allow_resume
  allowReview: true, // allow_review
  randomizeSections: false, // randomize_sections
  randomizeQuestions: false, // randomize_questions
  showResultImmediately: false, // show_result_immediately
};

// TODO: the wizard has no report-template picker yet, but
// assessment_versions.report_template is a required FK on the backend.
// Wire up a real selector once the template list is available and stop
// relying on this constant.
const DEFAULT_REPORT_TEMPLATE_ID = 1;

const normalizeLanguageValue = (languageValue) => {
  if (!languageValue) return "English";

  const normalized = String(languageValue).trim();
  const matchedLanguage = LANGUAGES.find(
    (option) => option.value.toLowerCase() === normalized.toLowerCase()
  );

  if (matchedLanguage) return matchedLanguage.value;

  const shortCode = normalized.slice(0, 2).toLowerCase();
  if (shortCode === "en") return "English";
  if (shortCode === "hi") return "Hindi";
  if (shortCode === "es") return "Spanish";
  if (shortCode === "fr") return "French";

  return normalized;
};

const hydrateWizardFromDetail = (detail) => {
  const assessment = detail?.assessment ?? detail?.data?.assessment ?? detail?.results?.assessment ?? detail;
  const version = detail?.assessment_version ?? detail?.data?.assessment_version ?? detail?.version ?? detail?.data?.version ?? {};
  const gradesSource = detail?.grades ?? detail?.assessment_version_grade_mapping ?? detail?.data?.grades ?? detail?.data?.assessment_version_grade_mapping ?? [];
  const sectionsSource = detail?.sections ?? detail?.data?.sections ?? [];

  const nextForm = {
    ...INITIAL_FORM,
    name: assessment?.name ?? assessment?.assessment_name ?? "",
    shortName: assessment?.short_name ?? "",
    type: assessment?.assessment_type ?? "",
    language: normalizeLanguageValue(assessment?.default_language ?? assessment?.language),
    description: assessment?.description ?? "",
    versionNumber: version?.version_number ?? "V1.0",
    versionName: version?.version_name ?? "",
    effectiveFrom: version?.effective_from ?? version?.release_date ?? "",
    effectiveTo: version?.effective_to ?? "",
    duration: version?.duration_minutes ?? INITIAL_FORM.duration,
    minQualifyingPercentage:
      version?.minimum_qualifying_percentage ?? INITIAL_FORM.minQualifyingPercentage,
    minQualifyingMarks: version?.minimum_qualifying_marks ?? "",
    instructions: version?.instructions ?? "",
    allowResume: version?.allow_resume ?? INITIAL_FORM.allowResume,
    allowReview: version?.allow_review ?? INITIAL_FORM.allowReview,
    randomizeSections: version?.randomize_sections ?? INITIAL_FORM.randomizeSections,
    randomizeQuestions: version?.randomize_questions ?? INITIAL_FORM.randomizeQuestions,
    showResultImmediately: version?.show_result_immediately ?? INITIAL_FORM.showResultImmediately,
  };

  const nextGrades = (Array.isArray(gradesSource) ? gradesSource : []).map((grade, index) => ({
    id: `${grade?.grade_code ?? "grade"}-${index + 1}`,
    grade: grade?.grade_code ?? "",
    board: grade?.board ?? "ALL",
    minimumAge: grade?.minimum_age ?? "",
    maximumAge: grade?.maximum_age ?? "",
    isDefault: Boolean(grade?.is_default),
  }));

  const nextSections = (Array.isArray(sectionsSource) ? sectionsSource : []).map((section, sectionIndex) => ({
    id: section?.id ?? `section-${sectionIndex + 1}`,
    name: section?.name ?? "",
    sectionCode: section?.section_code ?? "",
    description: section?.description ?? "",
    instructions: section?.instructions ?? "",
    timeLimitMinutes: section?.time_limit_minutes ?? 0,
    isMandatory: section?.is_mandatory ?? true,
    randomizeQuestions: section?.randomize_questions ?? false,
    subsections: (Array.isArray(section?.subsections) ? section.subsections : []).map((sub, subIndex) => ({
      id: sub?.id ?? `${section?.id ?? `section-${sectionIndex + 1}`}-sub-${subIndex + 1}`,
      name: sub?.name ?? "",
      subsectionCode: sub?.subsection_code ?? "",
      dimensionId: sub?.dimension || sub?.dimension_id || "",
      questionLimit: sub?.question_limit ?? 0,
      description: sub?.description ?? "",
      instructions: sub?.instructions ?? "",
    })),
  }));

  const nextBlueprintItems = [];
  (Array.isArray(sectionsSource) ? sectionsSource : []).forEach((section, sectionIndex) => {
    const sectionId = section?.id ?? `section-${sectionIndex + 1}`;
    (Array.isArray(section?.subsections) ? section.subsections : []).forEach((sub, subIndex) => {
      const subsectionId = sub?.id ?? `${sectionId}-sub-${subIndex + 1}`;
      (Array.isArray(sub?.questions) ? sub.questions : []).forEach((q, qIndex) => {
        nextBlueprintItems.push({
          id: q?.id ?? `${subsectionId}-bp-${qIndex + 1}`,
          sectionId,
          subsectionId,
          questionId: q?.question_id ?? q?.questionId ?? "",
          sequenceNo: q?.sequence_no ?? qIndex + 1,
          marksOverride: q?.marks ?? 1,
          negativeMarksOverride: q?.negative_marks ?? 0,
          isMandatory: q?.is_mandatory ?? true,
          isRandomizable: q?.is_randomizable ?? false,
          isVisible: q?.is_visible ?? true,
          status: q?.status ?? "ACTIVE",
        });
      });
    });
  });

  return {
    form: nextForm,
    grades: nextGrades.length > 0 ? nextGrades : INITIAL_GRADES,
    sections: nextSections.length > 0 ? nextSections : INITIAL_SECTIONS,
    blueprintItems: nextBlueprintItems,
  };
};

// ---------------------------------------------------------------------------
// Payload builder — transforms wizard state (form, grades, sections,
// blueprintItems) into the exact snake_case shape the publish API expects.
// ---------------------------------------------------------------------------

const educationLevelForGrade = (gradeCode) => {
  if (gradeCode === "UG") return "UG";
  if (gradeCode === "PG") return "PG";
  return "SCHOOL";
};

// TODO: dimensions.id is a numeric FK on the backend, but the dimension
// options only carry string codes (e.g. "LOGICAL"). Until this page fetches
// the real dimension list and stores numeric ids, the code is passed
// straight through — confirm with backend whether it accepts codes or needs
// ids.
const resolveDimensionId = (dimensionCode) => dimensionCode || null;

const buildAssessmentPayload = ({ form, grades, sections, blueprintItems = [], isDraft = false, step = undefined }) => {
  const totalSections = sections.length;
  const totalSubsections = sections.reduce((sum, s) => sum + s.subsections.length, 0);

  const includeGrades = step === undefined ? true : step >= 2;
  const includeSections = step === undefined ? true : step >= 3;
  const includeQuestions = step === undefined ? true : step >= 5;

  // Prefer real mapped-question counts/marks once the mapping step has been
  // used; otherwise fall back to the section/subsection question_limit
  // totals so earlier steps still produce a sane draft payload.
  const totalQuestionsFromLimits = sections.reduce(
    (sum, s) => sum + s.subsections.reduce((subSum, sub) => subSum + (Number(sub.questionLimit) || 0), 0),
    0
  );
  const totalQuestionsMapped = includeQuestions ? blueprintItems.length : 0;
  const totalMarksMapped = includeQuestions
    ? blueprintItems.reduce((sum, item) => sum + (Number(item.marksOverride) || 0), 0)
    : 0;

  const totalQuestions = totalQuestionsMapped > 0 ? totalQuestionsMapped : totalQuestionsFromLimits;
  // TODO: marks-per-question default to 1 when nothing has been mapped yet
  // (matches the example payload: 60 questions -> 60 total_marks).
  const totalMarks = totalQuestionsMapped > 0 ? totalMarksMapped : totalQuestions;

  const minQualifyingMarks =
    form.minQualifyingMarks !== "" && form.minQualifyingMarks != null
      ? Number(form.minQualifyingMarks)
      : form.minQualifyingPercentage
        ? Math.round((Number(form.minQualifyingPercentage) / 100) * totalMarks)
        : null;

  const payload = {
    is_draft: isDraft,

    assessment: {
      name: form.name?.trim() || "",
      short_name: form.shortName?.trim() || "",
      assessment_type: form.type || "",
      description: form.description?.trim() || "",
      default_language: (form.language || "").toLowerCase().slice(0, 2) || "en",
    },

    assessment_version: {
      report_template: DEFAULT_REPORT_TEMPLATE_ID,
      version_number: form.versionNumber?.trim() || "",
      version_name: form.versionName?.trim() || "",
      release_date: form.effectiveFrom || null,
      effective_from: form.effectiveFrom || null,
      effective_to: form.effectiveTo || null,
      duration_minutes: Number(form.duration) || 0,
      total_sections: totalSections,
      total_subsections: totalSubsections,
      total_questions: totalQuestions,
      total_marks: totalMarks,
      minimum_qualifying_marks: minQualifyingMarks,
      minimum_qualifying_percentage:
        form.minQualifyingPercentage !== "" && form.minQualifyingPercentage != null
          ? Number(form.minQualifyingPercentage)
          : null,
      allow_resume: Boolean(form.allowResume),
      allow_review: Boolean(form.allowReview),
      randomize_sections: Boolean(form.randomizeSections),
      randomize_questions: Boolean(form.randomizeQuestions),
      show_result_immediately: Boolean(form.showResultImmediately),
      instructions: form.instructions?.trim() || "",
      status: isDraft ? "DRAFT" : "PUBLISHED",
    },
  };

  if (includeGrades) {
    payload.grades = grades.map((g) => ({
      grade_code: g.grade || "",
      grade_name: GRADE_LABELS[g.grade] || "",
      education_level: educationLevelForGrade(g.grade),
      display_order: 1,
      board: g.board || "ALL",
      minimum_age: g.minimumAge !== "" && g.minimumAge != null ? Number(g.minimumAge) : null,
      maximum_age: g.maximumAge !== "" && g.maximumAge != null ? Number(g.maximumAge) : null,
      is_default: Boolean(g.isDefault),
      status: "ACTIVE",
    }));
  }

  if (includeSections) {
    payload.sections = sections.map((section, sectionIndex) => ({
      section_code: section.sectionCode?.trim() || "",
      name: section.name?.trim() || "",
      description: section.description?.trim() || "",
      instructions: section.instructions?.trim() || "",
      display_order: sectionIndex + 1,
      time_limit_minutes: Number(section.timeLimitMinutes) || 0,
      is_mandatory: Boolean(section.isMandatory),
      randomize_questions: Boolean(section.randomizeQuestions),
      status: "ACTIVE",
      subsections: section.subsections.map((sub, subIndex) => {
        const subQuestions = includeQuestions
          ? blueprintItems
              .filter((item) => item.subsectionId === sub.id)
              .sort((a, b) => a.sequenceNo - b.sequenceNo)
              .map((item) => ({
                question_id: item.questionId,
                sequence_no: item.sequenceNo,
                marks: Number(item.marksOverride) || 0,
                negative_marks: Number(item.negativeMarksOverride) || 0,
                is_mandatory: Boolean(item.isMandatory),
                is_randomizable: Boolean(item.isRandomizable),
                is_visible: Boolean(item.isVisible),
                status: item.status || "ACTIVE",
              }))
          : undefined;

        return {
          dimension: resolveDimensionId(sub.dimensionId),
          subsection_code: sub.subsectionCode?.trim() || "",
          name: sub.name?.trim() || "",
          description: sub.description?.trim() || "",
          instructions: sub.instructions?.trim() || "",
          display_order: subIndex + 1,
          question_limit: Number(sub.questionLimit) || 0,
          status: "ACTIVE",
          ...(subQuestions !== undefined ? { questions: subQuestions } : {}),
        };
      }),
    }));
  }

  return payload;
};

// ---------------------------------------------------------------------------
// Validator — checks the built payload against the required (✅) columns on
// assessments / assessment_versions / assessment_version_grade_mapping /
// sections / subsections / subsection question mappings. Returns a flat
// field-path -> message map so it's easy to surface next to the relevant field.
// ---------------------------------------------------------------------------

const validateStepOneFields = (form) => {
  const errors = {};

  if (!form.name?.trim()) {
    errors["assessment.name"] = "Assessment name is required.";
  }

  if (!form.type) {
    errors["assessment.assessment_type"] = "Assessment type is required.";
  }

  if (!form.language) {
    errors["assessment.default_language"] = "Default language is required.";
  }

  return errors;
};

const validateStepTwoFields = (form) => {
  const errors = {};

  if (!form.effectiveFrom) {
    errors["assessment_version.effective_from"] = "Effective-from date is required.";
  }

  if (!form.duration || Number(form.duration) <= 0) {
    errors["assessment_version.duration_minutes"] = "Duration must be greater than 0 minutes.";
  }

  return errors;
};

const validateAssessmentPayload = (payload) => {
  const errors = {};

  // ---- assessments ----
  if (!payload.assessment.name) {
    errors["assessment.name"] = "Assessment name is required.";
  } else if (payload.assessment.name.length > 255) {
    errors["assessment.name"] = "Assessment name must be 255 characters or fewer.";
  }

  if (!payload.assessment.assessment_type) {
    errors["assessment.assessment_type"] = "Assessment type is required.";
  } else if (!VALID_ASSESSMENT_TYPES.includes(payload.assessment.assessment_type)) {
    errors["assessment.assessment_type"] = "Assessment type is not a recognized value.";
  }

  if (!payload.assessment.default_language) {
    errors["assessment.default_language"] = "Default language is required.";
  }

  // ---- assessment_versions ----
  if (!payload.assessment_version.report_template) {
    errors["assessment_version.report_template"] = "A report template must be selected.";
  }

  if (!payload.assessment_version.version_number) {
    errors["assessment_version.version_number"] = "Version number is required.";
  }

  if (!payload.assessment_version.effective_from) {
    errors["assessment_version.effective_from"] = "Effective-from date is required.";
  }

  if (
    payload.assessment_version.effective_to &&
    payload.assessment_version.effective_from &&
    payload.assessment_version.effective_to < payload.assessment_version.effective_from
  ) {
    errors["assessment_version.effective_to"] = "Effective-to date cannot be before effective-from.";
  }

  if (!payload.assessment_version.duration_minutes || payload.assessment_version.duration_minutes <= 0) {
    errors["assessment_version.duration_minutes"] = "Duration must be greater than 0 minutes.";
  }

  if (!payload.assessment_version.total_marks || payload.assessment_version.total_marks <= 0) {
    errors["assessment_version.total_marks"] =
      "Total marks must be greater than 0 — add at least one subsection with a question limit.";
  }

  if (payload.assessment_version.total_questions <= 0) {
    errors["assessment_version.total_questions"] =
      "At least one subsection needs a question limit greater than 0.";
  }

  const pct = payload.assessment_version.minimum_qualifying_percentage;
  if (pct != null && (pct < 0 || pct > 100)) {
    errors["assessment_version.minimum_qualifying_percentage"] = "Qualifying percentage must be between 0 and 100.";
  }

  // ---- assessment_version_grade_mapping ----
  if (!payload.grades.length) {
    errors["grades"] = "At least one grade mapping is required.";
  } else {
    const defaultCount = payload.grades.filter((g) => g.is_default).length;
    if (defaultCount === 0) {
      errors["grades.default"] = "One grade mapping must be marked as default.";
    } else if (defaultCount > 1) {
      errors["grades.default"] = "Only one grade mapping can be marked as default.";
    }

    const seen = new Set();
    payload.grades.forEach((g, i) => {
      if (!g.grade_code) {
        errors[`grades[${i}].grade_code`] = "Grade is required.";
      } else {
        const key = `${g.grade_code}::${g.board}`;
        if (seen.has(key)) {
          errors[`grades[${i}].duplicate`] = `Duplicate mapping for ${g.grade_code} / ${g.board}.`;
        }
        seen.add(key);
      }

      if (!VALID_BOARDS.includes(g.board)) {
        errors[`grades[${i}].board`] = "Board is not a recognized value.";
      }

      if (g.minimum_age != null && g.maximum_age != null && g.minimum_age > g.maximum_age) {
        errors[`grades[${i}].age_range`] = "Minimum age cannot be greater than maximum age.";
      }
    });
  }

  // ---- sections / subsections / question mappings ----
  if (!payload.sections.length) {
    errors["sections"] = "At least one section is required.";
  } else {
    const sectionCodes = new Set();
    payload.sections.forEach((section, sIndex) => {
      if (!section.name) {
        errors[`sections[${sIndex}].name`] = "Section name is required.";
      }
      if (!section.section_code) {
        errors[`sections[${sIndex}].section_code`] = "Section code is required.";
      } else if (sectionCodes.has(section.section_code)) {
        errors[`sections[${sIndex}].section_code`] = `Section code "${section.section_code}" is used more than once.`;
      } else {
        sectionCodes.add(section.section_code);
      }

      if (section.time_limit_minutes < 0) {
        errors[`sections[${sIndex}].time_limit_minutes`] = "Time limit cannot be negative.";
      }

      const subCodes = new Set();
      section.subsections.forEach((sub, subIndex) => {
        if (!sub.name) {
          errors[`sections[${sIndex}].subsections[${subIndex}].name`] = "Subsection name is required.";
        }
        if (!sub.subsection_code) {
          errors[`sections[${sIndex}].subsections[${subIndex}].subsection_code`] = "Subsection code is required.";
        } else if (subCodes.has(sub.subsection_code)) {
          errors[`sections[${sIndex}].subsections[${subIndex}].subsection_code`] =
            `Subsection code "${sub.subsection_code}" is used more than once in this section.`;
        } else {
          subCodes.add(sub.subsection_code);
        }

        if (sub.question_limit <= 0) {
          errors[`sections[${sIndex}].subsections[${subIndex}].question_limit`] =
            "Question limit should be greater than 0.";
        }

        if (Array.isArray(sub.questions)) {
          const mappedCount = sub.questions.length;
          if (sub.question_limit > 0 && mappedCount < sub.question_limit) {
            errors[`sections[${sIndex}].subsections[${subIndex}].questions`] =
              `${mappedCount}/${sub.question_limit} questions mapped — assign the remaining questions in Step 5.`;
          }
        }
      });
    });
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// ---- Sidebar ------------------------------------------------------------

const StepIndicator = ({ step, isActive, isComplete, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
      isActive ? adminTheme.nav.active : adminTheme.nav.inactive
    )}
  >
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
        isComplete
          ? "border-slate-900 bg-slate-900 text-white"
          : isActive
            ? "border-slate-900 bg-white text-slate-900 shadow-sm"
            : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300"
      )}
    >
      {isComplete ? <Check className="h-3.5 w-3.5" /> : step.id}
    </span>
    <span className="min-w-0">
      <span
        className={cn(
          "block truncate text-sm font-semibold",
          isActive || isComplete ? adminTheme.text.primary : "text-slate-400"
        )}
      >
        {step.label}
      </span>
      <span className={cn("block truncate text-xs", isActive ? "text-slate-500" : adminTheme.text.muted)}>
        {step.description}
      </span>
    </span>
  </button>
);

const ConfigurationSidebar = ({ currentStep, onStepClick }) => {
  const completedCount = currentStep - 1;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  return (
    <aside
      className={cn(
        "sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r bg-white p-5 md:flex lg:w-72 lg:p-6 xl:w-80",
        adminTheme.border.default
      )}
    >
      <div className="flex items-center justify-between">
        <p className={adminTheme.nav.groupLabel}>Configuration Progress</p>
        <span className="text-xs font-semibold text-slate-400">{progressPercent}%</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="relative mt-6 space-y-1">
        {STEPS.map((step, index) => (
          <div key={step.id} className="relative">
            {index !== STEPS.length - 1 && (
              <span
                className={cn(
                  "absolute left-[22.5px] top-10 h-[calc(100%-16px)] w-px",
                  step.id < currentStep ? "bg-slate-900" : "bg-slate-200"
                )}
              />
            )}
            <StepIndicator
              step={step}
              isActive={step.id === currentStep}
              isComplete={step.id < currentStep}
              onClick={() => onStepClick(step.id)}
            />
          </div>
        ))}
      </div>

      <div className={cn(adminTheme.radius.lg, "mt-8 border p-4", adminTheme.border.default, adminTheme.surface.subtle)}>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-slate-500">
            <Info className="h-3 w-3" />
          </span>
          Quick Tip
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Once an assessment version is published, it can't be edited. If you need to make changes to sections, grade
          mapping, scoring, or question mapping, simply create a new version.
        </p>
      </div>
    </aside>
  );
};

// Compact horizontal step tracker shown below md, so progress stays visible
// even where there isn't room for the full vertical sidebar.
const MobileStepTracker = ({ currentStep, onStepClick }) => {
  const completedCount = currentStep - 1;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className={cn("sticky top-16 z-40 border-b bg-white md:hidden", adminTheme.border.default)}>
      <div
        className="h-full bg-slate-900 transition-all duration-300"
        style={{ width: `${progressPercent}%` }}
      />

      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2.5">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <div key={step.id} className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isActive ? adminTheme.nav.active : "text-slate-400 hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                    isComplete
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isActive
                        ? "border-slate-900 text-slate-900"
                        : "border-slate-200 text-slate-400"
                  )}
                >
                  {isComplete ? <Check className="h-3 w-3" /> : step.id}
                </span>
                <span className={cn("whitespace-nowrap", isActive && adminTheme.text.primary)}>{step.label}</span>
              </button>
              {index !== STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Step 1: General Info (assessments) --------------------------------

const GeneralInformationCard = ({ form, onFieldChange, validationErrors = {}, assessmentNameOptions = [] }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <h2 className="text-base font-semibold text-slate-900">General Information</h2>

    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div>
        <FieldLabel required>Assessment Name</FieldLabel>
        <AssessmentNameField
          id="name"
          value={form.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          placeholder="e.g. Career Assessment – Grade 10"
          required
          options={assessmentNameOptions}
          error={validationErrors["assessment.name"]}
        />
      </div>

      <div>
        <FieldLabel>Short Name</FieldLabel>
        <TextInput
          id="shortName"
          value={form.shortName}
          onChange={(e) => onFieldChange("shortName", e.target.value)}
          placeholder="e.g. Career G10"
        />
      </div>

      <div>
        <FieldLabel required>Assessment Type</FieldLabel>
        <SelectInput
          id="type"
          value={form.type}
          onChange={(e) => onFieldChange("type", e.target.value)}
          options={ASSESSMENT_TYPES}
          required
          error={validationErrors["assessment.assessment_type"]}
        />
      </div>

      <div>
        <FieldLabel required>Default Language</FieldLabel>
        <SelectInput
          id="language"
          value={form.language}
          onChange={(e) => onFieldChange("language", e.target.value)}
          options={LANGUAGES}
          required
          error={validationErrors["assessment.default_language"]}
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel>Internal Description</FieldLabel>
        <textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          placeholder="Briefly describe the purpose of this assessment (internal use only)..."
          className={cn(
            "w-full resize-none text-sm",
            adminTheme.radius.md,
            adminTheme.border.default,
            "border px-3 py-2.5 text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          )}
        />
      </div>
    </div>
  </div>
);

// ---- Step 4: Structure (sections & subsections) --------------------------
// Rendered directly from StructureStep.jsx — see the `currentStep === 4`
// block in the page component below.

// ---- Step 5: Question Mapping (blueprint items) ---------------------------
// The actual mapping UI lives in QuestionMappingStep.jsx — it's rendered
// directly from the page component below since it needs the live sections
// and blueprintItems state plus several handlers.

// ---- Step 6: Review & Publish ---------------------------------------------
// Rendered directly from ReviewStep.jsx — see the `currentStep === 6` block
// in the page component below.

// ---- Confirmation modal & toast -------------------------------------------

const ConfirmModal = ({ open, title, description, confirmLabel, cancelLabel = "Cancel", onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div
      className={cn("fixed inset-0 z-[100] flex items-center justify-center p-4", adminTheme.surface.overlay)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className={cn(adminTheme.card.base, adminTheme.shadow.xl, "w-full max-w-sm p-6")}
        onClick={(event) => event.stopPropagation()}
      >
        <p id="confirm-modal-title" className="text-base font-semibold text-slate-900">
          {title}
        </p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Header & footer ------------------------------------------------------

const WizardHeader = ({ currentStep, onBack, onNext, onPublish, isSavingDraft, isPublishing, lastSavedAt }) => {
  const step = STEPS.find((s) => s.id === currentStep);
  const isLastStep = currentStep === STEPS.length;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between gap-2 border-b bg-white px-3 sm:px-6",
        adminTheme.border.default,
        adminTheme.layout.headerHeight
      )}
    >
      <button type="button" onClick={onBack} className={cn(adminTheme.button.icon, "shrink-0")} aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{step.headerTitle}</h1>
        <p className="truncate text-xs text-slate-400">{step.headerSubtitle}</p>
      </div>

      {isLastStep ? (
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-1.5 text-sm font-medium text-slate-400 sm:inline-flex">
            <Eye className="h-4 w-4" />
            Preview Mode
          </span>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:px-4 sm:py-2.5",
              isPublishing && "cursor-not-allowed opacity-60"
            )}
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            <span className="hidden sm:inline">{isPublishing ? "Publishing..." : "Publish Assessment"}</span>
            <span className="sm:hidden">{isPublishing ? "Publishing..." : "Publish"}</span>
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 sm:inline-flex">
            {isSavingDraft ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              lastSavedAt && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Saved at {lastSavedAt}
                </>
              )
            )}
          </span>
          {isSavingDraft && <Loader2 className="h-4 w-4 animate-spin text-slate-400 sm:hidden" aria-label="Saving draft" />}
          <button
            type="button"
            onClick={onNext}
            disabled={isSavingDraft}
            className={cn(
              adminTheme.actionButton.primary,
              "px-3 py-2 sm:px-4 sm:py-2.5",
              isSavingDraft && "cursor-not-allowed opacity-70"
            )}
          >
            {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            <span className="hidden sm:inline">{isSavingDraft ? "Saving..." : "Next Step"}</span>
            <span className="sm:hidden">{isSavingDraft ? "Saving..." : "Next"}</span>
          </button>
        </div>
      )}
    </header>
  );
};

const WizardFooter = ({ onDiscard, onCancel, onSaveContinue, isLastStep, isSavingDraft }) => (
  <div className="flex items-center justify-between gap-3 border-t pt-6">
    <button type="button" onClick={onDiscard} className="text-sm font-medium text-slate-400 transition hover:text-red-600">
      Discard Draft
    </button>

    <div className="flex items-center gap-3">
      <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
        Cancel
      </button>
      {!isLastStep && (
        <button
          type="button"
          onClick={onSaveContinue}
          disabled={isSavingDraft}
          className={cn(adminTheme.actionButton.primary, isSavingDraft && "cursor-not-allowed opacity-70")}
        >
          {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          <span>{isSavingDraft ? "Saving..." : "Save & Continue"}</span>
        </button>
      )}
    </div>
  </div>
);

// ---- Page -----------------------------------------------------------------

const CreateAssessment = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [grades, setGrades] = useState(INITIAL_GRADES);
  const [blueprintItems, setBlueprintItems] = useState([]);
  const [assessmentNameOptions, setAssessmentNameOptions] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_ASSESSMENT_NAME_OPTIONS;
    }

    try {
      const storedOptions = window.localStorage.getItem("assessment-name-options");
      if (storedOptions) {
        const parsedOptions = JSON.parse(storedOptions);
        if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
          return parsedOptions;
        }
      }
    } catch (error) {
      console.warn("Unable to load assessment name options", error);
    }

    return DEFAULT_ASSESSMENT_NAME_OPTIONS;
  });
  const [searchParams] = useSearchParams();
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [newSectionIds, setNewSectionIds] = useState(() => new Set());
  const [newSubsectionIds, setNewSubsectionIds] = useState(() => new Set());

  const [deleteTarget, setDeleteTarget] = useState(null);

  const isLastStep = currentStep === STEPS.length;

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (field === "name") {
      const trimmedValue = String(value).trim();
      if (trimmedValue) {
        setAssessmentNameOptions((prevOptions) => {
          const nextOptions = prevOptions.filter((option) => option.trim() !== "");
          if (!nextOptions.some((option) => option.toLowerCase() === trimmedValue.toLowerCase())) {
            return [trimmedValue, ...nextOptions].slice(0, 20);
          }
          return nextOptions;
        });
      }
    }

    setValidationErrors((prev) => {
      const nextErrors = { ...prev };

      if (field === "name") delete nextErrors["assessment.name"];
      if (field === "type") delete nextErrors["assessment.assessment_type"];
      if (field === "language") delete nextErrors["assessment.default_language"];

      return nextErrors;
    });
  };

  const goToStep = (stepId) => {
    setCurrentStep(stepId);
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const resumeAssessmentId = searchParams.get("id");

  const { loading, detail, detailLoading, detailError } = useSelector((state) => state.assessment);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate("/s-admin/assessment-overview");
    }
  };

  useEffect(() => {
    setForm(INITIAL_FORM);
    setSections(INITIAL_SECTIONS);
    setGrades(INITIAL_GRADES);
    setBlueprintItems([]);
    setCurrentStep(1);
    setValidationErrors({});
    setLastSavedAt(null);

    dispatch(resetAssessmentDetail());

    if (!resumeAssessmentId) {
      return;
    }

    void dispatch(fetchAssessmentDetailSlice(resumeAssessmentId));
  }, [dispatch, resumeAssessmentId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("assessment-name-options", JSON.stringify(assessmentNameOptions));
    }
  }, [assessmentNameOptions]);

  useEffect(() => {
    if (!detail) return;

    const hydrated = hydrateWizardFromDetail(detail);
    setForm(hydrated.form);
    setGrades(hydrated.grades);
    setSections(hydrated.sections);
    setBlueprintItems(hydrated.blueprintItems);
    setCurrentStep(1);
    setValidationErrors({});
    setLastSavedAt(null);
  }, [detail]);

  useEffect(() => {
    if (!detailError) return;
    console.error("Assessment detail fetch failed:", detailError);
  }, [detailError]);

  const handleNext = async () => {
    if (isSavingDraft) return;

    if (currentStep === 1) {
      const stepOneErrors = validateStepOneFields(form);
      if (Object.keys(stepOneErrors).length > 0) {
        setValidationErrors(stepOneErrors);
        return;
      }
    }

    if (currentStep === 2) {
      const stepTwoErrors = validateStepTwoFields(form);
      if (Object.keys(stepTwoErrors).length > 0) {
        setValidationErrors(stepTwoErrors);
        return;
      }
    }

    setValidationErrors({});

    try {
      await persistDraft();
      setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
    } catch (error) {
      console.error("Next step draft save failed:", error);
    }
  };

  const persistDraft = useCallback(async () => {
    setIsSavingDraft(true);

    try {
      const draftPayload = buildAssessmentPayload({ form, grades, sections, blueprintItems, isDraft: true, step: currentStep });
      console.log("Draft save payload:", draftPayload);

      const saveThunk = resumeAssessmentId
        ? updateAssessmentDraftSlice({ id: resumeAssessmentId, payload: draftPayload })
        : publishAssessmentSlice(draftPayload);

      const result = await dispatch(saveThunk).unwrap();
      console.log("Draft save success:", result);

      const nextId = result?.assessment_id ?? result?.id ?? result?.data?.assessment_id;
      if (nextId && !resumeAssessmentId) {
        navigate(`/s-admin/create-assessment?id=${nextId}`, { replace: true });
      }

      setLastSavedAt(new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
      return result;
    } catch (error) {
      console.error("Draft save failed:", error);
      throw error;
    } finally {
      setIsSavingDraft(false);
    }
  }, [currentStep, dispatch, form, grades, navigate, resumeAssessmentId, sections, blueprintItems]);

  const handleDiscardClick = () => {
    setIsDiscardModalOpen(true);
  };

  const handleConfirmDiscard = () => {
    setForm(INITIAL_FORM);
    setSections(INITIAL_SECTIONS);
    setGrades(INITIAL_GRADES);
    setBlueprintItems([]);
    setCurrentStep(1);
    setNewSectionIds(new Set());
    setNewSubsectionIds(new Set());
    setLastSavedAt(null);
    setValidationErrors({});
    setIsDiscardModalOpen(false);
  };

  const handleCancelDiscard = () => {
    setIsDiscardModalOpen(false);
  };

  const handleCancel = () => {
    // Wire this up to navigation (e.g. router.back()).
    console.log("Cancelled assessment creation");
  };

  const handleSaveContinue = async () => {
    if (isSavingDraft) return;
    await handleNext();
  };

  const handlePublish = async () => {
    // Guard against double-submits (e.g. a stray Enter keypress or a second
    // click that lands before React re-renders the disabled button).
    if (loading) return;

    const payload = buildAssessmentPayload({ form, grades, sections, blueprintItems, isDraft: false });
    const { isValid, errors } = validateAssessmentPayload(payload);

    if (!isValid) {
      setValidationErrors(errors);
      // Jump to Review so the error banner is visible, in case Publish was
      // triggered from an earlier step.
      setCurrentStep(6);
      return;
    }

    setValidationErrors({});

    try {
      const result = await dispatch(publishAssessmentSlice(payload)).unwrap();

      console.log("Publish Success:", result);

      // show success toast if required
    } catch (error) {
      console.error("Publish Failed:", error);

      // show error toast if required
    }
  };

  // --- Step 4: Structure (sections & subsections) ---

  const handleAddSection = () => {
    const nextIndex = sections.length + 1;
    const newId = `section-${Date.now()}`;
    setSections((prev) => [
      ...prev,
      {
        id: newId,
        name: `Section ${nextIndex}`,
        sectionCode: `SECTION_${nextIndex}`,
        description: "",
        instructions: "",
        timeLimitMinutes: 0,
        isMandatory: true,
        randomizeQuestions: false,
        subsections: [],
      },
    ]);
    setNewSectionIds((prev) => new Set(prev).add(newId));
  };

  const handleRemoveSection = (sectionId) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
    // A removed section takes its subsections with it — drop any question
    // mappings that pointed at them so Review/publish don't reference
    // orphaned subsection ids.
    setBlueprintItems((prev) => prev.filter((item) => item.sectionId !== sectionId));
  };

  const handleSectionFieldChange = (sectionId, field, value) => {
    setSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section))
    );
  };

  const handleAddSubsection = (sectionId) => {
    const newId = `${sectionId}-sub-${Date.now()}`;
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              subsections: [
                ...section.subsections,
                {
                  id: newId,
                  name: "Untitled Subsection",
                  subsectionCode: `SUB_${section.subsections.length + 1}`,
                  dimensionId: "",
                  questionLimit: 0,
                  description: "Add a short description for this subsection.",
                  instructions: "",
                },
              ],
            }
          : section
      )
    );
    setNewSubsectionIds((prev) => new Set(prev).add(newId));
  };

  const handleRemoveSubsection = (sectionId, subsectionId) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              subsections: section.subsections.filter((sub) => sub.id !== subsectionId),
            }
          : section
      )
    );
    setBlueprintItems((prev) => prev.filter((item) => item.subsectionId !== subsectionId));
  };

  const handleSubsectionFieldChange = (sectionId, subsectionId, field, value) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              subsections: section.subsections.map((sub) =>
                sub.id === subsectionId ? { ...sub, [field]: value } : sub
              ),
            }
          : section
      )
    );
  };

  // --- Delete confirmation flow for sections, subsections & mapped questions ---
  // Clicking the trash icon never deletes right away; it just records what
  // was asked for, and the modal below performs the actual removal only
  // once the user taps "Delete".

  const handleRequestRemoveSection = (sectionId) => {
    setDeleteTarget({ type: "section", sectionId });
  };

  const handleRequestRemoveSubsection = (sectionId, subsectionId) => {
    setDeleteTarget({ type: "subsection", sectionId, subsectionId });
  };

  const handleRequestRemoveBlueprintItem = (itemId) => {
    setDeleteTarget({ type: "blueprintItem", itemId });
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "section") {
      handleRemoveSection(deleteTarget.sectionId);
    } else if (deleteTarget.type === "subsection") {
      handleRemoveSubsection(deleteTarget.sectionId, deleteTarget.subsectionId);
    } else if (deleteTarget.type === "blueprintItem") {
      handleRemoveBlueprintItem(deleteTarget.itemId);
    }

    setDeleteTarget(null);
  };

  // --- Step 3: Grade & Board Mapping ---

  const handleAddGrade = () => {
    setGrades((prev) => [
      ...prev,
      {
        id: `grade-${Date.now()}`,
        grade: "",
        board: "ALL",
        minimumAge: "",
        maximumAge: "",
        isDefault: prev.length === 0,
      },
    ]);
  };

  const handleRemoveGrade = (gradeId) => {
    setGrades((prev) => prev.filter((grade) => grade.id !== gradeId));
  };

  const handleGradeFieldChange = (gradeId, field, value) => {
    setGrades((prev) => prev.map((grade) => (grade.id === gradeId ? { ...grade, [field]: value } : grade)));
  };

  const handleSetDefaultGrade = (gradeId) => {
    setGrades((prev) => prev.map((grade) => ({ ...grade, isDefault: grade.id === gradeId })));
  };

  // --- Step 5: Question Mapping (blueprint items) ---

  const handleAddBlueprintQuestions = (sectionId, subsectionId, questionIds) => {
    const startingSequence = blueprintItems.filter((item) => item.subsectionId === subsectionId).length;
    const newItems = questionIds.map((questionId, index) => ({
      id: `bp-${subsectionId}-${Date.now()}-${index}`,
      sectionId,
      subsectionId,
      questionId,
      sequenceNo: startingSequence + index + 1,
      marksOverride: 1,
      negativeMarksOverride: 0,
      isMandatory: true,
      isRandomizable: false,
      isVisible: true,
      status: "ACTIVE",
    }));
    setBlueprintItems((prev) => [...prev, ...newItems]);
  };

  const handleRemoveBlueprintItem = (itemId) => {
    setBlueprintItems((prev) => {
      const removed = prev.find((item) => item.id === itemId);
      if (!removed) return prev;
      return prev
        .filter((item) => item.id !== itemId)
        .map((item) =>
          item.subsectionId === removed.subsectionId && item.sequenceNo > removed.sequenceNo
            ? { ...item, sequenceNo: item.sequenceNo - 1 }
            : item
        );
    });
  };

  const handleBlueprintFieldChange = (itemId, field, value) => {
    setBlueprintItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  };

  const handleMoveBlueprintItem = (itemId, direction) => {
    setBlueprintItems((prev) => {
      const moved = prev.find((item) => item.id === itemId);
      if (!moved) return prev;

      const siblings = prev
        .filter((item) => item.subsectionId === moved.subsectionId)
        .sort((a, b) => a.sequenceNo - b.sequenceNo);
      const index = siblings.findIndex((item) => item.id === itemId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= siblings.length) return prev;

      const swapWith = siblings[swapIndex];

      return prev.map((item) => {
        if (item.id === moved.id) return { ...item, sequenceNo: swapWith.sequenceNo };
        if (item.id === swapWith.id) return { ...item, sequenceNo: moved.sequenceNo };
        return item;
      });
    });
  };

  return (
    <div className={cn("min-h-screen", adminTheme.surface.page)}>
      <WizardHeader
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
        onPublish={handlePublish}
        isSavingDraft={isSavingDraft}
        isPublishing={loading}
        lastSavedAt={lastSavedAt}
      />

      <div className="flex flex-col md:flex-row">
        <ConfigurationSidebar currentStep={currentStep} onStepClick={goToStep} />

        <main className="flex-1 min-w-0">
          <MobileStepTracker currentStep={currentStep} onStepClick={goToStep} />
          <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-0 lg:px-0">
            {currentStep === 1 && (
              <GeneralInformationCard
                form={form}
                onFieldChange={handleFieldChange}
                validationErrors={validationErrors}
                assessmentNameOptions={assessmentNameOptions}
              />
            )}

            {currentStep === 2 && (
              <VersionSettingsStep form={form} onFieldChange={handleFieldChange} validationErrors={validationErrors} />
            )}

            {currentStep === 3 && (
              <GradeMappingStep
                grades={grades}
                onAddGrade={handleAddGrade}
                onRemoveGrade={handleRemoveGrade}
                onGradeFieldChange={handleGradeFieldChange}
                onSetDefaultGrade={handleSetDefaultGrade}
              />
            )}

            {currentStep === 4 && (
              <StructureStep
                sections={sections}
                newSectionIds={newSectionIds}
                newSubsectionIds={newSubsectionIds}
                onAddSection={handleAddSection}
                onRequestRemoveSection={handleRequestRemoveSection}
                onSectionFieldChange={handleSectionFieldChange}
                onAddSubsection={handleAddSubsection}
                onSubsectionFieldChange={handleSubsectionFieldChange}
                onRequestRemoveSubsection={handleRequestRemoveSubsection}
              />
            )}

            {currentStep === 5 && (
              <QuestionMappingStep
                sections={sections}
                blueprintItems={blueprintItems}
                onAddQuestions={handleAddBlueprintQuestions}
                onFieldChange={handleBlueprintFieldChange}
                onToggleVisibility={handleBlueprintFieldChange}
                onRequestRemove={handleRequestRemoveBlueprintItem}
                onMoveItem={handleMoveBlueprintItem}
              />
            )}

            {currentStep === 6 && (
              <ReviewStep
                form={form}
                grades={grades}
                sections={sections}
                blueprintItems={blueprintItems}
                isPublishing={loading}
                validationErrors={validationErrors}
                assessmentTypeLabels={ASSESSMENT_TYPE_LABELS}
                onGoToStep={goToStep}
                onPublish={handlePublish}
              />
            )}

            <WizardFooter
              onDiscard={handleDiscardClick}
              onCancel={handleCancel}
              onSaveContinue={handleSaveContinue}
              isLastStep={isLastStep}
              isSavingDraft={isSavingDraft}
            />
          </div>
        </main>
      </div>

      <ConfirmModal
        open={isDiscardModalOpen}
        title="Discard this draft?"
        description="This will permanently clear everything you've entered — Assessment & Version details, Grade Mapping, Sections & Subsections, and Question Mapping. This action can't be undone."
        confirmLabel="Discard Draft"
        cancelLabel="Keep Editing"
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === "section"
            ? "Delete this section?"
            : deleteTarget?.type === "subsection"
              ? "Delete this subsection?"
              : "Remove this question?"
        }
        description={
          deleteTarget?.type === "section"
            ? "This will permanently remove the section, all of its subsections, and any questions mapped to them. This action can't be undone."
            : deleteTarget?.type === "subsection"
              ? "This will permanently remove this subsection and any questions mapped to it. This action can't be undone."
              : "This will remove the selected question from this subsection's mapping."
        }
        confirmLabel={deleteTarget?.type === "blueprintItem" ? "Remove" : "Delete"}
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default CreateAssessment;

// import { useState, useEffect, useRef, useCallback } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   ArrowRight,
//   Check,
//   Clock,
//   Percent,
//   Info,
//   Trash2,
//   Pencil,
//   GripVertical,
//   HelpCircle,
//   Plus,
//   ChevronRight,
//   ChevronDown,
//   AlertTriangle,
//   Loader2,
//   CheckCircle2,
//   Circle,
//   X,
//   GraduationCap,
//   Rocket,
//   Eye,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { adminTheme } from "@/theme/adminTheme";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   publishAssessmentSlice,
//   updateAssessmentDraftSlice,
//   fetchAssessmentDetailSlice,
//   resetAssessmentDetail,
// } from "@/slices/assessmentSlice";



// // ---- Step config ------------------------------------------------------

// const STEPS = [
//   {
//     id: 1,
//     label: "General Info",
//     description: "Assessment basics",
//     headerTitle: "Create New Assessment",
//     headerSubtitle: "Step 1 of 5: Assessment Configuration",
//   },
//   {
//     id: 2,
//     label: "Version Settings",
//     description: "Duration & availability",
//     headerTitle: "Configure Version Settings",
//     headerSubtitle: "Step 2 of 5: Assessment Version Configuration",
//   },
//   {
//     id: 3,
//     label: "Grade Mapping",
//     description: "Eligible grades & boards",
//     headerTitle: "Map Grades & Boards",
//     headerSubtitle: "Step 3 of 5: Assessment Version Grade Mapping",
//   },
//   {
//     id: 4,
//     label: "Structure",
//     description: "Sections & Subsections",
//     headerTitle: "Configure Assessment Structure",
//     headerSubtitle: "Step 4 of 5: Sections & Subsections",
//   },
//   {
//     id: 5,
//     label: "Review",
//     description: "Final check",
//     headerTitle: "Review Assessment",
//     headerSubtitle: "Final Step: Verification & Launch",
//   },
// ];

// // assessments.assessment_type
// const ASSESSMENT_TYPES = [
//   { value: "", label: "Select Assessment Type" },
//   { value: "CAREER", label: "Career" },
//   { value: "APTITUDE", label: "Aptitude" },
//   { value: "INTEREST", label: "Interest" },
//   { value: "PERSONALITY", label: "Personality" },
//   { value: "PSYCHOMETRIC", label: "Psychometric" },
//   { value: "LEARNING_STYLE", label: "Learning Style" },
//   { value: "CUSTOM", label: "Custom" },
// ];


// const ASSESSMENT_TYPE_LABELS = ASSESSMENT_TYPES.reduce((acc, option) => {
//   if (option.value) acc[option.value] = option.label;
//   return acc;
// }, {});

// const VALID_ASSESSMENT_TYPES = ASSESSMENT_TYPES.map((o) => o.value).filter(Boolean);

// const DEFAULT_ASSESSMENT_NAME_OPTIONS = [
//   "Career Assessment – Grade 10",
//   "Aptitude Assessment – Grade 9",
//   "Interest Assessment – Grade 8",
//   "Psychometric Assessment – Grade 11",
// ];

// // assessments.default_language
// const LANGUAGES = [
//   { value: "English", label: "English" },
//   { value: "Hindi", label: "Hindi" },
//   { value: "Spanish", label: "Spanish" },
//   { value: "French", label: "French" },
// ];

// // assessment_version_grade_mapping.grade (backed by grades master)
// const GRADE_OPTIONS = [
//   { value: "", label: "Select Grade" },
//   { value: "GRADE_6", label: "Grade 6" },
//   { value: "GRADE_7", label: "Grade 7" },
//   { value: "GRADE_8", label: "Grade 8" },
//   { value: "GRADE_9", label: "Grade 9" },
//   { value: "GRADE_10", label: "Grade 10" },
//   { value: "GRADE_11", label: "Grade 11" },
//   { value: "GRADE_12", label: "Grade 12" },
//   { value: "UG", label: "Undergraduate" },
//   { value: "PG", label: "Postgraduate" },
// ];

// const GRADE_LABELS = GRADE_OPTIONS.reduce((acc, option) => {
//   if (option.value) acc[option.value] = option.label;
//   return acc;
// }, {});

// // assessment_version_grade_mapping.board
// const BOARD_OPTIONS = [
//   { value: "ALL", label: "All Boards" },
//   { value: "CBSE", label: "CBSE" },
//   { value: "ICSE", label: "ICSE" },
//   { value: "STATE", label: "State Board" },
//   { value: "IB", label: "IB" },
//   { value: "IGCSE", label: "IGCSE" },
// ];

// const VALID_BOARDS = BOARD_OPTIONS.map((o) => o.value);

// // dimensions (referenced by subsections.dimension_id)
// const DIMENSION_OPTIONS = [
//   { value: "", label: "No Primary Dimension" },
//   { value: "LOGICAL", label: "Logical Reasoning" },
//   { value: "NUMERICAL", label: "Numerical Ability" },
//   { value: "VERBAL", label: "Verbal Ability" },
//   { value: "SPATIAL", label: "Spatial Ability" },
//   { value: "REALISTIC", label: "Realistic (Interest)" },
//   { value: "INVESTIGATIVE", label: "Investigative (Interest)" },
//   { value: "ARTISTIC", label: "Artistic (Interest)" },
//   { value: "SOCIAL", label: "Social (Interest)" },
//   { value: "ENTERPRISING", label: "Enterprising (Interest)" },
//   { value: "CONVENTIONAL", label: "Conventional (Interest)" },
//   { value: "OPENNESS", label: "Openness (Personality)" },
//   { value: "CONSCIENTIOUSNESS", label: "Conscientiousness (Personality)" },
//   { value: "EXTRAVERSION", label: "Extraversion (Personality)" },
//   { value: "AGREEABLENESS", label: "Agreeableness (Personality)" },
//   { value: "NEUROTICISM", label: "Neuroticism (Personality)" },
// ];

// // sections.name — predefined section catalog
// const SECTION_NAME_OPTIONS = [
//   { value: "", label: "Select Section" },
//   { value: "Aptitude", label: "Aptitude" },
// ];

// // subsections.name — predefined subsection catalog
// const SUBSECTION_NAME_OPTIONS = [
//   { value: "", label: "Select Subsection" },
//   { value: "Logical Reasoning", label: "Logical Reasoning" },
//   { value: "Numerical Aptitude", label: "Numerical Aptitude" },
//   { value: "Verbal Ability", label: "Verbal Ability" },
//   { value: "Spatial Ability", label: "Spatial Ability" },
//   { value: "Interest Inventory", label: "Interest Inventory" },
//   { value: "Personality Assessment", label: "Personality Assessment" },
//   { value: "Custom Section", label: "Custom Section" },
// ];

// const DIMENSION_LABELS = DIMENSION_OPTIONS.reduce((acc, option) => {
//   if (option.value) acc[option.value] = option.label;
//   return acc;
// }, {});

// // assessments + assessment_versions (Step 1 form)
// const INITIAL_FORM = {
//   // assessments
//   name: "",
//   shortName: "", // short_name
//   type: "", // assessment_type
//   language: "English", // default_language
//   description: "", // internal description

//   // assessment_versions
//   versionNumber: "V1.0", // version_number
//   versionName: "", // version_name
//   effectiveFrom: "", // effective_from
//   effectiveTo: "", // effective_to
//   duration: 60, // duration_minutes
//   minQualifyingPercentage: 40, // minimum_qualifying_percentage
//   minQualifyingMarks: "", // minimum_qualifying_marks
//   instructions: "", // candidate-facing instructions
//   allowResume: true, // allow_resume
//   allowReview: true, // allow_review
//   randomizeSections: false, // randomize_sections
//   randomizeQuestions: false, // randomize_questions
//   showResultImmediately: false, // show_result_immediately
// };

// // sections + nested subsections (Step 3)
// const INITIAL_SECTIONS = [
//   {
//     id: "section-1",
//     name: "Logical Reasoning", // sections.name
//     sectionCode: "LOGICAL", // sections.section_code
//     description: "",
//     instructions: "",
//     timeLimitMinutes: 20, // sections.time_limit_minutes
//     isMandatory: true, // sections.is_mandatory
//     randomizeQuestions: false, // sections.randomize_questions
//     subsections: [
//       {
//         id: "section-1-sub-1",
//         name: "Pattern Recognition", // subsections.name
//         subsectionCode: "PATTERN", // subsections.subsection_code
//         dimensionId: "LOGICAL", // subsections.dimension_id
//         questionLimit: 10, // subsections.question_limit
//         description: "Focuses on visual sequences and pattern completion.",
//         instructions: "",
//       },
//       {
//         id: "section-1-sub-2",
//         name: "Syllogisms & Deduction",
//         subsectionCode: "SYLLOGISM",
//         dimensionId: "LOGICAL",
//         questionLimit: 5,
//         description: "Analytical thinking and logical inference.",
//         instructions: "",
//       },
//     ],
//   },
//   {
//     id: "section-2",
//     name: "Numerical Aptitude",
//     sectionCode: "NUMERICAL",
//     description: "",
//     instructions: "",
//     timeLimitMinutes: 25,
//     isMandatory: true,
//     randomizeQuestions: false,
//     subsections: [],
//   },
// ];

// // assessment_version_grade_mapping (Step 2)
// const INITIAL_GRADES = [
//   {
//     id: "grade-1",
//     grade: "GRADE_6",
//     board: "CBSE",
//     minimumAge: 11,
//     maximumAge: 13,
//     isDefault: false,
//   },
//   {
//     id: "grade-2",
//     grade: "GRADE_9",
//     board: "CBSE",
//     minimumAge: 14,
//     maximumAge: 15,
//     isDefault: true,
//   },
//   {
//     id: "grade-3",
//     grade: "GRADE_11",
//     board: "CBSE",
//     minimumAge: 16,
//     maximumAge: 17,
//     isDefault: false,
//   },
// ];

// // TODO: the wizard has no report-template picker yet, but
// // assessment_versions.report_template is a required FK on the backend.
// // Wire up a real selector once the template list is available and stop
// // relying on this constant.
// const DEFAULT_REPORT_TEMPLATE_ID = 1;

// const normalizeLanguageValue = (languageValue) => {
//   if (!languageValue) return "English";

//   const normalized = String(languageValue).trim();
//   const matchedLanguage = LANGUAGES.find(
//     (option) => option.value.toLowerCase() === normalized.toLowerCase()
//   );

//   if (matchedLanguage) return matchedLanguage.value;

//   const shortCode = normalized.slice(0, 2).toLowerCase();
//   if (shortCode === "en") return "English";
//   if (shortCode === "hi") return "Hindi";
//   if (shortCode === "es") return "Spanish";
//   if (shortCode === "fr") return "French";

//   return normalized;
// };

// const hydrateWizardFromDetail = (detail) => {
//   const assessment = detail?.assessment ?? detail?.data?.assessment ?? detail?.results?.assessment ?? detail;
//   const version = detail?.assessment_version ?? detail?.data?.assessment_version ?? detail?.version ?? detail?.data?.version ?? {};
//   const gradesSource = detail?.grades ?? detail?.assessment_version_grade_mapping ?? detail?.data?.grades ?? detail?.data?.assessment_version_grade_mapping ?? [];
//   const sectionsSource = detail?.sections ?? detail?.data?.sections ?? [];

//   const nextForm = {
//     ...INITIAL_FORM,
//     name: assessment?.name ?? assessment?.assessment_name ?? "",
//     shortName: assessment?.short_name ?? "",
//     type: assessment?.assessment_type ?? "",
//     language: normalizeLanguageValue(assessment?.default_language ?? assessment?.language),
//     description: assessment?.description ?? "",
//     versionNumber: version?.version_number ?? "V1.0",
//     versionName: version?.version_name ?? "",
//     effectiveFrom: version?.effective_from ?? version?.release_date ?? "",
//     effectiveTo: version?.effective_to ?? "",
//     duration: version?.duration_minutes ?? INITIAL_FORM.duration,
//     minQualifyingPercentage:
//       version?.minimum_qualifying_percentage ?? INITIAL_FORM.minQualifyingPercentage,
//     minQualifyingMarks: version?.minimum_qualifying_marks ?? "",
//     instructions: version?.instructions ?? "",
//     allowResume: version?.allow_resume ?? INITIAL_FORM.allowResume,
//     allowReview: version?.allow_review ?? INITIAL_FORM.allowReview,
//     randomizeSections: version?.randomize_sections ?? INITIAL_FORM.randomizeSections,
//     randomizeQuestions: version?.randomize_questions ?? INITIAL_FORM.randomizeQuestions,
//     showResultImmediately: version?.show_result_immediately ?? INITIAL_FORM.showResultImmediately,
//   };

//   const nextGrades = (Array.isArray(gradesSource) ? gradesSource : []).map((grade, index) => ({
//     id: `${grade?.grade_code ?? "grade"}-${index + 1}`,
//     grade: grade?.grade_code ?? "",
//     board: grade?.board ?? "ALL",
//     minimumAge: grade?.minimum_age ?? "",
//     maximumAge: grade?.maximum_age ?? "",
//     isDefault: Boolean(grade?.is_default),
//   }));

//   const nextSections = (Array.isArray(sectionsSource) ? sectionsSource : []).map((section, sectionIndex) => ({
//     id: section?.id ?? `section-${sectionIndex + 1}`,
//     name: section?.name ?? "",
//     sectionCode: section?.section_code ?? "",
//     description: section?.description ?? "",
//     instructions: section?.instructions ?? "",
//     timeLimitMinutes: section?.time_limit_minutes ?? 0,
//     isMandatory: section?.is_mandatory ?? true,
//     randomizeQuestions: section?.randomize_questions ?? false,
//     subsections: (Array.isArray(section?.subsections) ? section.subsections : []).map((sub, subIndex) => ({
//       id: sub?.id ?? `${section?.id ?? `section-${sectionIndex + 1}`}-sub-${subIndex + 1}`,
//       name: sub?.name ?? "",
//       subsectionCode: sub?.subsection_code ?? "",
//       dimensionId: sub?.dimension || sub?.dimension_id || "",
//       questionLimit: sub?.question_limit ?? 0,
//       description: sub?.description ?? "",
//       instructions: sub?.instructions ?? "",
//     })),
//   }));

//   return {
//     form: nextForm,
//     grades: nextGrades.length > 0 ? nextGrades : INITIAL_GRADES,
//     sections: nextSections.length > 0 ? nextSections : INITIAL_SECTIONS,
//   };
// };

// // ---------------------------------------------------------------------------
// // Payload builder — transforms wizard state (form, grades, sections) into the
// // exact snake_case shape the publish API expects.
// // ---------------------------------------------------------------------------

// const educationLevelForGrade = (gradeCode) => {
//   if (gradeCode === "UG") return "UG";
//   if (gradeCode === "PG") return "PG";
//   return "SCHOOL";
// };

// // TODO: dimensions.id is a numeric FK on the backend, but DIMENSION_OPTIONS
// // above only has string codes (e.g. "LOGICAL"). Until this page fetches the
// // real dimension list and stores numeric ids, the code is passed straight
// // through — confirm with backend whether it accepts codes or needs ids.
// const resolveDimensionId = (dimensionCode) => dimensionCode || null;

// const buildAssessmentPayload = ({ form, grades, sections, isDraft = false, step = undefined }) => {
//   const totalSections = sections.length;
//   const totalSubsections = sections.reduce((sum, s) => sum + s.subsections.length, 0);
//   const totalQuestions = sections.reduce(
//     (sum, s) => sum + s.subsections.reduce((subSum, sub) => subSum + (Number(sub.questionLimit) || 0), 0),
//     0
//   );

//   const includeGrades = step === undefined ? true : step >= 2;
//   const includeSections = step === undefined ? true : step >= 3;

//   // TODO: marks-per-question aren't collected anywhere in the wizard yet
//   // (that lives on assessment_blueprint_items once real questions are
//   // attached). This assumes 1 mark per question, matching the example
//   // payload (60 questions -> 60 total_marks).
//   const totalMarks = totalQuestions;

//   const minQualifyingMarks =
//     form.minQualifyingMarks !== "" && form.minQualifyingMarks != null
//       ? Number(form.minQualifyingMarks)
//       : form.minQualifyingPercentage
//         ? Math.round((Number(form.minQualifyingPercentage) / 100) * totalMarks)
//         : null;

//   const payload = {
//     is_draft: isDraft,

//     assessment: {
//       name: form.name?.trim() || "",
//       short_name: form.shortName?.trim() || "",
//       assessment_type: form.type || "",
//       description: form.description?.trim() || "",
//       default_language: (form.language || "").toLowerCase().slice(0, 2) || "en",
//     },

//     assessment_version: {
//       report_template: DEFAULT_REPORT_TEMPLATE_ID,
//       version_number: form.versionNumber?.trim() || "",
//       version_name: form.versionName?.trim() || "",
//       release_date: form.effectiveFrom || null,
//       effective_from: form.effectiveFrom || null,
//       effective_to: form.effectiveTo || null,
//       duration_minutes: Number(form.duration) || 0,
//       total_sections: totalSections,
//       total_subsections: totalSubsections,
//       total_questions: totalQuestions,
//       total_marks: totalMarks,
//       minimum_qualifying_marks: minQualifyingMarks,
//       minimum_qualifying_percentage:
//         form.minQualifyingPercentage !== "" && form.minQualifyingPercentage != null
//           ? Number(form.minQualifyingPercentage)
//           : null,
//       allow_resume: Boolean(form.allowResume),
//       allow_review: Boolean(form.allowReview),
//       randomize_sections: Boolean(form.randomizeSections),
//       randomize_questions: Boolean(form.randomizeQuestions),
//       show_result_immediately: Boolean(form.showResultImmediately),
//       instructions: form.instructions?.trim() || "",
//       status: isDraft ? "DRAFT" : "PUBLISHED",
//     },
//   };

//   if (includeGrades) {
//     payload.grades = grades.map((g) => ({
//       grade_code: g.grade || "",
//       grade_name: GRADE_LABELS[g.grade] || "",
//       education_level: educationLevelForGrade(g.grade),
//       display_order: 1,
//       board: g.board || "ALL",
//       minimum_age: g.minimumAge !== "" && g.minimumAge != null ? Number(g.minimumAge) : null,
//       maximum_age: g.maximumAge !== "" && g.maximumAge != null ? Number(g.maximumAge) : null,
//       is_default: Boolean(g.isDefault),
//       status: "ACTIVE",
//     }));
//   }

//   if (includeSections) {
//     payload.sections = sections.map((section, sectionIndex) => ({
//       section_code: section.sectionCode?.trim() || "",
//       name: section.name?.trim() || "",
//       description: section.description?.trim() || "",
//       instructions: section.instructions?.trim() || "",
//       display_order: sectionIndex + 1,
//       time_limit_minutes: Number(section.timeLimitMinutes) || 0,
//       is_mandatory: Boolean(section.isMandatory),
//       randomize_questions: Boolean(section.randomizeQuestions),
//       status: "ACTIVE",
//       subsections: section.subsections.map((sub, subIndex) => ({
//         dimension: resolveDimensionId(sub.dimensionId),
//         subsection_code: sub.subsectionCode?.trim() || "",
//         name: sub.name?.trim() || "",
//         description: sub.description?.trim() || "",
//         instructions: sub.instructions?.trim() || "",
//         display_order: subIndex + 1,
//         question_limit: Number(sub.questionLimit) || 0,
//         status: "ACTIVE",
//       })),
//     }));
//   }

//   return payload;
// };

// // ---------------------------------------------------------------------------
// // Validator — checks the built payload against the required (✅) columns on
// // assessments / assessment_versions / assessment_version_grade_mapping /
// // sections / subsections. Returns a flat field-path -> message map so it's
// // easy to surface next to the relevant field.
// // ---------------------------------------------------------------------------

// const validateStepOneFields = (form) => {
//   const errors = {};

//   if (!form.name?.trim()) {
//     errors["assessment.name"] = "Assessment name is required.";
//   }

//   if (!form.type) {
//     errors["assessment.assessment_type"] = "Assessment type is required.";
//   }

//   if (!form.language) {
//     errors["assessment.default_language"] = "Default language is required.";
//   }

//   return errors;
// };

// const validateStepTwoFields = (form) => {
//   const errors = {};

//   if (!form.effectiveFrom) {
//     errors["assessment_version.effective_from"] = "Effective-from date is required.";
//   }

//   if (!form.duration || Number(form.duration) <= 0) {
//     errors["assessment_version.duration_minutes"] = "Duration must be greater than 0 minutes.";
//   }

//   return errors;
// };

// const validateAssessmentPayload = (payload) => {
//   const errors = {};

//   // ---- assessments ----
//   if (!payload.assessment.name) {
//     errors["assessment.name"] = "Assessment name is required.";
//   } else if (payload.assessment.name.length > 255) {
//     errors["assessment.name"] = "Assessment name must be 255 characters or fewer.";
//   }

//   if (!payload.assessment.assessment_type) {
//     errors["assessment.assessment_type"] = "Assessment type is required.";
//   } else if (!VALID_ASSESSMENT_TYPES.includes(payload.assessment.assessment_type)) {
//     errors["assessment.assessment_type"] = "Assessment type is not a recognized value.";
//   }

//   if (!payload.assessment.default_language) {
//     errors["assessment.default_language"] = "Default language is required.";
//   }

//   // ---- assessment_versions ----
//   if (!payload.assessment_version.report_template) {
//     errors["assessment_version.report_template"] = "A report template must be selected.";
//   }

//   if (!payload.assessment_version.version_number) {
//     errors["assessment_version.version_number"] = "Version number is required.";
//   }

//   if (!payload.assessment_version.effective_from) {
//     errors["assessment_version.effective_from"] = "Effective-from date is required.";
//   }

//   if (
//     payload.assessment_version.effective_to &&
//     payload.assessment_version.effective_from &&
//     payload.assessment_version.effective_to < payload.assessment_version.effective_from
//   ) {
//     errors["assessment_version.effective_to"] = "Effective-to date cannot be before effective-from.";
//   }

//   if (!payload.assessment_version.duration_minutes || payload.assessment_version.duration_minutes <= 0) {
//     errors["assessment_version.duration_minutes"] = "Duration must be greater than 0 minutes.";
//   }

//   if (!payload.assessment_version.total_marks || payload.assessment_version.total_marks <= 0) {
//     errors["assessment_version.total_marks"] =
//       "Total marks must be greater than 0 — add at least one subsection with a question limit.";
//   }

//   if (payload.assessment_version.total_questions <= 0) {
//     errors["assessment_version.total_questions"] =
//       "At least one subsection needs a question limit greater than 0.";
//   }

//   const pct = payload.assessment_version.minimum_qualifying_percentage;
//   if (pct != null && (pct < 0 || pct > 100)) {
//     errors["assessment_version.minimum_qualifying_percentage"] = "Qualifying percentage must be between 0 and 100.";
//   }

//   // ---- assessment_version_grade_mapping ----
//   if (!payload.grades.length) {
//     errors["grades"] = "At least one grade mapping is required.";
//   } else {
//     const defaultCount = payload.grades.filter((g) => g.is_default).length;
//     if (defaultCount === 0) {
//       errors["grades.default"] = "One grade mapping must be marked as default.";
//     } else if (defaultCount > 1) {
//       errors["grades.default"] = "Only one grade mapping can be marked as default.";
//     }

//     const seen = new Set();
//     payload.grades.forEach((g, i) => {
//       if (!g.grade_code) {
//         errors[`grades[${i}].grade_code`] = "Grade is required.";
//       } else {
//         const key = `${g.grade_code}::${g.board}`;
//         if (seen.has(key)) {
//           errors[`grades[${i}].duplicate`] = `Duplicate mapping for ${g.grade_code} / ${g.board}.`;
//         }
//         seen.add(key);
//       }

//       if (!VALID_BOARDS.includes(g.board)) {
//         errors[`grades[${i}].board`] = "Board is not a recognized value.";
//       }

//       if (g.minimum_age != null && g.maximum_age != null && g.minimum_age > g.maximum_age) {
//         errors[`grades[${i}].age_range`] = "Minimum age cannot be greater than maximum age.";
//       }
//     });
//   }

//   // ---- sections / subsections ----
//   if (!payload.sections.length) {
//     errors["sections"] = "At least one section is required.";
//   } else {
//     const sectionCodes = new Set();
//     payload.sections.forEach((section, sIndex) => {
//       if (!section.name) {
//         errors[`sections[${sIndex}].name`] = "Section name is required.";
//       }
//       if (!section.section_code) {
//         errors[`sections[${sIndex}].section_code`] = "Section code is required.";
//       } else if (sectionCodes.has(section.section_code)) {
//         errors[`sections[${sIndex}].section_code`] = `Section code "${section.section_code}" is used more than once.`;
//       } else {
//         sectionCodes.add(section.section_code);
//       }

//       if (section.time_limit_minutes < 0) {
//         errors[`sections[${sIndex}].time_limit_minutes`] = "Time limit cannot be negative.";
//       }

//       const subCodes = new Set();
//       section.subsections.forEach((sub, subIndex) => {
//         if (!sub.name) {
//           errors[`sections[${sIndex}].subsections[${subIndex}].name`] = "Subsection name is required.";
//         }
//         if (!sub.subsection_code) {
//           errors[`sections[${sIndex}].subsections[${subIndex}].subsection_code`] = "Subsection code is required.";
//         } else if (subCodes.has(sub.subsection_code)) {
//           errors[`sections[${sIndex}].subsections[${subIndex}].subsection_code`] =
//             `Subsection code "${sub.subsection_code}" is used more than once in this section.`;
//         } else {
//           subCodes.add(sub.subsection_code);
//         }

//         if (sub.question_limit <= 0) {
//           errors[`sections[${sIndex}].subsections[${subIndex}].question_limit`] =
//             "Question limit should be greater than 0.";
//         }
//       });
//     });
//   }

//   return { isValid: Object.keys(errors).length === 0, errors };
// };

// // ---- Small building blocks ---------------------------------------------

// const FieldLabel = ({ children, required }) => (
//   <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
//     {children}
//     {required && <span className={cn(adminTheme.text.danger, "ml-0.5")}>*</span>}
//   </label>
// );

// const TextInput = ({ id, value, onChange, placeholder, disabled, required = false, error }) => (
//   <div>
//     <input
//       id={id}
//       type="text"
//       value={value}
//       onChange={onChange}
//       placeholder={placeholder}
//       disabled={disabled}
//       required={required}
//       className={cn(
//         "h-11 w-full text-sm",
//         adminTheme.radius.md,
//         adminTheme.border.default,
//         "border px-3 text-slate-900 placeholder:text-slate-400",
//         "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//         disabled && "bg-slate-50 text-slate-400",
//         error && "border-red-300 focus:ring-red-200"
//       )}
//     />
//     {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
//   </div>
// );

// const AssessmentNameField = ({ id, value, onChange, placeholder, required = false, error, options = [] }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [inputValue, setInputValue] = useState(value || "");

//   useEffect(() => {
//     setInputValue(value || "");
//   }, [value]);

//   const filteredOptions = options.filter((option) => {
//     const normalizedValue = String(value || "").trim().toLowerCase();
//     const normalizedOption = option.toLowerCase();

//     if (!normalizedValue) {
//       return true;
//     }

//     return normalizedOption.includes(normalizedValue);
//   });

//   const handleInputChange = (event) => {
//     const nextValue = event.target.value;
//     setInputValue(nextValue);
//     onChange(event);
//     setIsOpen(true);
//   };

//   const handleSelectOption = (option) => {
//     const syntheticEvent = {
//       target: {
//         value: option,
//       },
//     };

//     setInputValue(option);
//     onChange(syntheticEvent);
//     setIsOpen(false);
//   };

//   return (
//     <div className="relative">
//       <div className="relative">
//         <input
//           id={id}
//           type="text"
//           value={value}
//           onChange={handleInputChange}
//           placeholder={placeholder}
//           required={required}
//           className={cn(
//             "h-11 w-full pr-10 text-sm",
//             adminTheme.radius.md,
//             adminTheme.border.default,
//             "border px-3 text-slate-900 placeholder:text-slate-400",
//             "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//             error && "border-red-300 focus:ring-red-200"
//           )}
//           onFocus={() => setIsOpen(true)}
//           onBlur={() => {
//             window.setTimeout(() => setIsOpen(false), 120);
//           }}
//         />
//         <button
//           type="button"
//           onMouseDown={(event) => {
//             event.preventDefault();
//             setIsOpen((prev) => !prev);
//           }}
//           className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-400 transition hover:text-slate-600"
//           aria-label="Toggle assessment name options"
//         >
//           <ChevronDown className="h-4 w-4" />
//         </button>
//       </div>

//       {isOpen && filteredOptions.length > 0 && (
//         <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
//           {filteredOptions.map((option) => (
//             <button
//               key={option}
//               type="button"
//               onMouseDown={(event) => event.preventDefault()}
//               onClick={() => handleSelectOption(option)}
//               className="flex min-h-9 w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
//             >
//               <span className="truncate">{option}</span>
//             </button>
//           ))}
//         </div>
//       )}

//       {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
//     </div>
//   );
// };

// const DateInput = ({ id, value, onChange, error }) => (
//   <div>
//     <input
//       id={id}
//       type="date"
//       value={value}
//       onChange={onChange}
//       className={cn(
//         "h-11 w-full text-sm",
//         adminTheme.radius.md,
//         adminTheme.border.default,
//         "border px-3 text-slate-900",
//         "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//         error && "border-red-300 focus:ring-red-200"
//       )}
//     />
//     {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
//   </div>
// );

// const SelectInput = ({ id, value, onChange, options, required = false, error }) => (
//   <div>
//     <select
//       id={id}
//       value={value}
//       onChange={onChange}
//       required={required}
//       className={cn(
//         "h-11 w-full text-sm",
//         adminTheme.radius.md,
//         adminTheme.border.default,
//         "border bg-white px-3 text-slate-900",
//         "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//         error && "border-red-300 focus:ring-red-200"
//       )}
//     >
//       {options.map((option) => (
//         <option key={option.value} value={option.value}>
//           {option.label}
//         </option>
//       ))}
//     </select>
//     {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
//   </div>
// );

// const NumberInput = ({ id, value, onChange, icon: Icon, suffix, error }) => (
//   <div>
//     <div className="relative">
//       <input
//         id={id}
//         type="number"
//         value={value}
//         onChange={onChange}
//         className={cn(
//           "h-11 w-full text-sm",
//           adminTheme.radius.md,
//           adminTheme.border.default,
//           "border px-3 pr-10 text-slate-900",
//           "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//           error && "border-red-300 focus:ring-red-200"
//         )}
//       />
//       {Icon && (
//         <Icon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//       )}
//       {suffix && (
//         <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
//           {suffix}
//         </span>
//       )}
//     </div>
//     {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
//   </div>
// );

// const Checkbox = ({ id, checked, onChange, title, description }) => (
//   <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
//     <input
//       id={id}
//       type="checkbox"
//       checked={checked}
//       onChange={onChange}
//       className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
//     />
//     <span>
//       <span className="block text-sm font-semibold text-slate-900">{title}</span>
//       <span className="block text-xs text-slate-400">{description}</span>
//     </span>
//   </label>
// );

// // ---- Sidebar ------------------------------------------------------------

// const StepIndicator = ({ step, isActive, isComplete, onClick }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     className={cn(
//       "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
//       isActive ? adminTheme.nav.active : adminTheme.nav.inactive
//     )}
//   >
//     <span
//       className={cn(
//         "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
//         isComplete
//           ? "border-slate-900 bg-slate-900 text-white"
//           : isActive
//             ? "border-slate-900 bg-white text-slate-900 shadow-sm"
//             : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300"
//       )}
//     >
//       {isComplete ? <Check className="h-3.5 w-3.5" /> : step.id}
//     </span>
//     <span className="min-w-0">
//       <span
//         className={cn(
//           "block truncate text-sm font-semibold",
//           isActive || isComplete ? adminTheme.text.primary : "text-slate-400"
//         )}
//       >
//         {step.label}
//       </span>
//       <span className={cn("block truncate text-xs", isActive ? "text-slate-500" : adminTheme.text.muted)}>
//         {step.description}
//       </span>
//     </span>
//   </button>
// );

// const ConfigurationSidebar = ({ currentStep, onStepClick }) => {
//   const completedCount = currentStep - 1;
//   const progressPercent = Math.round((completedCount / STEPS.length) * 100);

//   return (
//     <aside
//       className={cn(
//         "sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r bg-white p-5 md:flex lg:w-72 lg:p-6 xl:w-80",
//         adminTheme.border.default
//       )}
//     >
//       <div className="flex items-center justify-between">
//         <p className={adminTheme.nav.groupLabel}>Configuration Progress</p>
//         <span className={adminTheme.badge.neutral}>{progressPercent}%</span>
//       </div>

//       <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
//         <div
//           className="h-full rounded-full bg-slate-900 transition-all duration-300"
//           style={{ width: `${progressPercent}%` }}
//         />
//       </div>

//       <div className="relative mt-6 space-y-1">
//         {STEPS.map((step, index) => (
//           <div key={step.id} className="relative">
//             {index !== STEPS.length - 1 && (
//               <span
//                 className={cn(
//                   "absolute left-[22.5px] top-10 h-[calc(100%-16px)] w-px",
//                   step.id < currentStep ? "bg-slate-900" : "bg-slate-200"
//                 )}
//               />
//             )}
//             <StepIndicator
//               step={step}
//               isActive={step.id === currentStep}
//               isComplete={step.id < currentStep}
//               onClick={() => onStepClick(step.id)}
//             />
//           </div>
//         ))}
//       </div>

//       <div className={cn(adminTheme.radius.lg, "mt-8 border p-4", adminTheme.border.default, adminTheme.surface.subtle)}>
//         <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
//           <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-slate-500">
//             <Info className="h-3 w-3" />
//           </span>
//           Quick Tip
//         </p>
//         <p className="mt-2 text-xs leading-relaxed text-slate-500">
//           Versions are immutable once published — every change to sections, grade
//           mapping, or scoring after that point creates a new version.
//         </p>
//       </div>
//     </aside>
//   );
// };

// // Compact horizontal step tracker shown below md, so progress stays visible
// // even where there isn't room for the full vertical sidebar.
// const MobileStepTracker = ({ currentStep, onStepClick }) => {
//   const completedCount = currentStep - 1;
//   const progressPercent = Math.round((completedCount / STEPS.length) * 100);

//   return (
//     <div className={cn("sticky top-16 z-40 border-b bg-white md:hidden", adminTheme.border.default)}>
//       <div className="h-1 w-full bg-slate-100">
//         <div
//           className="h-full bg-slate-900 transition-all duration-300"
//           style={{ width: `${progressPercent}%` }}
//         />
//       </div>

//       <div className="flex items-center gap-1 overflow-x-auto px-3 py-2.5">
//         {STEPS.map((step, index) => {
//           const isActive = step.id === currentStep;
//           const isComplete = step.id < currentStep;

//           return (
//             <div key={step.id} className="flex shrink-0 items-center gap-1">
//               <button
//                 type="button"
//                 onClick={() => onStepClick(step.id)}
//                 className={cn(
//                   "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors",
//                   isActive ? adminTheme.nav.active : "text-slate-400 hover:bg-slate-50"
//                 )}
//               >
//                 <span
//                   className={cn(
//                     "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
//                     isComplete
//                       ? "border-slate-900 bg-slate-900 text-white"
//                       : isActive
//                         ? "border-slate-900 text-slate-900"
//                         : "border-slate-200 text-slate-400"
//                   )}
//                 >
//                   {isComplete ? <Check className="h-3 w-3" /> : step.id}
//                 </span>
//                 <span className={cn("whitespace-nowrap", isActive && adminTheme.text.primary)}>
//                   {step.label}
//                 </span>
//               </button>
//               {index !== STEPS.length - 1 && (
//                 <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// // ---- Step 1: General Info (assessments) --------------------------------

// const GeneralInformationCard = ({ form, onFieldChange, validationErrors = {}, assessmentNameOptions = [] }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <h2 className="text-lg font-semibold text-slate-900">General Information</h2>
//     <p className={cn(adminTheme.card.subtitle, "mt-1")}>
//       Provide the essential information about your assessment.
//     </p>

//     <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
//       <div>
//         <FieldLabel required>Assessment Name</FieldLabel>
//         <AssessmentNameField
//           id="name"
//           value={form.name}
//           onChange={(e) => onFieldChange("name", e.target.value)}
//           placeholder="e.g. Career Assessment – Grade 10"
//           required
//           options={assessmentNameOptions}
//           error={validationErrors["assessment.name"]}
//         />
//       </div>

//       <div>
//         <FieldLabel>Short Name</FieldLabel>
//         <TextInput
//           id="shortName"
//           value={form.shortName}
//           onChange={(e) => onFieldChange("shortName", e.target.value)}
//           placeholder="e.g. Career G10"
//         />
//       </div>

//       <div>
//         <FieldLabel required>Assessment Type</FieldLabel>
//         <SelectInput
//           id="type"
//           value={form.type}
//           onChange={(e) => onFieldChange("type", e.target.value)}
//           options={ASSESSMENT_TYPES}
//           required
//           error={validationErrors["assessment.assessment_type"]}
//         />
//       </div>

//       <div>
//         <FieldLabel required>Default Language</FieldLabel>
//         <SelectInput
//           id="language"
//           value={form.language}
//           onChange={(e) => onFieldChange("language", e.target.value)}
//           options={LANGUAGES}
//           required
//           error={validationErrors["assessment.default_language"]}
//         />
//       </div>

//       <div className="sm:col-span-2">
//         <FieldLabel>Internal Description</FieldLabel>
//         <textarea
//           id="description"
//           rows={4}
//           value={form.description}
//           onChange={(e) => onFieldChange("description", e.target.value)}
//           placeholder="Briefly describe the purpose of this assessment (internal use only)..."
//           className={cn(
//             "w-full resize-none text-sm",
//             adminTheme.radius.md,
//             adminTheme.border.default,
//             "border px-3 py-2.5 text-slate-900 placeholder:text-slate-400",
//             "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
//           )}
//         />
//       </div>
//     </div>
//   </div>
// );

// const VersionSettingsCard = ({ form, onFieldChange, validationErrors = {} }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <div className="flex flex-wrap items-start justify-between gap-3">
//       <div>
//         <h2 className="text-lg font-semibold text-slate-900">Version Settings</h2>
//         <p className={cn(adminTheme.card.subtitle, "mt-1")}>
//           Fill in the assessment version details below and review them carefully before publishing.
//         </p>
//       </div>
//       <span className={adminTheme.badge.neutral}>{form.versionNumber || "New Version"}</span>
//     </div>

//     <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
//       <div>
//         <FieldLabel required>Version Number</FieldLabel>
//         <TextInput
//           id="versionNumber"
//           value={form.versionNumber}
//           onChange={(e) => onFieldChange("versionNumber", e.target.value)}
//           placeholder="V1.0"
//           error={validationErrors["assessment_version.version_number"]}
//         />
//       </div>
//       <div>
//         <FieldLabel>Version Name</FieldLabel>
//         <TextInput
//           id="versionName"
//           value={form.versionName}
//           onChange={(e) => onFieldChange("versionName", e.target.value)}
//           placeholder="2026 Edition"
//         />
//       </div>
//       <div>
//         <FieldLabel required>Effective From</FieldLabel>
//         <DateInput
//           id="effectiveFrom"
//           value={form.effectiveFrom}
//           onChange={(e) => onFieldChange("effectiveFrom", e.target.value)}
//           error={validationErrors["assessment_version.effective_from"]}
//         />
//       </div>
//       <div>
//         <FieldLabel>Effective To</FieldLabel>
//         <DateInput
//           id="effectiveTo"
//           value={form.effectiveTo}
//           onChange={(e) => onFieldChange("effectiveTo", e.target.value)}
//         />
//       </div>
//     </div>

//     {/* <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
//       <div>
//         <FieldLabel required>Duration (mins)</FieldLabel>
//         <NumberInput
//           id="duration"
//           value={form.duration}
//           onChange={(e) => onFieldChange("duration", e.target.value)}
//           icon={Clock}
//           error={validationErrors["assessment_version.duration_minutes"]}
//         />
//       </div>
//       <div>
//         <FieldLabel>Min. Qualifying %</FieldLabel>
//         <NumberInput
//           id="minQualifyingPercentage"
//           value={form.minQualifyingPercentage}
//           onChange={(e) => onFieldChange("minQualifyingPercentage", e.target.value)}
//           icon={Percent}
//         />
//       </div>
//       <div>
//         <FieldLabel>Min. Qualifying Marks</FieldLabel>
//         <NumberInput
//           id="minQualifyingMarks"
//           value={form.minQualifyingMarks}
//           onChange={(e) => onFieldChange("minQualifyingMarks", e.target.value)}
//         />
//       </div>
//     </div> */}

//     <div className="mt-5">
//       <FieldLabel>Candidate Instructions</FieldLabel>
//       <textarea
//         id="instructions"
//         rows={3}
//         value={form.instructions}
//         onChange={(e) => onFieldChange("instructions", e.target.value)}
//         placeholder="Shown to the candidate before they start this version, e.g. 'Read each question carefully.'"
//         className={cn(
//           "w-full resize-none text-sm",
//           adminTheme.radius.md,
//           adminTheme.border.default,
//           "border px-3 py-2.5 text-slate-900 placeholder:text-slate-400",
//           "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
//         )}
//       />
//     </div>

//     <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
//       <div>
//         <p className={cn(adminTheme.nav.groupLabel, "mb-4")}>Runtime Behavior</p>
//         <div className="space-y-4">
//           <Checkbox
//             id="allowResume"
//             checked={form.allowResume}
//             onChange={(e) => onFieldChange("allowResume", e.target.checked)}
//             title="Allow resume"
//             description="Candidate can resume an interrupted attempt."
//           />
//           <Checkbox
//             id="allowReview"
//             checked={form.allowReview}
//             onChange={(e) => onFieldChange("allowReview", e.target.checked)}
//             title="Allow review before submission"
//             description="Candidate can revisit answers before submitting."
//           />
//           <Checkbox
//             id="randomizeSections"
//             checked={form.randomizeSections}
//             onChange={(e) => onFieldChange("randomizeSections", e.target.checked)}
//             title="Randomize sections"
//             description="Shuffle section order per candidate."
//           />

//         </div>
//       </div>

//       <div>
//         <p className={cn(adminTheme.nav.groupLabel, "mb-4")}>Reporting</p>
//         <div className="space-y-4">
//           <Checkbox
//             id="showResultImmediately"
//             checked={form.showResultImmediately}
//             onChange={(e) => onFieldChange("showResultImmediately", e.target.checked)}
//             title="Show result immediately"
//             description="Display pass/fail status to candidate after submission."
//           />
//         </div>
//       </div>
//     </div>
//   </div>
// );

// // ---- Step 2: Grade & Board Mapping (assessment_version_grade_mapping) ----

// const GradeRow = ({ grade, onFieldChange, onSetDefault, onRemove }) => (
//   <div
//     className={cn(
//       "flex items-start gap-3 border p-4",
//       adminTheme.border.default,
//       adminTheme.radius.lg
//     )}
//   >
//     <GripVertical className="mt-3 h-4 w-4 shrink-0 cursor-grab text-slate-300" />

//     <div className="min-w-0 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-12">
//       <div className="sm:col-span-4">
//         <FieldLabel required>Grade</FieldLabel>
//         <SelectInput
//           id={`${grade.id}-grade`}
//           value={grade.grade}
//           onChange={(e) => onFieldChange(grade.id, "grade", e.target.value)}
//           options={GRADE_OPTIONS}
//         />
//       </div>

//       <div className="sm:col-span-3">
//         <FieldLabel>Board</FieldLabel>
//         <SelectInput
//           id={`${grade.id}-board`}
//           value={grade.board}
//           onChange={(e) => onFieldChange(grade.id, "board", e.target.value)}
//           options={BOARD_OPTIONS}
//         />
//       </div>

//       <div className="sm:col-span-2">
//         <FieldLabel>Min. Age</FieldLabel>
//         <NumberInput
//           id={`${grade.id}-minAge`}
//           value={grade.minimumAge}
//           onChange={(e) => onFieldChange(grade.id, "minimumAge", e.target.value)}
//         />
//       </div>

//       <div className="sm:col-span-2">
//         <FieldLabel>Max. Age</FieldLabel>
//         <NumberInput
//           id={`${grade.id}-maxAge`}
//           value={grade.maximumAge}
//           onChange={(e) => onFieldChange(grade.id, "maximumAge", e.target.value)}
//         />
//       </div>

//       <div className="flex items-end sm:col-span-1">
//         <label htmlFor={`${grade.id}-default`} className="flex cursor-pointer items-center gap-2 pb-2.5">
//           <input
//             id={`${grade.id}-default`}
//             type="radio"
//             name="default-grade-mapping"
//             checked={grade.isDefault}
//             onChange={() => onSetDefault(grade.id)}
//             className="h-4 w-4 shrink-0 border-slate-300 text-slate-900 focus:ring-slate-900/20"
//           />
//           <span className="text-xs font-semibold text-slate-500">Default</span>
//         </label>
//       </div>
//     </div>

//     <button
//       type="button"
//       onClick={() => onRemove(grade.id)}
//       className="mt-1 shrink-0 rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
//       aria-label="Remove grade mapping"
//     >
//       <Trash2 className="h-4 w-4" />
//     </button>
//   </div>
// );

// const AddGradeButton = ({ onClick }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     className={cn(adminTheme.actionButton.secondary, "w-full justify-center border-dashed")}
//   >
//     <Plus className="h-4 w-4" />
//     Add Grade / Board Mapping
//   </button>
// );

// const GradeMappingStep = ({ grades, onAddGrade, onRemoveGrade, onGradeFieldChange, onSetDefaultGrade }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <div className="flex items-start gap-3">
//       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
//         <GraduationCap className="h-5 w-5" />
//       </span>
//       <div>
//         <h2 className="text-lg font-semibold text-slate-900">Grade & Board Mapping</h2>
//         <p className={cn(adminTheme.card.subtitle, "mt-1")}>
//           Assign the grades and boards that this assessment will be available to.
//         </p>
//       </div>
//     </div>

//     <div className="mt-6 space-y-4">
//       {grades.map((grade) => (
//         <GradeRow
//           key={grade.id}
//           grade={grade}
//           onFieldChange={onGradeFieldChange}
//           onSetDefault={onSetDefaultGrade}
//           onRemove={onRemoveGrade}
//         />
//       ))}

//       <AddGradeButton onClick={onAddGrade} />
//     </div>
//   </div>
// );

// // ---- Step 3: Structure (sections & subsections) --------------------------

// const SubsectionRow = ({ subsection, isNew, onFieldChange, onRequestRemove }) => {
//   const [isEditing, setIsEditing] = useState(isNew);

//   return (
//     <div
//       className={cn(
//         "group relative flex items-start gap-3 border border-dashed p-3.5 transition-colors",
//         adminTheme.border.default,
//         adminTheme.radius.lg,
//         !isEditing && "hover:border-slate-300"
//       )}
//     >
//       <GripVertical className="mt-3 h-4 w-4 shrink-0 cursor-grab text-slate-300" />

//       {isEditing ? (
//         <div className="min-w-0 flex-1 space-y-3 pr-16">
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
//             <div className="sm:col-span-5">
//               <FieldLabel>Subsection Name</FieldLabel>
//               <SelectInput
//                 id={`${subsection.id}-name`}
//                 value={subsection.name}
//                 onChange={(e) => onFieldChange(subsection.id, "name", e.target.value)}
//                 options={SUBSECTION_NAME_OPTIONS}
//               />
//             </div>
//             <div className="sm:col-span-3">
//               <FieldLabel>Subsection Code</FieldLabel>
//               <TextInput
//                 id={`${subsection.id}-code`}
//                 value={subsection.subsectionCode}
//                 onChange={(e) => onFieldChange(subsection.id, "subsectionCode", e.target.value)}
//                 placeholder="PATTERN"
//               />
//             </div>
//             <div className="sm:col-span-4">
//               <FieldLabel>Primary Dimension</FieldLabel>
//               <SelectInput
//                 id={`${subsection.id}-dimension`}
//                 value={subsection.dimensionId}
//                 onChange={(e) => onFieldChange(subsection.id, "dimensionId", e.target.value)}
//                 options={DIMENSION_OPTIONS}
//               />
//             </div>
//           </div>
//           <div>
//             <FieldLabel>Question Limit</FieldLabel>
//             <NumberInput
//               id={`${subsection.id}-limit`}
//               value={subsection.questionLimit}
//               onChange={(e) => onFieldChange(subsection.id, "questionLimit", e.target.value)}
//             />
//           </div>
//           <div>
//             <FieldLabel>Short Description</FieldLabel>
//             <TextInput
//               id={`${subsection.id}-description`}
//               value={subsection.description}
//               onChange={(e) => onFieldChange(subsection.id, "description", e.target.value)}
//               placeholder="Short description"
//             />
//           </div>
//           <div>
//             <FieldLabel>Instructions</FieldLabel>
//             <textarea
//               id={`${subsection.id}-instructions`}
//               rows={3}
//               value={subsection.instructions}
//               onChange={(e) => onFieldChange(subsection.id, "instructions", e.target.value)}
//               placeholder="Add subsection instructions for students"
//               className={cn(
//                 "w-full resize-none text-sm",
//                 adminTheme.radius.md,
//                 adminTheme.border.default,
//                 "border px-3 py-2 text-slate-900 placeholder:text-slate-400",
//                 "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
//               )}
//             />
//           </div>
//           <div className="sm:col-span-6">
//             <Checkbox
//               id={`${subsection.id}-randomize`}
//               checked={subsection.randomizeQuestions}
//               onChange={(e) => onFieldChange(subsection.id, "randomizeQuestions", e.target.checked)}
//               title="Randomize questions"
//               description="Shuffle question order within this subsection."
//             />
//           </div>
//         </div>
//       ) : (
//         <div className="min-w-0 flex-1 pr-16">
//           <p className="truncate text-sm font-semibold text-slate-900">
//             {subsection.name || "Untitled Subsection"}
//           </p>
//           <p className="mt-1 truncate text-xs text-slate-400">
//             {subsection.description || "No description added yet."}
//           </p>
//           <p className="mt-1 line-clamp-2 text-xs text-slate-500">
//             {subsection.instructions || "No instructions added yet."}
//           </p>
//           <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
//             {subsection.dimensionId && (
//               <span className={adminTheme.badge.neutral}>{DIMENSION_LABELS[subsection.dimensionId]}</span>
//             )}
//             <span className="text-xs text-slate-400">Max {subsection.questionLimit || 0} questions</span>
//           </div>
//         </div>
//       )}

//       <div
//         className={cn(
//           "absolute right-3 top-3 flex shrink-0 items-center gap-1 transition-opacity",
//           isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
//         )}
//       >
//         {isEditing ? (
//           <button
//             type="button"
//             onClick={() => setIsEditing(false)}
//             className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50"
//             aria-label="Done editing subsection"
//           >
//             <Check className="h-4 w-4" />
//           </button>
//         ) : (
//           <button
//             type="button"
//             onClick={() => setIsEditing(true)}
//             className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
//             aria-label="Edit subsection"
//           >
//             <Pencil className="h-4 w-4" />
//           </button>
//         )}
//         <button
//           type="button"
//           onClick={() => onRequestRemove(subsection.id)}
//           className="rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
//           aria-label="Delete subsection"
//         >
//           <Trash2 className="h-4 w-4" />
//         </button>
//       </div>
//     </div>
//   );
// };

// const AddSubsectionButton = ({ onClick }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     className={cn(
//       "flex w-full items-center justify-center gap-1.5 border border-dashed p-3.5 text-sm font-medium text-slate-400",
//       "hover:border-slate-300 hover:text-slate-600",
//       adminTheme.border.default,
//       adminTheme.radius.lg
//     )}
//   >
//     <Plus className="h-3.5 w-3.5" />
//     Add Subsection
//   </button>
// );

// const SectionCard = ({
//   section,
//   isNew,
//   newSubsectionIds,
//   onFieldChange,
//   onRequestRemove,
//   onAddSubsection,
//   onSubsectionFieldChange,
//   onRequestRemoveSubsection,
// }) => {
//   const [isEditing, setIsEditing] = useState(isNew);
//   const questionLimitTotal = section.subsections.reduce(
//     (sum, sub) => sum + (Number(sub.questionLimit) || 0),
//     0
//   );

//   return (
//     <div className="relative pl-5">
//       <span className="absolute left-0 top-0.5 bottom-0.5 w-1 rounded-full bg-slate-900" />

//       <div className={cn(adminTheme.card.base, adminTheme.shadow.sm, "group relative p-5")}>
//         <div
//           className={cn(
//             "absolute right-4 top-4 flex shrink-0 items-center gap-1 transition-opacity",
//             isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
//           )}
//         >
//           {isEditing ? (
//             <button
//               type="button"
//               onClick={() => setIsEditing(false)}
//               className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50"
//               aria-label="Done editing section"
//             >
//               <Check className="h-4 w-4" />
//             </button>
//           ) : (
//             <button
//               type="button"
//               onClick={() => setIsEditing(true)}
//               className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
//               aria-label="Edit section"
//             >
//               <Pencil className="h-4 w-4" />
//             </button>
//           )}
//           <button
//             type="button"
//             onClick={() => onRequestRemove(section.id)}
//             className="rounded-md p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
//             aria-label="Delete section"
//           >
//             <Trash2 className="h-4 w-4" />
//           </button>
//         </div>

//         <div className="flex items-start gap-3 pr-16">
//           <GripVertical className="mt-1 h-4 w-4 shrink-0 cursor-grab text-slate-300" />

//           {isEditing ? (
//             <div className="min-w-0 flex-1 grid grid-cols-1 gap-3 sm:grid-cols-12">
//               <div className="sm:col-span-5">
//                 <FieldLabel>Section Name</FieldLabel>
//                 <SelectInput
//                   id={`${section.id}-name`}
//                   value={section.name}
//                   onChange={(e) => onFieldChange(section.id, "name", e.target.value)}
//                   options={SECTION_NAME_OPTIONS}
//                 />
//               </div>
//               <div className="sm:col-span-3">
//                 <FieldLabel>Section Code</FieldLabel>
//                 <TextInput
//                   id={`${section.id}-code`}
//                   value={section.sectionCode}
//                   onChange={(e) => onFieldChange(section.id, "sectionCode", e.target.value)}
//                   placeholder="APTITUDE"
//                 />
//               </div>
//               <div className="sm:col-span-4">
//                 <FieldLabel>Time Limit (mins)</FieldLabel>
//                 <NumberInput
//                   id={`${section.id}-timeLimit`}
//                   value={section.timeLimitMinutes}
//                   onChange={(e) => onFieldChange(section.id, "timeLimitMinutes", e.target.value)}
//                   icon={Clock}
//                 />
//               </div>
//               <div className="sm:col-span-12">
//                 <TextInput
//                   id={`${section.id}-description`}
//                   value={section.description}
//                   onChange={(e) => onFieldChange(section.id, "description", e.target.value)}
//                   placeholder="Short description"
//                 />
//               </div>
//               <div className="sm:col-span-6">
//                 <Checkbox
//                   id={`${section.id}-mandatory`}
//                   checked={section.isMandatory}
//                   onChange={(e) => onFieldChange(section.id, "isMandatory", e.target.checked)}
//                   title="Mandatory section"
//                   description="Candidate must attempt this section."
//                 />
//               </div>
//               {/* <div className="sm:col-span-6">
//                 <Checkbox
//                   id={`${section.id}-randomize`}
//                   checked={section.randomizeQuestions}
//                   onChange={(e) => onFieldChange(section.id, "randomizeQuestions", e.target.checked)}
//                   title="Randomize questions"
//                   description="Shuffle question order within this section."
//                 />
//               </div> */}
//             </div>
//           ) : (
//             <div className="min-w-0 flex-1">
//               <h3 className="truncate text-base font-semibold text-slate-900">
//                 {section.name || "Untitled Section"}
//               </h3>
//               <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
//                 <span className="inline-flex items-center gap-1">
//                   <Clock className="h-3.5 w-3.5" />
//                   {section.timeLimitMinutes} Mins
//                 </span>
//                 <span className="text-slate-300">&bull;</span>
//                 <span className="inline-flex items-center gap-1">
//                   <HelpCircle className="h-3.5 w-3.5" />
//                   Up to {questionLimitTotal || 0} Questions
//                 </span>
//                 <span className="text-slate-300">&bull;</span>
//                 <span>{section.isMandatory ? "Mandatory" : "Optional"}</span>
//                 {section.randomizeQuestions && (
//                   <>
//                     <span className="text-slate-300">&bull;</span>
//                     <span>Randomized</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="mt-4 space-y-3 pl-7">
//           {section.subsections.map((subsection) => (
//             <SubsectionRow
//               key={subsection.id}
//               subsection={subsection}
//               isNew={newSubsectionIds.has(subsection.id)}
//               onFieldChange={(subsectionId, field, value) =>
//                 onSubsectionFieldChange(section.id, subsectionId, field, value)
//               }
//               onRequestRemove={(subsectionId) => onRequestRemoveSubsection(section.id, subsectionId)}
//             />
//           ))}
//           <AddSubsectionButton onClick={() => onAddSubsection(section.id)} />
//         </div>
//       </div>
//     </div>
//   );
// };

// const StructureStep = ({
//   sections,
//   newSectionIds,
//   newSubsectionIds,
//   onAddSection,
//   onRequestRemoveSection,
//   onSectionFieldChange,
//   onAddSubsection,
//   onSubsectionFieldChange,
//   onRequestRemoveSubsection,
// }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
//       Define Assessment Structure
//     </h2>
//     <p className={cn(adminTheme.card.subtitle, "mt-1 text-sm")}>
//       Organize your assessment by adding sections and subsections. Set the maximum number of questions for each subsection. You can edit or remove any section or subsection before publishing.
//     </p>

//     <div className="mt-6 space-y-6">
//       {sections.map((section) => (
//         <SectionCard
//           key={section.id}
//           section={section}
//           isNew={newSectionIds.has(section.id)}
//           newSubsectionIds={newSubsectionIds}
//           onFieldChange={onSectionFieldChange}
//           onRequestRemove={onRequestRemoveSection}
//           onAddSubsection={onAddSubsection}
//           onSubsectionFieldChange={onSubsectionFieldChange}
//           onRequestRemoveSubsection={onRequestRemoveSubsection}
//         />
//       ))}

//       <button
//         type="button"
//         onClick={onAddSection}
//         className={cn(adminTheme.actionButton.secondary, "w-full justify-center border-dashed")}
//       >
//         <Plus className="h-4 w-4" />
//         Add Section
//       </button>
//     </div>
//   </div>
// );

// // ---- Step 4: Review & Publish ---------------------------------------------

// const ReadyToPublishBanner = ({ isReady }) => (
//   <div
//     className={cn(
//       "flex items-start gap-4 rounded-xl border p-5",
//       isReady ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"
//     )}
//   >
//     <span
//       className={cn(
//         "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
//         isReady ? "bg-emerald-500 text-white" : "bg-amber-400 text-white"
//       )}
//     >
//       {isReady ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
//     </span>
//     <div>
//       <h2 className={cn("text-lg font-semibold", isReady ? "text-emerald-900" : "text-amber-900")}>
//         {isReady ? "Assessment Ready to Publish" : "A Few Things Need Attention"}
//       </h2>
//       <p className={cn("mt-1 text-sm", isReady ? "text-emerald-800/80" : "text-amber-800/80")}>
//         {isReady
//           ? "We've validated the assessment, version, grade mapping, and structure. Everything looks great!"
//           : "Some required fields are still missing — check the checklist on the right before publishing."}
//       </p>
//     </div>
//   </div>
// );

// const SummaryRow = ({ label, children }) => (
//   <div>
//     <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
//     <div className="mt-1.5 text-base font-semibold text-slate-900">{children}</div>
//   </div>
// );

// const AssessmentDetailsSummaryCard = ({ form, onEdit }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <div className="flex items-center justify-between">
//       <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
//         Assessment Details
//       </p>
//       <button
//         type="button"
//         onClick={onEdit}
//         className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
//       >
//         Edit Details
//       </button>
//     </div>

//     <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
//       <SummaryRow label="Name">{form.name || "Untitled Assessment"}</SummaryRow>
//       <SummaryRow label="Short Name">{form.shortName || "—"}</SummaryRow>
//       <SummaryRow label="Type">
//         {form.type ? (
//           <span className={adminTheme.badge.neutral}>{ASSESSMENT_TYPE_LABELS[form.type]}</span>
//         ) : (
//           <span className="text-sm font-normal text-slate-400">Not set</span>
//         )}
//       </SummaryRow>
//       <SummaryRow label="Language">{form.language}</SummaryRow>
//     </div>
//   </div>
// );

// const VersionSettingsSummaryCard = ({ form, onEdit }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <div className="flex items-center justify-between">
//       <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
//         Version Settings
//       </p>
//       <button
//         type="button"
//         onClick={onEdit}
//         className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
//       >
//         Edit Version
//       </button>
//     </div>

//     <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
//       <SummaryRow label="Version">{form.versionNumber || "—"}</SummaryRow>
//       <SummaryRow label="Version Name">{form.versionName || "—"}</SummaryRow>
//       <SummaryRow label="Effective From">{form.effectiveFrom || "—"}</SummaryRow>
//       <SummaryRow label="Effective To">{form.effectiveTo || "—"}</SummaryRow>
//     </div>
//   </div>
// );

// const GradeMappingSummaryCard = ({ grades, onEdit }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <div className="flex items-center justify-between">
//       <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Grade &amp; Board Mapping</p>
//       <button
//         type="button"
//         onClick={onEdit}
//         className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
//       >
//         Edit Grades
//       </button>
//     </div>

//     <div className="mt-4 divide-y divide-slate-100">
//       {grades.map((grade) => (
//         <div key={grade.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
//           <div className="min-w-0">
//             <p className="truncate text-sm font-semibold text-slate-900">
//               {GRADE_LABELS[grade.grade] || "Untitled Grade"}
//               {grade.isDefault && (
//                 <span className={cn(adminTheme.badge.neutral, "ml-2 align-middle")}>Default</span>
//               )}
//             </p>
//             <p className="mt-0.5 truncate text-xs text-slate-400">
//               {grade.board} &middot; Ages {grade.minimumAge}–{grade.maximumAge}
//             </p>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// const StructureTimingCard = ({ sections, onEdit }) => {
//   const totalSubsections = sections.reduce((sum, section) => sum + section.subsections.length, 0);
//   const totalQuestionLimit = sections.reduce(
//     (sum, section) =>
//       sum + section.subsections.reduce((subSum, sub) => subSum + (Number(sub.questionLimit) || 0), 0),
//     0
//   );

//   return (
//     <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//       <div className="flex items-center justify-between">
//         <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Structure &amp; Timing</p>
//         <button
//           type="button"
//           onClick={onEdit}
//           className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
//         >
//           Edit Structure
//         </button>
//       </div>

//       <div className="mt-4 divide-y divide-slate-100">
//         {sections.map((section, index) => (
//           <div key={section.id} className="flex items-center gap-4 py-4 first:pt-0">
//             <span
//               className={cn(
//                 "flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold text-slate-400",
//                 adminTheme.radius.md,
//                 "bg-slate-50"
//               )}
//             >
//               {String(index + 1).padStart(2, "0")}
//             </span>
//             <div className="min-w-0 flex-1">
//               <p className="truncate text-sm font-semibold text-slate-900">{section.name}</p>
//               <p className="mt-0.5 truncate text-xs text-slate-400">
//                 {section.subsections.length} Subsections &middot; Up to{" "}
//                 {section.subsections.reduce((sum, sub) => sum + (Number(sub.questionLimit) || 0), 0)}{" "}
//                 Questions
//               </p>
//             </div>
//             <span className="shrink-0 text-sm font-semibold text-slate-900">
//               {section.timeLimitMinutes} Mins
//             </span>
//           </div>
//         ))}
//       </div>

//       <div
//         className={cn(
//           "mt-4 flex items-center justify-between border-t pt-4",
//           adminTheme.border.default
//         )}
//       >
//         <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
//           {sections.length} Sections &middot; {totalSubsections} Subsections
//         </span>
//         <span className="text-base font-bold text-slate-900">Up to {totalQuestionLimit} Questions</span>
//       </div>
//     </div>
//   );
// };

// const ChecklistItem = ({ title, description, isComplete, isOptional }) => (
//   <div className="flex items-start gap-3">
//     {isComplete ? (
//       <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
//     ) : (
//       <Circle className={cn("mt-0.5 h-5 w-5 shrink-0", isOptional ? "text-slate-300" : "text-amber-400")} />
//     )}
//     <div className="min-w-0">
//       <p className="text-sm font-semibold text-slate-900">{title}</p>
//       <p className="mt-0.5 text-xs text-slate-400">{description}</p>
//     </div>
//   </div>
// );

// const LaunchChecklistCard = ({ checklist }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <p className="text-base font-semibold text-slate-900">Launch Checklist</p>
//     <div className="mt-5 space-y-4">
//       {checklist.map((item) => (
//         <ChecklistItem key={item.title} {...item} />
//       ))}
//     </div>
//   </div>
// );

// // Surfaces the flat field-path -> message map from validateAssessmentPayload
// // whenever a publish attempt was blocked. Purely presentational — the state
// // living in CreateAssessment decides when this is populated / cleared.
// const ValidationErrorsBanner = ({ errors }) => {
//   const messages = Object.values(errors);
//   if (!messages.length) return null;

//   return (
//     <div className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50 p-5">
//       <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
//         <AlertTriangle className="h-6 w-6" />
//       </span>
//       <div className="min-w-0">
//         <h2 className="text-lg font-semibold text-red-900">
//           Fix {messages.length} {messages.length === 1 ? "issue" : "issues"} before publishing
//         </h2>
//         <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800/90">
//           {messages.map((message, index) => (
//             <li key={index}>{message}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// // Publish button now respects two independent gates: the launch checklist
// // (isReady) and whether a publish request is currently in flight
// // (isPublishing, driven by state.assessment.loading). Either one disables
// // it, and the label/spinner reflect which state we're in so a slow network
// // doesn't invite a second click.
// const ReadyToLaunchCard = ({ isReady, isPublishing, onPublish }) => {
//   const isDisabled = !isReady || isPublishing;

//   return (
//     <div className={cn(adminTheme.callout.base)}>
//       <p className={cn(adminTheme.callout.title)}>
//         <Info className="h-4 w-4" />
//         Ready to Launch?
//       </p>
//       <p className={cn(adminTheme.callout.body)}>
//         Once published, this assessment version will be available for candidate assignments. Grade mapping
//         and structure will be locked.
//       </p>
//       <button
//         type="button"
//         onClick={onPublish}
//         disabled={isDisabled}
//         className={cn(adminTheme.callout.button, isDisabled && adminTheme.callout.buttonDisabled)}
//       >
//         {isPublishing ? (
//           <>
//             <Loader2 className="h-4 w-4 animate-spin" />
//             Publishing...
//           </>
//         ) : (
//           "Publish Version"
//         )}
//       </button>
//     </div>
//   );
// };

// const ReviewStep = ({ form, grades, sections, isPublishing, validationErrors, onGoToStep, onPublish }) => {
//   const checklist = [
//     {
//       title: "Assessment Details",
//       description:
//         form.name && form.type
//           ? "Name and type are all set."
//           : "Name or type is missing.",
//       isComplete: Boolean(form.name && form.type),
//     },
//     {
//       title: "Version Settings",
//       description: "Duration, qualifying score, and effective date set.",
//       isComplete: Boolean(form.duration && form.effectiveFrom),
//     },
//     {
//       title: "Grade & Board Mapping",
//       description:
//         grades.length > 0 ? "At least one grade mapping is configured." : "Add at least one grade mapping.",
//       isComplete: grades.length > 0,
//     },
//     {
//       title: "Section Hierarchy",
//       description: sections.length > 0 ? "Valid structure with timings." : "Add at least one section.",
//       isComplete: sections.length > 0,
//     },
//     {
//       title: "Candidate Instructions",
//       description: form.instructions
//         ? "Candidate-facing instructions added."
//         : "Optional: no candidate instructions added yet.",
//       isComplete: Boolean(form.instructions),
//       isOptional: true,
//     },
//   ];

//   const isReady = checklist.filter((item) => !item.isOptional).every((item) => item.isComplete);

//   return (
//     <div className="space-y-6">
//       <ReadyToPublishBanner isReady={isReady} />
//       <ValidationErrorsBanner errors={validationErrors} />

//       <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//         <div className="space-y-6 lg:col-span-2">
//           <AssessmentDetailsSummaryCard form={form} onEdit={() => onGoToStep(1)} />
//           <VersionSettingsSummaryCard form={form} onEdit={() => onGoToStep(2)} />
//           <GradeMappingSummaryCard grades={grades} onEdit={() => onGoToStep(3)} />
//           <StructureTimingCard sections={sections} onEdit={() => onGoToStep(4)} />
//         </div>

//         <div className="space-y-6">
//           <LaunchChecklistCard checklist={checklist} />
//           <ReadyToLaunchCard isReady={isReady} isPublishing={isPublishing} onPublish={onPublish} />
//         </div>
//       </div>
//     </div>
//   );
// };

// // ---- Confirmation modal & toast -------------------------------------------

// const ConfirmModal = ({ open, title, description, confirmLabel, cancelLabel = "Cancel", onConfirm, onCancel }) => {
//   if (!open) return null;

//   return (
//     <div
//       className={cn("fixed inset-0 z-[100] flex items-center justify-center p-4", adminTheme.surface.overlay)}
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="confirm-modal-title"
//       onClick={onCancel}
//     >
//       <div
//         className={cn(adminTheme.card.base, adminTheme.shadow.xl, "w-full max-w-sm p-6")}
//         onClick={(event) => event.stopPropagation()}
//       >
//         <div className="flex items-start justify-between gap-3">
//           <div className="flex items-start gap-3">
//             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
//               <AlertTriangle className="h-5 w-5 text-red-600" />
//             </span>
//             <div className="min-w-0">
//               <h3 id="confirm-modal-title" className="text-base font-semibold text-slate-900">
//                 {title}
//               </h3>
//               <p className="mt-1 text-sm text-slate-500">{description}</p>
//             </div>
//           </div>
//           <button
//             type="button"
//             onClick={onCancel}
//             className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
//             aria-label="Close confirmation dialog"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>

//         <div className="mt-6 flex items-center justify-end gap-3">
//           <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
//             {cancelLabel}
//           </button>
//           <button
//             type="button"
//             onClick={onConfirm}
//             className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
//           >
//             {confirmLabel}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ---- Header & footer ------------------------------------------------------

// const WizardHeader = ({ currentStep, onBack, onNext, onPublish, isSavingDraft, isPublishing, lastSavedAt }) => {
//   const step = STEPS.find((s) => s.id === currentStep);
//   const isLastStep = currentStep === STEPS.length;

//   return (
//     <header
//       className={cn(
//         "sticky top-0 z-50 flex items-center justify-between gap-2 border-b bg-white px-3 sm:px-6",
//         adminTheme.border.default,
//         adminTheme.layout.headerHeight
//       )}
//     >
//       <div className="flex min-w-0 items-center gap-2 sm:gap-3">
//         <button
//           type="button"
//           onClick={onBack}
//           className={cn(adminTheme.button.icon, "shrink-0")}
//           aria-label="Go back"
//         >
//           <ArrowLeft className="h-4 w-4" />
//         </button>
//         <div className="min-w-0">
//           <h1 className="truncate text-sm font-semibold text-slate-900">{step.headerTitle}</h1>
//           <p className="truncate text-xs text-slate-400">{step.headerSubtitle}</p>
//         </div>
//       </div>

//       {isLastStep ? (
//         <div className="flex shrink-0 items-center gap-2 sm:gap-4">
//           <span className="hidden items-center gap-1.5 text-sm font-medium text-slate-400 sm:inline-flex">
//             <Eye className="h-4 w-4" />
//             Preview Mode
//           </span>
//           <button
//             type="button"
//             onClick={onPublish}
//             disabled={isPublishing}
//             className={cn(
//               "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:px-4 sm:py-2.5",
//               isPublishing && "cursor-not-allowed opacity-60"
//             )}
//           >
//             {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
//             <span className="hidden sm:inline">{isPublishing ? "Publishing..." : "Publish Assessment"}</span>
//             <span className="sm:hidden">{isPublishing ? "Publishing..." : "Publish"}</span>
//           </button>
//         </div>
//       ) : (
//         <div className="flex shrink-0 items-center gap-2 sm:gap-4">
//           <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 sm:inline-flex">
//             {isSavingDraft ? (
//               <>
//                 <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                 Saving...
//               </>
//             ) : (
//               lastSavedAt && (
//                 <>
//                   <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
//                   Saved at {lastSavedAt}
//                 </>
//               )
//             )}
//           </span>
//           {isSavingDraft && <Loader2 className="h-4 w-4 animate-spin text-slate-400 sm:hidden" aria-label="Saving draft" />}
//           <button
//             type="button"
//             onClick={onNext}
//             disabled={isSavingDraft}
//             className={cn(
//               adminTheme.actionButton.primary,
//               "px-3 py-2 sm:px-4 sm:py-2.5",
//               isSavingDraft && "cursor-not-allowed opacity-70"
//             )}
//           >
//             {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
//             <span className="hidden sm:inline">{isSavingDraft ? "Saving..." : "Next Step"}</span>
//             <span className="sm:hidden">{isSavingDraft ? "Saving..." : "Next"}</span>
//           </button>
//         </div>
//       )}
//     </header>
//   );
// };

// const WizardFooter = ({ onDiscard, onCancel, onSaveContinue, isLastStep, isSavingDraft }) => (
//   <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
//     <button
//       type="button"
//       onClick={onDiscard}
//       className={cn("flex items-center gap-1.5 text-sm font-medium", adminTheme.text.danger, adminTheme.text.dangerHover)}
//     >
//       <Trash2 className="h-4 w-4" />
//       Discard Draft
//     </button>

//     <div className="flex items-center gap-3">
//       <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
//         Cancel
//       </button>
//       {!isLastStep && (
//         <button
//           type="button"
//           onClick={onSaveContinue}
//           disabled={isSavingDraft}
//           className={cn(
//             adminTheme.actionButton.primary,
//             isSavingDraft && "cursor-not-allowed opacity-70"
//           )}
//         >
//           {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
//           <span>{isSavingDraft ? "Saving..." : "Save & Continue"}</span>
//         </button>
//       )}
//     </div>
//   </div>
// );

// // ---- Page -----------------------------------------------------------------

// const CreateAssessment = () => {
//   const [currentStep, setCurrentStep] = useState(1);
//   const [form, setForm] = useState(INITIAL_FORM);
//   const [sections, setSections] = useState(INITIAL_SECTIONS);
//   const [grades, setGrades] = useState(INITIAL_GRADES);
//   const [assessmentNameOptions, setAssessmentNameOptions] = useState(() => {
//     if (typeof window === "undefined") {
//       return DEFAULT_ASSESSMENT_NAME_OPTIONS;
//     }

//     try {
//       const storedOptions = window.localStorage.getItem("assessment-name-options");
//       if (storedOptions) {
//         const parsedOptions = JSON.parse(storedOptions);
//         if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
//           return parsedOptions;
//         }
//       }
//     } catch (error) {
//       console.warn("Unable to load assessment name options", error);
//     }

//     return DEFAULT_ASSESSMENT_NAME_OPTIONS;
//   });
//   const [searchParams] = useSearchParams();
//   const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
//   const [isSavingDraft, setIsSavingDraft] = useState(false);
//   const [lastSavedAt, setLastSavedAt] = useState(null);
//   const [validationErrors, setValidationErrors] = useState({});

//   const [newSectionIds, setNewSectionIds] = useState(() => new Set());
//   const [newSubsectionIds, setNewSubsectionIds] = useState(() => new Set());

//   const [deleteTarget, setDeleteTarget] = useState(null);

//   const isLastStep = currentStep === STEPS.length;

//   const handleFieldChange = (field, value) => {
//     setForm((prev) => ({ ...prev, [field]: value }));

//     if (field === "name") {
//       const trimmedValue = String(value).trim();
//       if (trimmedValue) {
//         setAssessmentNameOptions((prevOptions) => {
//           const nextOptions = prevOptions.filter((option) => option.trim() !== "");
//           if (!nextOptions.some((option) => option.toLowerCase() === trimmedValue.toLowerCase())) {
//             return [trimmedValue, ...nextOptions].slice(0, 20);
//           }
//           return nextOptions;
//         });
//       }
//     }

//     setValidationErrors((prev) => {
//       const nextErrors = { ...prev };

//       if (field === "name") delete nextErrors["assessment.name"];
//       if (field === "type") delete nextErrors["assessment.assessment_type"];
//       if (field === "language") delete nextErrors["assessment.default_language"];

//       return nextErrors;
//     });
//   };

//   const goToStep = (stepId) => {
//     setCurrentStep(stepId);
//   };

//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const resumeAssessmentId = searchParams.get("id");

//   const { loading, detail, detailLoading, detailError } = useSelector((state) => state.assessment);

//   const handleBack = () => {
//     if (window.history.state?.idx > 0) {
//       navigate(-1);
//     } else {
//       navigate("/s-admin/assessment-overview");
//     }
//   };

//   useEffect(() => {
//     setForm(INITIAL_FORM);
//     setSections(INITIAL_SECTIONS);
//     setGrades(INITIAL_GRADES);
//     setCurrentStep(1);
//     setValidationErrors({});
//     setLastSavedAt(null);

//     dispatch(resetAssessmentDetail());

//     if (!resumeAssessmentId) {
//       return;
//     }

//     void dispatch(fetchAssessmentDetailSlice(resumeAssessmentId));
//   }, [dispatch, resumeAssessmentId]);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       window.localStorage.setItem("assessment-name-options", JSON.stringify(assessmentNameOptions));
//     }
//   }, [assessmentNameOptions]);

//   useEffect(() => {
//     if (!detail) return;

//     const hydrated = hydrateWizardFromDetail(detail);
//     setForm(hydrated.form);
//     setGrades(hydrated.grades);
//     setSections(hydrated.sections);
//     setCurrentStep(1);
//     setValidationErrors({});
//     setLastSavedAt(null);
//   }, [detail]);

//   useEffect(() => {
//     if (!detailError) return;
//     console.error("Assessment detail fetch failed:", detailError);
//   }, [detailError]);

//   const handleNext = async () => {
//     if (isSavingDraft) return;

//     if (currentStep === 1) {
//       const stepOneErrors = validateStepOneFields(form);
//       if (Object.keys(stepOneErrors).length > 0) {
//         setValidationErrors(stepOneErrors);
//         return;
//       }
//     }

//     if (currentStep === 2) {
//       const stepTwoErrors = validateStepTwoFields(form);
//       if (Object.keys(stepTwoErrors).length > 0) {
//         setValidationErrors(stepTwoErrors);
//         return;
//       }
//     }

//     setValidationErrors({});

//     try {
//       await persistDraft();
//       setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
//     } catch (error) {
//       console.error("Next step draft save failed:", error);
//     }
//   };

//   const persistDraft = useCallback(async () => {
//     setIsSavingDraft(true);

//     try {
//       const draftPayload = buildAssessmentPayload({ form, grades, sections, isDraft: true, step: currentStep });
//       console.log("Draft save payload:", draftPayload);

//       const saveThunk = resumeAssessmentId
//         ? updateAssessmentDraftSlice({ id: resumeAssessmentId, payload: draftPayload })
//         : publishAssessmentSlice(draftPayload);

//       const result = await dispatch(saveThunk).unwrap();
//       console.log("Draft save success:", result);

//       const nextId = result?.assessment_id ?? result?.id ?? result?.data?.assessment_id;
//       if (nextId && !resumeAssessmentId) {
//         navigate(`/s-admin/create-assessment?id=${nextId}`, { replace: true });
//       }

//       setLastSavedAt(new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
//       return result;
//     } catch (error) {
//       console.error("Draft save failed:", error);
//       throw error;
//     } finally {
//       setIsSavingDraft(false);
//     }
//   }, [currentStep, dispatch, form, grades, navigate, resumeAssessmentId, sections]);

//   const handleDiscardClick = () => {
//     setIsDiscardModalOpen(true);
//   };

//   const handleConfirmDiscard = () => {
//     setForm(INITIAL_FORM);
//     setSections(INITIAL_SECTIONS);
//     setGrades(INITIAL_GRADES);
//     setCurrentStep(1);
//     setNewSectionIds(new Set());
//     setNewSubsectionIds(new Set());
//     setLastSavedAt(null);
//     setValidationErrors({});
//     setIsDiscardModalOpen(false);
//   };

//   const handleCancelDiscard = () => {
//     setIsDiscardModalOpen(false);
//   };

//   const handleCancel = () => {
//     // Wire this up to navigation (e.g. router.back()).
//     console.log("Cancelled assessment creation");
//   };

//   const handleSaveContinue = async () => {
//     if (isSavingDraft) return;
//     await handleNext();
//   };

//   const handlePublish = async () => {
//     // Guard against double-submits (e.g. a stray Enter keypress or a second
//     // click that lands before React re-renders the disabled button).
//     if (loading) return;

//     const payload = buildAssessmentPayload({ form, grades, sections, isDraft: false });
//     const { isValid, errors } = validateAssessmentPayload(payload);

//     if (!isValid) {
//       setValidationErrors(errors);
//       // Jump to Review so the error banner is visible, in case Publish was
//       // triggered from an earlier step.
//       setCurrentStep(4);
//       return;
//     }

//     setValidationErrors({});

//     try {
//       const result = await dispatch(publishAssessmentSlice(payload)).unwrap();

//       console.log("Publish Success:", result);

//       // show success toast if required
//     } catch (error) {
//       console.error("Publish Failed:", error);

//       // show error toast if required
//     }
//   };

//   const handleAddSection = () => {
//     const nextIndex = sections.length + 1;
//     const newId = `section-${Date.now()}`;
//     setSections((prev) => [
//       ...prev,
//       {
//         id: newId,
//         name: `Section ${nextIndex}`,
//         sectionCode: `SECTION_${nextIndex}`,
//         description: "",
//         instructions: "",
//         timeLimitMinutes: 0,
//         isMandatory: true,
//         randomizeQuestions: false,
//         subsections: [],
//       },
//     ]);
//     setNewSectionIds((prev) => new Set(prev).add(newId));
//   };

//   const handleRemoveSection = (sectionId) => {
//     setSections((prev) => prev.filter((section) => section.id !== sectionId));
//   };

//   const handleSectionFieldChange = (sectionId, field, value) => {
//     setSections((prev) =>
//       prev.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section))
//     );
//   };

//   const handleAddSubsection = (sectionId) => {
//     const newId = `${sectionId}-sub-${Date.now()}`;
//     setSections((prev) =>
//       prev.map((section) =>
//         section.id === sectionId
//           ? {
//             ...section,
//             subsections: [
//               ...section.subsections,
//               {
//                 id: newId,
//                 name: `Untitled Subsection`,
//                 subsectionCode: `SUB_${section.subsections.length + 1}`,
//                 dimensionId: "",
//                 questionLimit: 0,
//                 description: "Add a short description for this subsection.",
//                 instructions: "",
//               },
//             ],
//           }
//           : section
//       )
//     );
//     setNewSubsectionIds((prev) => new Set(prev).add(newId));
//   };

//   const handleRemoveSubsection = (sectionId, subsectionId) => {
//     setSections((prev) =>
//       prev.map((section) =>
//         section.id === sectionId
//           ? {
//             ...section,
//             subsections: section.subsections.filter((sub) => sub.id !== subsectionId),
//           }
//           : section
//       )
//     );
//   };

//   const handleSubsectionFieldChange = (sectionId, subsectionId, field, value) => {
//     setSections((prev) =>
//       prev.map((section) =>
//         section.id === sectionId
//           ? {
//             ...section,
//             subsections: section.subsections.map((sub) =>
//               sub.id === subsectionId ? { ...sub, [field]: value } : sub
//             ),
//           }
//           : section
//       )
//     );
//   };

//   // --- Delete confirmation flow for sections & subsections ---
//   // Clicking the trash icon never deletes right away; it just records what
//   // was asked for, and the modal below performs the actual removal only
//   // once the user taps "Delete".

//   const handleRequestRemoveSection = (sectionId) => {
//     setDeleteTarget({ type: "section", sectionId });
//   };

//   const handleRequestRemoveSubsection = (sectionId, subsectionId) => {
//     setDeleteTarget({ type: "subsection", sectionId, subsectionId });
//   };

//   const handleCancelDelete = () => {
//     setDeleteTarget(null);
//   };

//   const handleConfirmDelete = () => {
//     if (!deleteTarget) return;

//     if (deleteTarget.type === "section") {
//       handleRemoveSection(deleteTarget.sectionId);
//     } else if (deleteTarget.type === "subsection") {
//       handleRemoveSubsection(deleteTarget.sectionId, deleteTarget.subsectionId);
//     }

//     setDeleteTarget(null);
//   };

//   const handleAddGrade = () => {
//     setGrades((prev) => [
//       ...prev,
//       {
//         id: `grade-${Date.now()}`,
//         grade: "",
//         board: "ALL",
//         minimumAge: "",
//         maximumAge: "",
//         isDefault: prev.length === 0,
//       },
//     ]);
//   };

//   const handleRemoveGrade = (gradeId) => {
//     setGrades((prev) => prev.filter((grade) => grade.id !== gradeId));
//   };

//   const handleGradeFieldChange = (gradeId, field, value) => {
//     setGrades((prev) =>
//       prev.map((grade) => (grade.id === gradeId ? { ...grade, [field]: value } : grade))
//     );
//   };

//   const handleSetDefaultGrade = (gradeId) => {
//     setGrades((prev) => prev.map((grade) => ({ ...grade, isDefault: grade.id === gradeId })));
//   };

//   return (
//     <div className={cn("min-h-screen", adminTheme.surface.page)}>
//       <WizardHeader
//         currentStep={currentStep}
//         onBack={handleBack}
//         onNext={handleNext}
//         onPublish={handlePublish}
//         isSavingDraft={isSavingDraft}
//         isPublishing={loading}
//         lastSavedAt={lastSavedAt}
//       />

//       <div className="flex flex-col md:flex-row">
//         <ConfigurationSidebar currentStep={currentStep} onStepClick={goToStep} />

//         <main className="flex-1 min-w-0">
//           <MobileStepTracker currentStep={currentStep} onStepClick={goToStep} />
//           <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
//             {currentStep === 1 && (
//               <GeneralInformationCard
//                 form={form}
//                 onFieldChange={handleFieldChange}
//                 validationErrors={validationErrors}
//                 assessmentNameOptions={assessmentNameOptions}
//               />
//             )}

//             {currentStep === 2 && (
//               <VersionSettingsCard
//                 form={form}
//                 onFieldChange={handleFieldChange}
//                 validationErrors={validationErrors}
//               />
//             )}

//             {currentStep === 3 && (
//               <GradeMappingStep
//                 grades={grades}
//                 onAddGrade={handleAddGrade}
//                 onRemoveGrade={handleRemoveGrade}
//                 onGradeFieldChange={handleGradeFieldChange}
//                 onSetDefaultGrade={handleSetDefaultGrade}
//               />
//             )}

//             {currentStep === 4 && (
//               <StructureStep
//                 sections={sections}
//                 newSectionIds={newSectionIds}
//                 newSubsectionIds={newSubsectionIds}
//                 onAddSection={handleAddSection}
//                 onRequestRemoveSection={handleRequestRemoveSection}
//                 onSectionFieldChange={handleSectionFieldChange}
//                 onAddSubsection={handleAddSubsection}
//                 onSubsectionFieldChange={handleSubsectionFieldChange}
//                 onRequestRemoveSubsection={handleRequestRemoveSubsection}
//               />
//             )}

//             {currentStep === 5 && (
//               <ReviewStep
//                 form={form}
//                 grades={grades}
//                 sections={sections}
//                 isPublishing={loading}
//                 validationErrors={validationErrors}
//                 onGoToStep={goToStep}
//                 onPublish={handlePublish}
//               />
//             )}

//             <WizardFooter
//               onDiscard={handleDiscardClick}
//               onCancel={handleCancel}
//               onSaveContinue={handleSaveContinue}
//               isLastStep={isLastStep}
//               isSavingDraft={isSavingDraft}
//             />
//           </div>
//         </main>
//       </div>

//       <ConfirmModal
//         open={isDiscardModalOpen}
//         title="Discard this draft?"
//         description="This will permanently clear everything you've entered — Assessment & Version details, Grade Mapping, and all Sections & Subsections. This action can't be undone."
//         confirmLabel="Discard Draft"
//         cancelLabel="Keep Editing"
//         onConfirm={handleConfirmDiscard}
//         onCancel={handleCancelDiscard}
//       />

//       <ConfirmModal
//         open={Boolean(deleteTarget)}
//         title={deleteTarget?.type === "section" ? "Delete this section?" : "Delete this subsection?"}
//         description={
//           deleteTarget?.type === "section"
//             ? "This will permanently remove the section and all of its subsections. This action can't be undone."
//             : "This will permanently remove this subsection. This action can't be undone."
//         }
//         confirmLabel="Delete"
//         cancelLabel="Cancel"
//         onConfirm={handleConfirmDelete}
//         onCancel={handleCancelDelete}
//       />
//     </div>
//   );
// };

// export default CreateAssessment;