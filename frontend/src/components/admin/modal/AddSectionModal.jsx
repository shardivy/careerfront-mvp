import { X, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";

const FieldLabel = ({ children, required }) => (
  <label className="mb-1 block text-xs font-medium text-slate-500">
    {children}
    {required && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);

const TextInput = ({ className, ...props }) => (
  <input
    {...props}
    className={cn(
      "h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400",
      adminTheme.border.default,
      className
    )}
  />
);

const TextArea = ({ className, ...props }) => (
  <textarea
    {...props}
    className={cn(
      "w-full resize-none rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400",
      adminTheme.border.default,
      className
    )}
  />
);

const Checkbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 text-sm text-slate-700">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
    />
    {label}
  </label>
);

const AddSectionModal = ({ open, mode, form, setForm, onClose, onSave, loading }) => {
  if (!open || !form) return null;

  const isValid = Boolean(form.name);

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
              <LayoutGrid className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {mode === "add" ? "Add section" : "Edit section"}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Sections belong to a specific assessment version.
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
            <FieldLabel required>Name</FieldLabel>
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Aptitude"
            />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <TextArea
              rows={3}
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this section"
            />
          </div>

          <div>
            <FieldLabel>Instructions</FieldLabel>
            <TextArea
              rows={4}
              value={form.instructions || ""}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Instructions shown to candidates before attempting this section"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Checkbox
              checked={form.is_mandatory}
              onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
              label="Mandatory section"
            />
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
            onClick={onSave}
            disabled={!isValid || loading}
            className={cn(
              adminTheme.actionButton.primary,
              (!isValid || loading) && "cursor-not-allowed opacity-50"
            )}
          >
            {loading
              ? "Saving..."
              : mode === "add"
              ? "Add Section"
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSectionModal;