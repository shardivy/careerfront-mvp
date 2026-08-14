import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  LayoutGrid,
  ListTree,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import GradeFormModal from "./modal/AddGradeModal";
import SectionFormModal from "./modal/AddSectionModal";
import SubsectionFormModal from "./modal/AddSubsectionModal";
import { useDispatch, useSelector } from "react-redux";
import { fetchGrades, updateGrade, deleteGrade } from "@/slices/gradeSlice";
import { fetchSections, createSection, updateSection, deleteSection, } from "@/slices/sectionSlice";
import { fetchSubsections, createSubsection, updateSubsection, deleteSubsection, } from "@/slices/subsectionSlice";
import { toast } from "@/components/ui/toast";

const PAGE_SIZE_OPTIONS = [5, 10, 25];

// ---------------------------------------------------------------------------
// Small shared UI atoms (built purely from adminTheme tokens, `cn()`'d
// the same way AssessmentOverview does it)
// ---------------------------------------------------------------------------

// Toggle switch used for the Status column. Purely visual — it always
// reflects the row's *current* status. Clicking it doesn't flip the row
// itself; the parent tab intercepts the click and opens a confirmation.
const StatusSwitch = ({ active, onRequestToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    onClick={onRequestToggle}
    className={cn(
      "inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-xs font-semibold transition",
      active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
    )}
  >
    <span
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition",
        active ? "bg-emerald-500" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition",
          active ? "translate-x-4.5" : "translate-x-1"
        )}
      />
    </span>
    {active ? "Active" : "Inactive"}
  </button>
);

const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-sm font-medium text-slate-700">{title}</p>
    <p className="text-xs text-slate-400">{subtitle}</p>
  </div>
);

const ConfirmDeleteModal = ({ open, name, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className={cn(adminTheme.card.base, "w-full max-w-sm p-5")}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id="delete-confirm-title" className="text-base font-semibold text-slate-900">
              Delete record?
            </p>
            <p className="mt-2 text-sm text-slate-500">
              This will remove <span className="font-semibold text-slate-700">{name}</span>. This action can't be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
            Cancel
          </button>
          {/* <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </button> */}
        </div>
      </div>
    </div>
  );
};

