import { X, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";

const FieldLabel = ({ children }) => (
  <label className="mb-1 block text-xs font-medium text-slate-500">{children}</label>
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
      "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400",
      adminTheme.border.default,
      className
    )}
  />
);

const AddSubsectionModal = ({ open, mode, form, setForm, onClose, onSave }) => {
  if (!open || !form) return null;

  const isValid =
    form.name?.trim() !== "" &&
    form.time_limit_minutes !== "" &&
    form.time_limit_minutes !== null &&
    form.time_limit_minutes !== undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={cn(adminTheme.card.base, adminTheme.shadow.xl, "flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden p-0")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <ListTree className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{mode === "add" ? "Add subsection" : "Edit subsection"}</h3>
              <p className="mt-0.5 text-sm text-slate-500">Provide the details for this subsection.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <FieldLabel>Name</FieldLabel>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Logical Reasoning" />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <TextArea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Briefly describe this subsection"
            />
          </div>
          <div>
            <FieldLabel>Instructions</FieldLabel>
            <TextArea
              rows={3}
              value={form.instructions ?? ""}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Instructions shown to the candidate"
            />
          </div>
          <div>
            <FieldLabel>
              Time limit (minutes) <span className="text-red-500">*</span>
            </FieldLabel>
            <TextInput
              type="number"
              required
              min={1}
              value={form.time_limit_minutes ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  time_limit_minutes: e.target.value,
                })
              }
              placeholder="20"
            />
          </div>
          <div>
            <FieldLabel>Question limit</FieldLabel>
            <TextInput
              type="number"
              min={1}
              value={form.question_limit ?? ""}
              onChange={(e) => setForm({ ...form, question_limit: e.target.value })}
              placeholder="20"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="randomize_questions"
              type="checkbox"
              checked={Boolean(form.randomize_questions)}
              onChange={(e) => setForm({ ...form, randomize_questions: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-400"
            />
            <label htmlFor="randomize_questions" className="text-sm font-medium text-slate-700">
              Randomize questions
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
          <button type="button" onClick={onClose} className={adminTheme.actionButton.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!isValid}
            className={cn(adminTheme.actionButton.primary, !isValid && "cursor-not-allowed opacity-50")}
          >
            {mode === "add" ? "Add subsection" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSubsectionModal;