import { GraduationCap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
import { createGrade, fetchGrades, updateGrade, resetGradeState } from "../../../slices/gradeSlice";
import { useEffect, useState } from "react";
import { useToastManager } from "@/components/ui/toast";

const EDUCATION_LEVELS = ["SCHOOL", "UG", "PG"];

const FieldLabel = ({ children, required }) => (
  <label className="mb-1 block text-xs font-medium text-slate-500">
    {children}
    {required && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);

const TextInput = ({ className, error, ...props }) => (
  <input
    {...props}
    className={cn(
      "h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1",
      error
        ? "border-red-400 focus:border-red-400 focus:ring-red-400"
        : "focus:border-indigo-400 focus:ring-indigo-400",
      adminTheme.border.default,
      className
    )}
  />
);

const Select = ({ className, ...props }) => (
  <select
    {...props}
    className={cn(
      "h-9 w-full rounded-md border bg-white px-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400",
      adminTheme.border.default,
      className
    )}
  />
);

const AddGradeModal = ({ open, mode, form, setForm, onClose, onSave }) => {
  const dispatch = useDispatch();
  const toast = useToastManager();
  const { loading, success, error, grade } = useSelector((state) => state.grade);

  useEffect(() => {
    if (success && grade) {
      const description = grade.message || grade.data?.message || "Grade added successfully.";

      if (toast?.add) {
        toast.add({
          title: "Success",
          description,
          type: "success",
        });
      } else {
        alert(description);
      }

      dispatch(fetchGrades());
      dispatch(resetGradeState());
      onClose();
    }
  }, [success, grade, dispatch, onClose, toast]);

  const [gradeNameTouched, setGradeNameTouched] = useState(false);
  const [educationLevelTouched, setEducationLevelTouched] = useState(false);

  useEffect(() => {
    if (!error) return;

    let description = error?.message || "Failed to add grade";

    if (error?.errors) {
      const firstKey = Object.keys(error.errors)[0];

      if (firstKey && error.errors[firstKey]?.length) {
        description = error.errors[firstKey][0];
      }
    }

    toast.add({
      title: "Error",
      description,
      type: "error",
    });

    dispatch(resetGradeState());
  }, [error, dispatch]);

  useEffect(() => {
    if (open) {
      setGradeNameTouched(false);
      setEducationLevelTouched(false);
    }
  }, [open]);

  if (!open || !form) return null;

  const acceptableName = form.grade_name?.trim() || "";
  const isGradeNameValid = Boolean(acceptableName) && /^[A-Za-z0-9 ]+$/.test(acceptableName);
  const isEducationLevelValid = Boolean(form.education_level);
  const isValid = isGradeNameValid && isEducationLevelValid;

  const handleSave = () => {
    if (!isValid) return;

    const payload = {
      grade_name: form.grade_name?.trim(),
      education_level: form.education_level,
    };

    if (mode === "add") {
      dispatch(createGrade(payload));
    } else {
      dispatch(updateGrade({ id: form.id, payload }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={cn(
          adminTheme.card.base,
          adminTheme.shadow.xl,
          "flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden p-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <GraduationCap className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {mode === "add" ? "Add grade" : "Edit grade"}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Grades are the master list used across assessment versions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <FieldLabel required>Grade name</FieldLabel>
            <TextInput
              value={form.grade_name || ""}
              error={gradeNameTouched && !isGradeNameValid}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^A-Za-z0-9 ]/g, "");
                setGradeNameTouched(true);
                setForm({ ...form, grade_name: cleaned });
              }}
              placeholder=" UG"
            />
            {gradeNameTouched && !isGradeNameValid && (
              <p className="mt-1 text-xs text-red-500">
                Grade name is required and can only contain letters, numbers, and spaces.
              </p>
            )}
          </div>

          <div>
            <FieldLabel required>Education level</FieldLabel>
            <Select
              value={form.education_level || ""}
              onChange={(e) => {
                setEducationLevelTouched(true);
                setForm({ ...form, education_level: e.target.value });
              }}
              onBlur={() => setEducationLevelTouched(true)}
            >
              <option value="" disabled>
                Select education level
              </option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
            {educationLevelTouched && !isEducationLevelValid && (
              <p className="mt-1 text-xs text-red-500">
                Education level is required.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className={adminTheme.actionButton.secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || loading}
            className={cn(
              adminTheme.actionButton.primary,
              (!isValid || loading) && "cursor-not-allowed opacity-50"
            )}
          >
            {loading
              ? "Saving..."
              : mode === "add"
              ? "Add grade"
              : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGradeModal;