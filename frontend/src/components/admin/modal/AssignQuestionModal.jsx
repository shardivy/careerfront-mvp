import { useMemo, useState } from "react";
import { Plus, X, Search, CheckCircle2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";


const GRADE_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];

const DIFFICULTY_STYLES = {
  EASY: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HARD: "bg-red-50 text-red-700",
};

const TypeBadge = ({ type }) => (
  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
    {type.replace(/_/g, " ")}
  </span>
);

const DifficultyBadge = ({ difficulty }) => (
  <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", DIFFICULTY_STYLES[difficulty])}>
    {difficulty}
  </span>
);

const GradeBadge = ({ grades, highlightGrade }) => {
  if (!grades || grades.length === 0) return null;
  const isOffGrade = highlightGrade != null && !grades.includes(highlightGrade);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        isOffGrade ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
      )}
      title={isOffGrade ? "Not tagged for the current assessment version's grade" : undefined}
    >
      <GraduationCap className="h-3 w-3" />
      {grades.length === 1 ? `Grade ${grades[0]}` : `Grades ${grades.join(", ")}`}
    </span>
  );
};

const ModalShell = ({ open, onClose, children, maxWidth = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={cn(adminTheme.card.base, adminTheme.shadow.xl, "w-full max-h-[85vh] overflow-hidden p-0 flex flex-col", maxWidth)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const AssignQuestionModal = ({ open, subsection, versionGrade, availableQuestions, onClose, onAdd }) => {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState(versionGrade ?? "ALL");
  const [selectedIds, setSelectedIds] = useState([]);

  // Re-sync the grade filter to the version's own grade whenever this is
  // opened fresh (e.g. after switching assessment versions).
  const [lastOpen, setLastOpen] = useState(false);
  if (open && !lastOpen) {
    setLastOpen(true);
    setGradeFilter(versionGrade ?? "ALL");
  } else if (!open && lastOpen) {
    setLastOpen(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableQuestions.filter((question) => {
      const matchesSearch = !q || question.id.toLowerCase().includes(q) || question.prompt.toLowerCase().includes(q);
      const matchesGrade = gradeFilter === "ALL" || (question.grades ?? []).includes(gradeFilter);
      return matchesSearch && matchesGrade;
    });
  }, [availableQuestions, search, gradeFilter]);

  const toggleSelect = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleClose = () => {
    setSearch("");
    setSelectedIds([]);
    onClose();
  };

  const handleAdd = () => {
    onAdd(selectedIds);
    setSearch("");
    setSelectedIds([]);
  };

  return (
    <ModalShell open={open} onClose={handleClose} maxWidth="max-w-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Assign Questions</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            From the Question Library into <span className="font-semibold text-slate-700">{subsection?.name}</span>
          </p>
        </div>
        <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2.5 border-b border-slate-100 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Item ID or prompt content..."
            className={cn(
              "h-10 w-full pl-9 pr-3 text-sm",
              adminTheme.radius.md,
              adminTheme.border.default,
              "border bg-slate-50 text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <GraduationCap className="h-3.5 w-3.5" />
            Grade
          </span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className={cn(
              "h-8 text-sm font-semibold",
              adminTheme.radius.md,
              adminTheme.border.default,
              "border bg-white px-2 text-slate-900",
              "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            )}
          >
            <option value="ALL">All Grades</option>
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
                {grade === versionGrade ? " (this version)" : ""}
              </option>
            ))}
          </select>
          {gradeFilter !== "ALL" && gradeFilter !== versionGrade && (
            <span className="text-xs font-medium text-amber-600">
              Off this version's default grade ({versionGrade ? `Grade ${versionGrade}` : "unset"})
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            {availableQuestions.length === 0
              ? "Every question in this subsection is already mapped into this assessment version."
              : gradeFilter !== "ALL"
              ? `No unmapped questions tagged for Grade ${gradeFilter}. Try "All Grades" or a different grade.`
              : "No questions match your search."}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((question) => {
              const isSelected = selectedIds.includes(question.id);
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => toggleSelect(question.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                    isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2",
                      isSelected ? "border-slate-900 bg-slate-900" : "border-slate-300"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">{question.id}</span>
                      <TypeBadge type={question.type} />
                      <DifficultyBadge difficulty={question.difficulty} />
                      <GradeBadge grades={question.grades} highlightGrade={versionGrade} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-900">{question.prompt}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-400">{question.defaultMarks} pt</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 p-4">
        <span className="text-sm font-medium text-slate-500">{selectedIds.length} selected</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleClose} className={adminTheme.actionButton.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selectedIds.length === 0}
            className={cn(adminTheme.actionButton.primary, selectedIds.length === 0 && "cursor-not-allowed opacity-50")}
          >
            <Plus className="h-4 w-4" />
            Assign {selectedIds.length > 0 ? selectedIds.length : ""} Question{selectedIds.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default AssignQuestionModal;