// Very small confirmation modal, matching the simple pattern used in
// QuestionMapping's action confirm dialog.
const StatusToggleModal = ({ open, name, nextStatus, onCancel, onConfirm }) => {
  if (!open) return null;

  const activating = nextStatus === "ACTIVE";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className={cn(adminTheme.card.base, "w-full max-w-sm p-5")}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="status-toggle-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id="status-toggle-title" className="text-base font-semibold text-slate-900">
              {activating ? "Activate record?" : "Deactivate record?"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {activating
                ? `This will make ${name} active in the selected structure.`
                : `This will make ${name} inactive and unavailable for use.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {activating ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Pagination bar — identical pattern to AssessmentOverview's TablePagination
const TablePagination = ({ page, pageCount, pageSize, onPageChange, onPageSizeChange, totalRows, rangeStart, rangeEnd }) => (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span>Rows per page</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>

    <div className="flex items-center gap-4 text-sm text-slate-500">
      <span>{totalRows === 0 ? "0 of 0" : `${rangeStart}–${rangeEnd} of ${totalRows}`}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[64px] text-center text-xs font-medium text-slate-600">
          Page {pageCount === 0 ? 0 : page} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </div>
);

// Search input + Add button row, shared across all three tabs
const Toolbar = ({ query, setQuery, placeholder, onAdd, addLabel, filters }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className={adminTheme.input.search} />
      </div>
      {filters}
    </div>
    <button type="button" onClick={onAdd} className={adminTheme.actionButton.primary}>
      <Plus className="h-4 w-4" />
      {addLabel}
    </button>
  </div>
);

// Generic pagination hook shared by all three tabs
const usePagedRows = (rows) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, rows.length);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return { page: safePage, pageCount, pageSize, paginated, rangeStart, rangeEnd, setPage, handlePageSizeChange };
};

// Shared hook: manages the "which row is pending a status flip" state and
// the confirm/cancel handlers. One row can be pending at a time.
const useStatusToggle = (setRows) => {
  const [pendingToggle, setPendingToggle] = useState(null); // { id, name, nextStatus }

  const requestToggle = (row, nameKey) => {
    setPendingToggle({
      id: row.id,
      name: row[nameKey],
      nextStatus: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    });
  };

  const cancelToggle = () => setPendingToggle(null);

  const confirmToggle = () => {
    if (!pendingToggle) return;
    setRows((prev) => prev.map((r) => (r.id === pendingToggle.id ? { ...r, status: pendingToggle.nextStatus } : r)));
    setPendingToggle(null);
  };

  return { pendingToggle, requestToggle, cancelToggle, confirmToggle };
};

// ---------------------------------------------------------------------------
// TAB 1 — Grades
// ---------------------------------------------------------------------------
const GradesTab = () => {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit', row }
  const [deleteId, setDeleteId] = useState(null);
  const { pendingToggle, requestToggle, cancelToggle } = useStatusToggle(setRows);
  const dispatch = useDispatch();

  const { grades, gradesLoading } = useSelector((state) => state.grade);

  useEffect(() => {
    dispatch(fetchGrades());
  }, [dispatch]);

  useEffect(() => {
    setRows(grades || []);
  }, [grades]);

  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;

    const { id, nextStatus } = pendingToggle;
    try {
      await dispatch(updateGrade({ id, payload: { status: nextStatus } })).unwrap();
      dispatch(fetchGrades());
    } catch (error) {
      console.error("Failed to update grade status:", error);
    } finally {
      cancelToggle();
    }
  };

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => r.grade_name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => a.display_order - b.display_order),
    [rows, query]
  );

  const { page, pageCount, pageSize, paginated, rangeStart, rangeEnd, setPage, handlePageSizeChange } = usePagedRows(filtered);

  const emptyForm = { grade_name: "", education_level: "", display_order: rows.length + 1, status: "ACTIVE" };
  const [form, setForm] = useState(null);

  const openAdd = () => {
    setForm(emptyForm);
    setModal({ mode: "add" });
  };
  const openEdit = (row) => {
    setForm(row);
    setModal({ mode: "edit", row });
  };
  const closeModal = () => {
    setModal(null);
    setForm(null);
  };

  const save = () => {
    if (!form.grade_name) return;
    if (modal.mode === "add") {
      setRows((prev) => [...prev, { ...form, id: Date.now() }]);
    } else {
      setRows((prev) => prev.map((r) => (r.id === modal.row.id ? { ...form } : r)));
    }
    closeModal();
  };

  const remove = async (id) => {
    try {
      await dispatch(deleteGrade(id)).unwrap();

      // Refresh latest data
      dispatch(fetchGrades());

      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete grade:", error);
    }
  };

  return (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <Toolbar query={query} setQuery={setQuery} placeholder="Search grades…" onAdd={openAdd} addLabel="Add Grade" />

      <div className="mt-4 overflow-x-auto">
        {gradesLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            <p className="mt-3">Loading grades…</p>
          </div>
        ) : paginated.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No grades yet" subtitle="Add your first grade to get started." />
        ) : (
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                <th className={adminTheme.table.headerCell}>Name</th>
                <th className={adminTheme.table.headerCell}>Level</th>
                <th className={adminTheme.table.headerCell}>Order</th>
                <th className={adminTheme.table.headerCell}>Status</th>
                <th className={cn(adminTheme.table.headerCell, "text-right")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id} className={adminTheme.table.row}>
                  <td className={cn(adminTheme.table.cell, "font-medium text-slate-900")}>{r.grade_name}</td>
                  <td className={adminTheme.table.cell}>{r.education_level}</td>
                  <td className={adminTheme.table.cellMuted}>{r.display_order}</td>
                  <td className={adminTheme.table.cell}>
                    <StatusSwitch active={r.status === "ACTIVE"} onRequestToggle={() => requestToggle(r, "grade_name")} />
                  </td>
                  <td className={cn(adminTheme.table.cell, "text-right")}>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openEdit(r)} className={adminTheme.button.iconGhost}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => setDeleteId(r.id)}
                        className={cn(adminTheme.button.iconGhost, "hover:text-red-600")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!deleteId}
        name={rows.find((r) => r.id === deleteId)?.grade_name}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => remove(deleteId)}
      />

      <StatusToggleModal
        open={!!pendingToggle}
        name={pendingToggle?.name}
        nextStatus={pendingToggle?.nextStatus}
        onCancel={cancelToggle}
        onConfirm={handleConfirmToggle}
      />

      <TablePagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        totalRows={filtered.length}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />

      <GradeFormModal open={!!modal} mode={modal?.mode} form={form} setForm={setForm} onClose={closeModal} onSave={save} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// TAB 2 — Sections
// ---------------------------------------------------------------------------
const SectionsTab = () => {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { pendingToggle, requestToggle, cancelToggle } = useStatusToggle(setRows);
  const dispatch = useDispatch();

  const { sections, sectionsLoading, loading } = useSelector((state) => state.section);

  useEffect(() => {
    dispatch(fetchSections());
  }, [dispatch]);

  useEffect(() => {
    setRows(sections || []);
  }, [sections]);

  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;

    const { id, nextStatus } = pendingToggle;
    try {
      await dispatch(updateSection({ id, payload: { status: nextStatus } })).unwrap();
      dispatch(fetchSections());
    } catch (error) {
      console.error("Failed to update section status:", error);
    } finally {
      cancelToggle();
    }
  };

  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
    [rows, query]
  );

  const { page, pageCount, pageSize, paginated, rangeStart, rangeEnd, setPage, handlePageSizeChange } = usePagedRows(filtered);

  const emptyForm = {
    name: "",
    description: "",
    instructions: "",
    is_mandatory: false,
    status: "ACTIVE",
  };
  const [form, setForm] = useState(null);

  const openAdd = () => {
    setForm(emptyForm);
    setModal({ mode: "add" });
  };
  const openEdit = (row) => {
    setForm(row);
    setModal({ mode: "edit", row });
  };
  const closeModal = () => {
    setModal(null);
    setForm(null);
  };

  const save = async () => {
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      description: form.description,
      instructions: form.instructions,
      is_mandatory: form.is_mandatory,
      status: form.status,
    };

try {
  if (modal.mode === "add") {
    await dispatch(createSection(payload)).unwrap();

    toast.add({
      title: "Success",
      description: "Section created successfully.",
      type: "success",
    });
  } else {
    await dispatch(
      updateSection({
        id: modal.row.id,
        payload,
      })
    ).unwrap();

    toast.add({
      title: "Success",
      description: "Section updated successfully.",
      type: "success",
    });
  }

  await dispatch(fetchSections());
  closeModal();
} catch (err) {
  toast.add({
    title: "Error",
    description: err?.message || "Something went wrong.",
    type: "error",
  });
}
  };

  const remove = async (id) => {
    try {
      await dispatch(deleteSection(id)).unwrap();
      await dispatch(fetchSections());
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete section:", err);
      toast.add({
        title: "Error",
        description: err?.message || "Something went wrong.",
        type: "error",
      }); 
    }
  };

  return (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search sections…"
        onAdd={openAdd}
        addLabel="Add Section"
      />

      <div className="mt-4 overflow-x-auto">
        {sectionsLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            <p className="mt-3">Loading sections…</p>
          </div>
        ) : paginated.length === 0 ? (
          <EmptyState icon={LayoutGrid} title="No sections yet" subtitle="Add a section to get started." />
        ) : (
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className={adminTheme.table.headerCell}>Code</th>
                <th className={adminTheme.table.headerCell}>Name</th>
                <th className={adminTheme.table.headerCell}>Description</th>
                <th className={adminTheme.table.headerCell}>Instructions</th>
                <th className={adminTheme.table.headerCell}>Mandatory</th>
                <th className={adminTheme.table.headerCell}>Status</th>
                <th className={cn(adminTheme.table.headerCell, "text-right")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id} className={adminTheme.table.row}>
                  <td className={cn(adminTheme.table.cellMuted, "font-mono text-xs")}>{r.section_code || "—"}</td>
                  <td className={cn(adminTheme.table.cell, "font-medium text-slate-900")}>{r.name}</td>
                  <td className={cn(adminTheme.table.cellMuted, "max-w-[240px] truncate")}>
                    {r.description || "—"}
                  </td>
                  <td className={cn(adminTheme.table.cellMuted, "max-w-[240px] truncate")}>
                    {r.instructions || "—"}
                  </td>
                  <td className={adminTheme.table.cell}>
                    <span className={r.is_mandatory ? adminTheme.badge.positive : adminTheme.badge.neutral}>
                      {r.is_mandatory ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className={adminTheme.table.cell}>
                    <StatusSwitch active={r.status === "ACTIVE"} onRequestToggle={() => requestToggle(r, "name")} />
                  </td>
                  <td className={cn(adminTheme.table.cell, "text-right")}>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openEdit(r)} className={adminTheme.button.iconGhost}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => setDeleteId(r.id)}
                        className={cn(adminTheme.button.iconGhost, "hover:text-red-600")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!deleteId}
        name={rows.find((r) => r.id === deleteId)?.name}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => remove(deleteId)}
      />

      <StatusToggleModal
        open={!!pendingToggle}
        name={pendingToggle?.name}
        nextStatus={pendingToggle?.nextStatus}
        onCancel={cancelToggle}
        onConfirm={handleConfirmToggle}
      />

      <TablePagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        totalRows={filtered.length}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />

      <SectionFormModal
        open={!!modal}
        mode={modal?.mode}
        form={form}
        setForm={setForm}
        onClose={closeModal}
        onSave={save}
        loading={loading}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// TAB 3 — Subsections
// ---------------------------------------------------------------------------
const SubsectionsTab = () => {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { pendingToggle, requestToggle, cancelToggle } = useStatusToggle(setRows);

  const dispatch = useDispatch();

  const { subsections, subsectionsLoading } = useSelector(
    (state) => state.subsection
  );

  useEffect(() => {
    dispatch(fetchSubsections());
  }, [dispatch]);

  useEffect(() => {
    setRows(subsections || []);
  }, [subsections]);

  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;

    const { id, nextStatus } = pendingToggle;
    try {
      await dispatch(updateSubsection({ id, payload: { status: nextStatus } })).unwrap();
      dispatch(fetchSubsections());
    } catch (error) {
      console.error("Failed to update subsection status:", error);
    } finally {
      cancelToggle();
    }
  };

  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
    [rows, query]
  );

  const { page, pageCount, pageSize, paginated, rangeStart, rangeEnd, setPage, handlePageSizeChange } = usePagedRows(filtered);

  const emptyForm = {
    name: "",
    description: "",
    instructions: "",
    time_limit_minutes: "",
    question_limit: "",
    randomize_questions: false,
    status: "ACTIVE",
  };
  const [form, setForm] = useState(null);

  const openAdd = () => {
    setForm(emptyForm);
    setModal({ mode: "add" });
  };
  const openEdit = (row) => {
    setForm(row);
    setModal({ mode: "edit", row });
  };
  const closeModal = () => {
    setModal(null);
    setForm(null);
  };

  const save = async () => {
    if (!form.name?.trim()) return;

  if (!form.time_limit_minutes) {
    alert("Time limit is required");
    return;
  }

    const payload = {
      name: form.name,
      description: form.description,
      instructions: form.instructions,
      time_limit_minutes: form.time_limit_minutes,
      question_limit: form.question_limit,
      randomize_questions: form.randomize_questions,
      status: form.status,
    };

   try {
  if (modal.mode === "add") {
    await dispatch(createSubsection(payload)).unwrap();

    toast.add({
      title: "Success",
      description: "Subsection created successfully.",
      type: "success",
    });
  } else {
    await dispatch(updateSubsection({
      id: modal.row.id,
      payload,
    })).unwrap();

    toast.add({
      title: "Success",
      description: "Subsection updated successfully.",
      type: "success",
    });
  }

  await dispatch(fetchSubsections());
  closeModal();
} catch (err) {
  toast.add({
    title: "Error",
    description: err?.message || "Something went wrong.",
    type: "error",
  });
}
  };

  const remove = async (id) => {
    try {
      await dispatch(deleteSubsection(id)).unwrap();
      await dispatch(fetchSubsections());
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete subsection:", err);
    }
  };

  return (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Search subsections…"
        onAdd={openAdd}
        addLabel="Add Subsection"
      />

      <div className="mt-4 overflow-x-auto">
        {paginated.length === 0 ? (
          <EmptyState icon={ListTree} title="No subsections yet" subtitle="Add a subsection to get started." />
        ) : (
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className={adminTheme.table.headerCell}>Name</th>
                <th className={adminTheme.table.headerCell}>Description</th>
                <th className={adminTheme.table.headerCell}>Instructions</th>
                <th className={adminTheme.table.headerCell}>Question limit</th>
                <th className={adminTheme.table.headerCell}>Time limit</th>
                <th className={adminTheme.table.headerCell}>Status</th>
                <th className={cn(adminTheme.table.headerCell, "text-right")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id} className={adminTheme.table.row}>
                  <td className={adminTheme.table.cell}>
                    <div className="font-medium text-slate-900">{r.name}</div>
                  </td>
                  <td className={cn(adminTheme.table.cellMuted, "max-w-[220px] truncate")}>
                    {r.description || "—"}
                  </td>
                  <td className={cn(adminTheme.table.cellMuted, "max-w-[220px] truncate")}>
                    {r.instructions || "—"}
                  </td>
                  <td className={adminTheme.table.cellMuted}>{r.question_limit ?? "—"}</td>
                  <td className={adminTheme.table.cellMuted}>
                    {r.time_limit_minutes ? `${r.time_limit_minutes} min` : "—"}
                  </td>
                  <td className={adminTheme.table.cell}>
                    <StatusSwitch active={r.status === "ACTIVE"} onRequestToggle={() => requestToggle(r, "name")} />
                  </td>
                  <td className={cn(adminTheme.table.cell, "text-right")}>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openEdit(r)} className={adminTheme.button.iconGhost}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => setDeleteId(r.id)}
                        className={cn(adminTheme.button.iconGhost, "hover:text-red-600")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!deleteId}
        name={rows.find((r) => r.id === deleteId)?.name}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => remove(deleteId)}
      />

      <StatusToggleModal
        open={!!pendingToggle}
        name={pendingToggle?.name}
        nextStatus={pendingToggle?.nextStatus}
        onCancel={cancelToggle}
        onConfirm={handleConfirmToggle}
      />

      <TablePagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        totalRows={filtered.length}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />

      <SubsectionFormModal
        open={!!modal}
        mode={modal?.mode}
        form={form}
        setForm={setForm}
        onClose={closeModal}
        onSave={save}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Top bar — same pattern as AssessmentOverview's TopBar (icon + title +
// subtitle on the left, border-b bg-white shell, max-w-[1600px] container)
// ---------------------------------------------------------------------------
const TopBar = () => (
  <div className={cn("border-b bg-white", adminTheme.border.default)}>
    <div className="mx-auto flex max-w-[1600px] flex-wrap items-start justify-between gap-4 px-3 py-5 sm:px-4 lg:px-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <LayoutGrid className="h-5 w-5 text-slate-400" />
          Assessment Structure
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage grades, sections, and subsections used across assessment versions.
        </p>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Page shell with pill-style tabs (same look as AssessmentsListCard's
// Published/Draft/Archived switcher)
// ---------------------------------------------------------------------------
const TABS = [
  { key: "grades", label: "Grades", icon: GraduationCap, Component: GradesTab },
  { key: "sections", label: "Sections", icon: LayoutGrid, Component: SectionsTab },
  { key: "subsections", label: "Subsections", icon: ListTree, Component: SubsectionsTab },
];

const AssessmentStructure = () => {
  const [active, setActive] = useState("grades");
  const ActiveComponent = TABS.find((tb) => tb.key === active)?.Component;


  return (
    <div className={cn("min-h-screen", adminTheme.surface.page)}>
      <TopBar />

      <main className="mx-auto max-w-[1600px] space-y-4 px-3 py-6 sm:px-4 lg:px-0">
        <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={cn(
                key === active ? adminTheme.actionButton.pillActive : adminTheme.actionButton.pillInactive,
                "inline-flex items-center gap-1.5"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  );
};

export default AssessmentStructure;