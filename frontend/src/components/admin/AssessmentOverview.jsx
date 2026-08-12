  import { useMemo, useState, useCallback, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import {
    Plus,
    UserPlus,
    Download,
    LayoutDashboard,
    Pencil,
    Eye,
    FileClock,
    ChevronLeft,
    ChevronRight,
    Archive,
    Trash2,
    CheckCircle2,
    X,
    Inbox,
  } from "lucide-react";
  import { cn } from "@/lib/utils";
  import { adminTheme } from "@/theme/adminTheme";
  import { useDispatch, useSelector } from "react-redux";
  import { fetchAssessmentListSlice } from "../../slices/assessmentSlice";

  // ---- Constants -------------------------------------------------------------

  const ASSESSMENT_STATUS_META = {
    DRAFT: { label: "Draft", badge: "bg-amber-50 text-amber-700" },
    PUBLISHED: { label: "Published", badge: "bg-emerald-50 text-emerald-700" },
    ARCHIVED: { label: "Archived", badge: "bg-slate-100 text-slate-500" },
  };

  const ASSESSMENT_TYPE_LABELS = {
    CAREER: "Career",
    APTITUDE: "Aptitude",
    INTEREST: "Interest",
    PERSONALITY: "Personality",
    PSYCHOMETRIC: "Psychometric",
  };

  const ASSESSMENT_LIST_TABS = ["All", "Published", "Draft", "Archived"];
  const PAGE_SIZE_OPTIONS = [5, 10, 25];

  // ---- Small building blocks --------------------------------------------------

  const RowCheckbox = ({ checked, indeterminate = false, onChange, label }) => {
    const ref = useCallback(
      (node) => {
        if (node) node.indeterminate = indeterminate;
      },
      [indeterminate]
    );

    return (
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="h-[18px] w-[18px] rounded-[4px] border-2 border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer"
      />
    );
  };

  const BULK_ACTION_COPY = {
    publish: {
      title: "Publish selected assessments?",
      body: (count) => `${count} item${count === 1 ? "" : "s"} will go live and become visible to students immediately.`,
      confirmLabel: "Publish",
      tone: "default",
    },
    archive: {
      title: "Archive selected assessments?",
      body: (count) => `${count} item${count === 1 ? "" : "s"} will be moved out of active use. You can still find ${count === 1 ? "it" : "them"} under Archived.`,
      confirmLabel: "Archive",
      tone: "default",
    },
    delete: {
      title: "Delete selected assessments?",
      body: (count) => `${count} item${count === 1 ? "" : "s"} will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    },
  };

  // Blocking confirmation modal shown before any bulk action actually runs.
  // `action` is null when closed, or one of the BULK_ACTION_COPY keys.
  const ConfirmBulkActionDialog = ({ action, count, onConfirm, onCancel }) => {
    if (!action) return null;
    const copy = BULK_ACTION_COPY[action];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
        onClick={onCancel}
        role="presentation"
      >
        <div
          className={cn(adminTheme.card.base, "w-full max-w-sm p-5")}
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="bulk-action-title"
        >
          <p id="bulk-action-title" className="text-base font-semibold text-slate-900">
            {copy.title}
          </p>
          <p className="mt-2 text-sm text-slate-500">{copy.body(count)}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white",
                copy.tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {copy.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Top bar: page title on the left, action buttons on the right — matching
  // the pattern used on other admin pages (e.g. QuestionMapping).
  const TopBar = () => {
    const navigate = useNavigate();

    const handleNewAssessment = useCallback(() => {
      navigate("/s-admin/create-assessment");
    }, [navigate]);

    return (
      <div className={cn("border-b bg-white", adminTheme.border.default)}>
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-start justify-between gap-4 px-3 py-5 sm:px-4 lg:px-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <LayoutDashboard className="h-5 w-5 text-slate-400" />
              Assessment Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              All assessments across the platform — create, publish, and manage from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleNewAssessment} className={adminTheme.actionButton.primary}>
              <Plus className="h-4 w-4" />
              New Assessment
            </button>
            <button type="button" className={adminTheme.actionButton.secondary}>
              <UserPlus className="h-4 w-4" />
              Invite User
            </button>
            <button type="button" className={adminTheme.actionButton.secondary}>
              <Download className="h-4 w-4" />
              Download Global Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Single row in the assessments list. Drafts get a Pencil ("Continue
  // Editing") action since they route back into the CreateAssessment wizard;
  // published/archived versions get a read-only Eye ("View") action instead.
  const AssessmentListRow = ({ assessment, onOpen, selected, onToggleSelect }) => {
    const statusMeta = ASSESSMENT_STATUS_META[assessment.status];
    const isDraft = assessment.status === "DRAFT";

    return (
      <tr className={cn(adminTheme.table.row, selected && "bg-indigo-50/40")}>
        <td className={cn(adminTheme.table.cell, "w-10")}>
          <RowCheckbox checked={selected} onChange={() => onToggleSelect(assessment.id)} label={`Select ${assessment.name}`} />
        </td>
        <td className={cn(adminTheme.table.cell, "font-medium text-slate-900")}>{assessment.name}</td>
        <td className={adminTheme.table.cell}>
          <span className={cn(adminTheme.badge.neutral, "uppercase")}>
            {ASSESSMENT_TYPE_LABELS[assessment.type] ?? assessment.type}
          </span>
        </td>
        <td className={adminTheme.table.cellMuted}>{assessment.version}</td>
        <td className={adminTheme.table.cellMuted}>{assessment.sectionsCount}</td>
        <td className={adminTheme.table.cell}>
          <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium", statusMeta.badge)}>
            {statusMeta.label}
          </span>
        </td>
        <td className={cn(adminTheme.table.cellMuted, "whitespace-nowrap")}>{assessment.updatedAt}</td>
        <td className={cn(adminTheme.table.cell, "text-right")}>
          <button
            type="button"
            onClick={() => onOpen(assessment)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {isDraft ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {isDraft ? "Continue Editing" : "View"}
          </button>
        </td>
      </tr>
    );
  };

  // Pagination bar: page-size selector on the left, page controls on the
  // right. Kept as its own component so it can be reused by other admin
  // tables.
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
        <span>
          {totalRows === 0 ? "0 of 0" : `${rangeStart}–${rangeEnd} of ${totalRows}`}
        </span>
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

  const AssessmentsListCard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { assessmentList, listLoading } = useSelector((state) => state.assessment);

    const [tab, setTab] = useState("All");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [pendingAction, setPendingAction] = useState(null); // null | "publish" | "archive" | "delete"

    const assessments = useMemo(() => {
      const list = Array.isArray(assessmentList)
        ? assessmentList
        : Array.isArray(assessmentList?.results)
        ? assessmentList.results
        : Array.isArray(assessmentList?.data)
        ? assessmentList.data
        : [];

      return list.map((item) => ({
        id: item.assessment_id,
        name: item.assessment_name,
        type: item.assessment_type,
        version: item.version_number,
        sectionsCount: item.total_sections,
        status: item.status,
        updatedAt: new Date(item.updated_at).toLocaleString(),
      }));
    }, [assessmentList]);

    useEffect(() => {
      dispatch(fetchAssessmentListSlice());
    }, [dispatch]);

    const filtered = useMemo(() => {
      switch (tab) {
        case "Published":
          return assessments.filter((item) => item.status === "PUBLISHED");
        case "Draft":
          return assessments.filter((item) => item.status === "DRAFT");
        case "Archived":
          return assessments.filter((item) => item.status === "ARCHIVED");
        default:
          return assessments;
      }
    }, [assessments, tab]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, pageCount);

    const paginated = useMemo(() => {
      const start = (safePage - 1) * pageSize;
      return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, filtered.length);

    const draftCount = useMemo(() => assessments.filter((a) => a.status === "DRAFT").length, [assessments]);

    // Selection is tracked by id across the whole filtered set, not just the
    // current page, so a bulk action can act on everything the admin picked
    // even after they paginate away.
    const pageIds = useMemo(() => paginated.map((a) => a.id), [paginated]);
    const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;
    const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
    const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;

    const handleToggleSelect = useCallback((id) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, []);

    const handleToggleSelectPage = useCallback(() => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (allOnPageSelected) {
          pageIds.forEach((id) => next.delete(id));
        } else {
          pageIds.forEach((id) => next.add(id));
        }
        return next;
      });
    }, [allOnPageSelected, pageIds]);

    const handleTabChange = useCallback((next) => {
      setTab(next);
      setPage(1);
    }, []);

    const handleConfirmBulkAction = useCallback(() => {
      // TODO: wire up to real publish/archive/delete API calls (e.g. dispatch
      // a thunk), then refetch via fetchAssessmentListSlice(). The list here
      // is redux-backed, so it isn't mutated locally.
      setSelectedIds(new Set());
      setPendingAction(null);
    }, []);

    const handlePageSizeChange = useCallback((size) => {
      setPageSize(size);
      setPage(1);
    }, []);

    const handleOpen = useCallback(
      (assessment) => {
        if (assessment.status === "DRAFT") {
          navigate(`/s-admin/create-assessment?id=${assessment.id}`);
        } else {
          // No read-only assessment detail route exists yet — wire this up
          // once one does, e.g. navigate(`/s-admin/assessments/${assessment.id}`).
          navigate("/s-admin/create-assessment");
        }
      },
      [navigate]
    );

    const emptyState = {
      All: {
        title: "No assessments available",
        description: "There are no assessments available at the moment.",
      },
      Draft: {
        title: "No draft assessments available",
        description: "You don't have any draft assessments. Create a new assessment to get started.",
      },
      Published: {
        title: "No published assessments available",
        description: "There are no published assessments yet. Publish an assessment to make it available.",
      },
      Archived: {
        title: "No archived assessments available",
        description: "There are no archived assessments.",
      },
    };

    return (
      <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={adminTheme.card.title}>Assessments</p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
            {ASSESSMENT_LIST_TABS.map((option) => {
              const count =
                option === "All"
                  ? assessments.length
                  : assessments.filter((a) => a.status.toUpperCase() === option.toUpperCase()).length;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleTabChange(option)}
                  className={cn(
                    option === tab ? adminTheme.actionButton.pillActive : adminTheme.actionButton.pillInactive,
                    "inline-flex items-center gap-1.5"
                  )}
                >
                  {option === "Draft" && <FileClock className="h-3.5 w-3.5" />}
                  {option}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-bold",
                      option === tab ? "bg-white/20" : "bg-slate-200/70 text-slate-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {tab === "All" && draftCount > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <FileClock className="h-3.5 w-3.5" />
            {draftCount} draft{draftCount === 1 ? "" : "s"} not yet published — switch to the Draft tab to pick one up.
          </p>
        )}

        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold">
                {selectedIds.size} item{selectedIds.size === 1 ? "" : "s"} selected
              </span>
              <span className="h-4 w-px shrink-0 bg-white/20" />
              <button
                type="button"
                onClick={() => setPendingAction("publish")}
                className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Publish
              </button>
              <button
                type="button"
                onClick={() => setPendingAction("archive")}
                className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white"
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>
              <button
                type="button"
                onClick={() => setPendingAction("delete")}
                className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              aria-label="Clear selection"
              className="shrink-0 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <ConfirmBulkActionDialog
          action={pendingAction}
          count={selectedIds.size}
          onConfirm={handleConfirmBulkAction}
          onCancel={() => setPendingAction(null)}
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className={cn(adminTheme.table.headerCell, "w-10")}>
                  <RowCheckbox
                    checked={allOnPageSelected}
                    indeterminate={someOnPageSelected}
                    onChange={handleToggleSelectPage}
                    label="Select all rows on this page"
                  />
                </th>
                <th className={adminTheme.table.headerCell}>Name</th>
                <th className={adminTheme.table.headerCell}>Type</th>
                <th className={adminTheme.table.headerCell}>Version</th>
                <th className={adminTheme.table.headerCell}>Sections</th>
                <th className={adminTheme.table.headerCell}>Status</th>
                <th className={adminTheme.table.headerCell}>Last Updated</th>
                <th className={cn(adminTheme.table.headerCell, "text-right")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Inbox className="h-12 w-12 text-slate-300" />
                      <h3 className="mt-4 text-base font-semibold text-slate-700">{emptyState[tab].title}</h3>
                      <p className="mt-2 max-w-sm text-sm text-slate-500">{emptyState[tab].description}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((assessment) => (
                  <AssessmentListRow
                    key={assessment.id}
                    assessment={assessment}
                    selected={selectedIds.has(assessment.id)}
                    onToggleSelect={handleToggleSelect}
                    onOpen={handleOpen}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          totalRows={filtered.length}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
        />
      </div>
    );
  };

  // ---- Page -------------------------------------------------------------------

  const AssessmentOverview = () => {
    return (
      <div className={cn("min-h-screen", adminTheme.surface.page)}>
        <TopBar />

        <main className="mx-auto max-w-[1600px] space-y-4 px-3 py-6 sm:px-4 lg:px-0">
          <AssessmentsListCard />
        </main>
      </div>
    );
  };

  export default AssessmentOverview;


// import { useMemo, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Plus,
//   UserPlus,
//   Download,
//   KeyRound,
//   Copy,
//   Check,
//   Sparkles,
//   LayoutDashboard,
//   Pencil,
//   Eye,
//   FileClock,
//   ChevronLeft,
//   ChevronRight,
//   Archive,
//   Trash2,
//   CheckCircle2,
//   X,
//   Inbox,
// } from "lucide-react";
// import {
//   ResponsiveContainer,
//   ComposedChart,
//   Area,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import { cn } from "@/lib/utils";
// import { adminTheme } from "@/theme/adminTheme";
// import { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchAssessmentListSlice } from "../../slices/assessmentSlice";



// // ---- Sample data (wire these up to your API) ----------------------------

// // Number of weekly buckets shown per range option.
// const RANGE_CONFIG = {
//   "7D": 6,
//   "30D": 10,
//   "90D": 14,
// };

// // Builds a clean set of Y-axis ticks in fixed steps (e.g. -25, 0, 25, 50, 75…)
// // instead of letting the axis snap to raw dataMin/dataMax values.
// const getNiceYTicks = (data, step = 25) => {
//   const values = data.flatMap((point) => [point.started, point.completed]);
//   const min = Math.min(...values, 0);
//   const max = Math.max(...values);

//   const niceMin = Math.floor(min / step) * step;
//   const niceMax = Math.ceil(max / step) * step;

//   const ticks = [];
//   for (let value = niceMin; value <= niceMax; value += step) {
//     ticks.push(value);
//   }
//   return ticks;
// };

// const STARTED_COLOR = "#4f46e5"; // indigo-600 — assessment_attempts.started_at
// const COMPLETED_COLOR = "#94a3b8"; // slate-400 — assessment_attempts.submitted_at

// // Backing queries (grouped by ISO week):
// //   Started   -> COUNT(assessment_attempts.id) GROUP BY WEEK(started_at)
// //   Completed -> COUNT(assessment_attempts.id) WHERE attempt_status IN
// //                ('SUBMITTED','AUTO_SUBMITTED','EVALUATED') GROUP BY WEEK(submitted_at)
// const generateActivitySeries = (weekCount) => {
//   const points = [];

//   for (let week = 1; week <= weekCount; week += 1) {
//     const progress = week / weekCount;
//     const wave = Math.sin(progress * Math.PI * 2.5) * 12;
//     const started = Math.round(45 + progress * 45 + wave);
//     const completionRate = 0.82 + Math.sin(progress * Math.PI * 1.7) * 0.06;
//     const completed = Math.min(started, Math.round(started * completionRate));

//     points.push({
//       date: `Wk${week}`,
//       started,
//       completed,
//       // Stacked-area helper: draws an invisible baseline up to `completed`,
//       // then a shaded band for the `gap` on top of it (i.e. up to `started`).
//       gap: started - completed,
//     });
//   }

//   return points;
// };

// // Backing queries:
// //   Total Assessments Taken -> COUNT(assessment_attempts.id) WHERE attempt_status = 'EVALUATED'
// //   Active Students         -> COUNT(students.id) WHERE status = 'ACTIVE'
// const METRICS = [
//   { label: "Assessments Taken", value: "42,910", delta: "+12%", trend: "up" },
//   { label: "Active Students", value: "18,420", delta: "+5%", trend: "up" },
// ];

// // Backing query: organizations grouped by organization_type
// // (enum: SCHOOL, COLLEGE, COACHING, COUNSELLOR, ENTERPRISE, NGO, FRANCHISE)
// // Percentages are illustrative; compute as COUNT(*) per type / COUNT(*) total.
// const ORG_TYPE_DISTRIBUTION = [
//   { name: "Schools", orgType: "SCHOOL", value: 52 },
//   { name: "Enterprises", orgType: "ENTERPRISE", value: 28 },
//   { name: "NGOs", orgType: "NGO", value: 20 },
// ];

// // Backing source: a unified activity feed — in practice a UNION of recent
// // rows from assessment_versions.published_at, organizations.created_at,
// // user_roles.assigned_at, and report_files.generated_at, ordered by time.
// const RECENT_ACTIVITIES = [
//   {
//     id: 1,
//     text: "Assessment version published by",
//     emphasis: "St. Xavier's",
//     time: "2m ago",
//     active: true,
//     source: "assessment_versions.published_at",
//   },
//   {
//     id: 2,
//     text: "Role reassigned",
//     emphasis: "Admin → Auditor",
//     time: "1h ago",
//     active: true,
//     source: "user_roles.assigned_at",
//   },
//   {
//     id: 3,
//     text: "Report exported",
//     emphasis: "Q2 PDF",
//     time: "3h ago",
//     active: true,
//     source: "report_files.generated_at",
//   },
//   {
//     id: 4,
//     text: "New organization onboarded",
//     emphasis: "Meridian NGO",
//     time: "Yesterday",
//     active: false,
//     source: "organizations.created_at",
//   },
// ];

// const AUDIT_LOG = [
//   { event: "Assessment version published", actor: "Priya N.", delta: "+1", when: "10:42" },
//   { event: "Role reassigned", actor: "Admin", delta: "–", when: "09:18" },
//   { event: "Organization onboarded", actor: "System", delta: "+1", when: "08:05" },
//   { event: "Report exported", actor: "Diego R.", delta: "–", when: "07:50" },
// ];

// const AUDIT_TABS = ["All", "Internal", "External"];
// const RANGE_OPTIONS = Object.keys(RANGE_CONFIG);


// const ASSESSMENT_STATUS_META = {
//   DRAFT: { label: "Draft", badge: "bg-amber-50 text-amber-700" },
//   PUBLISHED: { label: "Published", badge: "bg-emerald-50 text-emerald-700" },
//   ARCHIVED: { label: "Archived", badge: "bg-slate-100 text-slate-500" },
// };

// const ASSESSMENT_TYPE_LABELS = {
//   CAREER: "Career",
//   APTITUDE: "Aptitude",
//   INTEREST: "Interest",
//   PERSONALITY: "Personality",
//   PSYCHOMETRIC: "Psychometric",
// };

// const INITIAL_ASSESSMENTS = [
//   { id: "asmt-career-g10", name: "Career Assessment – Grade 10", type: "CAREER", version: "V1.0", status: "PUBLISHED", sectionsCount: 4, updatedAt: "2 days ago" },
//   { id: "asmt-aptitude-jr", name: "Aptitude Assessment – Junior", type: "APTITUDE", version: "V2.0", status: "PUBLISHED", sectionsCount: 3, updatedAt: "1 week ago" },
//   { id: "asmt-personality-g12", name: "Personality Profile – Grade 12", type: "PERSONALITY", version: "V1.0", status: "DRAFT", sectionsCount: 2, updatedAt: "5 hours ago" },
//   { id: "asmt-interest-ms", name: "Interest Inventory – Middle School", type: "INTEREST", version: "V1.0", status: "DRAFT", sectionsCount: 1, updatedAt: "Yesterday" },
//   { id: "asmt-psychometric-2023", name: "Psychometric Screener 2023", type: "PSYCHOMETRIC", version: "V1.0", status: "ARCHIVED", sectionsCount: 5, updatedAt: "3 months ago" },
//   { id: "asmt-career-g11", name: "Career Assessment – Grade 11", type: "CAREER", version: "V1.2", status: "PUBLISHED", sectionsCount: 4, updatedAt: "3 days ago" },
//   { id: "asmt-aptitude-sr", name: "Aptitude Assessment – Senior", type: "APTITUDE", version: "V1.0", status: "PUBLISHED", sectionsCount: 3, updatedAt: "4 days ago" },
//   { id: "asmt-interest-hs", name: "Interest Inventory – High School", type: "INTEREST", version: "V1.1", status: "PUBLISHED", sectionsCount: 2, updatedAt: "1 week ago" },
//   { id: "asmt-personality-adult", name: "Personality Profile – Adult", type: "PERSONALITY", version: "V1.0", status: "DRAFT", sectionsCount: 3, updatedAt: "2 hours ago" },
//   { id: "asmt-psychometric-2024", name: "Psychometric Screener 2024", type: "PSYCHOMETRIC", version: "V2.0", status: "PUBLISHED", sectionsCount: 5, updatedAt: "6 days ago" },
//   { id: "asmt-career-g9", name: "Career Assessment – Grade 9", type: "CAREER", version: "V1.0", status: "ARCHIVED", sectionsCount: 4, updatedAt: "2 months ago" },
//   { id: "asmt-aptitude-college", name: "Aptitude Assessment – College", type: "APTITUDE", version: "V1.3", status: "PUBLISHED", sectionsCount: 3, updatedAt: "2 weeks ago" },
//   { id: "asmt-interest-college", name: "Interest Inventory – College", type: "INTEREST", version: "V1.0", status: "DRAFT", sectionsCount: 1, updatedAt: "Today" },
//   { id: "asmt-personality-g10", name: "Personality Profile – Grade 10", type: "PERSONALITY", version: "V1.1", status: "PUBLISHED", sectionsCount: 2, updatedAt: "5 days ago" },
//   { id: "asmt-psychometric-jr", name: "Psychometric Screener – Junior", type: "PSYCHOMETRIC", version: "V1.0", status: "DRAFT", sectionsCount: 4, updatedAt: "Yesterday" },
//   { id: "asmt-career-vocational", name: "Career Assessment – Vocational", type: "CAREER", version: "V1.0", status: "PUBLISHED", sectionsCount: 4, updatedAt: "3 weeks ago" },
//   { id: "asmt-aptitude-2022", name: "Aptitude Screener 2022", type: "APTITUDE", version: "V1.0", status: "ARCHIVED", sectionsCount: 3, updatedAt: "5 months ago" },
// ];

// const ASSESSMENT_LIST_TABS = ["All", "Published", "Draft", "Archived"];
// const PAGE_SIZE_OPTIONS = [5, 10, 25];


// const generateSecureToken = (prefix = "sk_live_aether_") => {
//   const bytes = new Uint8Array(24);
//   if (typeof crypto !== "undefined" && crypto.getRandomValues) {
//     crypto.getRandomValues(bytes);
//   } else {
//     for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
//   }
//   const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
//   return `${prefix}${hex}`;
// };

// const maskToken = (token, visible = 4) => {
//   if (!token) return "";
//   const tail = token.slice(-visible);
//   return `${token.split("_").slice(0, -1).join("_")}_${"•".repeat(8)}${tail}`;
// };

// // ---- Small building blocks ------------------------------------------------

// const ActivityTooltip = ({ active, payload, label }) => {
//   if (!active || !payload?.length) return null;
//   const point = payload[0]?.payload;
//   if (!point) return null;

//   return (
//     <div className={cn(adminTheme.radius.lg, adminTheme.shadow.sm, "border border-slate-100 bg-white px-4 py-3")}>
//       <p className="text-sm font-semibold text-slate-900">{label}</p>
//       <div className="mt-2 space-y-1.5">
//         <div className="flex items-center gap-2 text-sm text-slate-500">
//           <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STARTED_COLOR }} />
//           Started: <span className="font-semibold text-slate-900">{point.started}</span>
//         </div>
//         <div className="flex items-center gap-2 text-sm text-slate-500">
//           <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COMPLETED_COLOR }} />
//           Completed: <span className="font-semibold text-slate-900">{point.completed}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ChartLegendDot = ({ color, label }) => (
//   <span className="flex items-center gap-1.5 text-sm text-slate-500">
//     <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
//     {label}
//   </span>
// );


// const CareerReadinessRing = ({ percent = 84, size = 44 }) => {
//   const stroke = 5;
//   const radius = (size - stroke) / 2;
//   const circumference = 2 * Math.PI * radius;
//   const offset = circumference - (percent / 100) * circumference;

//   return (
//     <svg width={size} height={size} className="-rotate-90">
//       <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
//       <circle
//         cx={size / 2}
//         cy={size / 2}
//         r={radius}
//         fill="none"
//         stroke="#0f172a"
//         strokeWidth={stroke}
//         strokeLinecap="round"
//         strokeDasharray={circumference}
//         strokeDashoffset={offset}
//       />
//     </svg>
//   );
// };

// const AvatarStack = () => {
//   const initials = ["ED", "HS"];
//   return (
//     <div className="flex -space-x-2">
//       {initials.map((label) => (
//         <div
//           key={label}
//           className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[9px] font-semibold text-white ring-2 ring-white"
//         >
//           {label}
//         </div>
//       ))}
//       <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500 ring-2 ring-white">
//         +
//       </div>
//     </div>
//   );
// };


// const RowCheckbox = ({ checked, indeterminate = false, onChange, label }) => {
//   const ref = useCallback(
//     (node) => {
//       if (node) node.indeterminate = indeterminate;
//     },
//     [indeterminate]
//   );

//   return (
//     <input
//       ref={ref}
//       type="checkbox"
//       checked={checked}
//       onChange={onChange}
//       aria-label={label}
//       className="h-[18px] w-[18px] rounded-[4px] border-2 border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer"
//     />
//   );
// };


// const BULK_ACTION_COPY = {
//   publish: {
//     title: "Publish selected assessments?",
//     body: (count) => `${count} item${count === 1 ? "" : "s"} will go live and become visible to students immediately.`,
//     confirmLabel: "Publish",
//     tone: "default",
//   },
//   archive: {
//     title: "Archive selected assessments?",
//     body: (count) => `${count} item${count === 1 ? "" : "s"} will be moved out of active use. You can still find ${count === 1 ? "it" : "them"} under Archived.`,
//     confirmLabel: "Archive",
//     tone: "default",
//   },
//   delete: {
//     title: "Delete selected assessments?",
//     body: (count) => `${count} item${count === 1 ? "" : "s"} will be permanently deleted. This can't be undone.`,
//     confirmLabel: "Delete",
//     tone: "danger",
//   },
// };

// // Blocking confirmation modal shown before any bulk action actually runs.
// // `action` is null when closed, or one of the BULK_ACTION_COPY keys.
// const ConfirmBulkActionDialog = ({ action, count, onConfirm, onCancel }) => {
//   if (!action) return null;
//   const copy = BULK_ACTION_COPY[action];

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
//       onClick={onCancel}
//       role="presentation"
//     >
//       <div
//         className={cn(adminTheme.card.base, "w-full max-w-sm p-5")}
//         onClick={(e) => e.stopPropagation()}
//         role="alertdialog"
//         aria-modal="true"
//         aria-labelledby="bulk-action-title"
//       >
//         <p id="bulk-action-title" className="text-base font-semibold text-slate-900">
//           {copy.title}
//         </p>
//         <p className="mt-2 text-sm text-slate-500">{copy.body(count)}</p>
//         <div className="mt-5 flex justify-end gap-2">
//           <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
//             Cancel
//           </button>
//           <button
//             type="button"
//             onClick={onConfirm}
//             className={cn(
//               "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white",
//               copy.tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
//             )}
//           >
//             {copy.confirmLabel}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };



// // Top bar: page title on the left, action buttons on the right — matching
// // the pattern used on other admin pages (e.g. QuestionMapping).
// const TopBar = () => {
//   const navigate = useNavigate();

//   const handleNewAssessment = useCallback(() => {
//     navigate("/s-admin/create-assessment");
//   }, [navigate]);

//   return (
//     <div className={cn("border-b bg-white", adminTheme.border.default)}>
//       <div className="mx-auto flex max-w-[1600px] flex-wrap items-start justify-between gap-4 px-3 py-5 sm:px-4 lg:px-6">
//         <div>
//           <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
//             <LayoutDashboard className="h-5 w-5 text-slate-400" />
//             Assessment Overview
//           </h1>
//           <p className="mt-1 text-sm text-slate-500">
//             A snapshot of assessment activity, organizations, and platform usage.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-3">
//           <button type="button" onClick={handleNewAssessment} className={adminTheme.actionButton.primary}>
//             <Plus className="h-4 w-4" />
//             New Assessment
//           </button>
//           <button type="button" className={adminTheme.actionButton.secondary}>
//             <UserPlus className="h-4 w-4" />
//             Invite User
//           </button>
//           <button type="button" className={adminTheme.actionButton.secondary}>
//             <Download className="h-4 w-4" />
//             Download Global Report
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Single row in the assessments list. Drafts get a Pencil ("Continue
// // Editing") action since they route back into the CreateAssessment wizard;
// // published/archived versions get a read-only Eye ("View") action instead.
// const AssessmentListRow = ({ assessment, onOpen, selected, onToggleSelect }) => {
//   const statusMeta = ASSESSMENT_STATUS_META[assessment.status];
//   const isDraft = assessment.status === "DRAFT";

//   return (
//     <tr className={cn(adminTheme.table.row, selected && "bg-indigo-50/40")}>
//       <td className={cn(adminTheme.table.cell, "w-10")}>
//         <RowCheckbox checked={selected} onChange={() => onToggleSelect(assessment.id)} label={`Select ${assessment.name}`} />
//       </td>
//       <td className={cn(adminTheme.table.cell, "font-medium text-slate-900")}>{assessment.name}</td>
//       <td className={adminTheme.table.cell}>
//         <span className={cn(adminTheme.badge.neutral, "uppercase")}>
//           {ASSESSMENT_TYPE_LABELS[assessment.type] ?? assessment.type}
//         </span>
//       </td>
//       <td className={adminTheme.table.cellMuted}>{assessment.version}</td>
//       <td className={adminTheme.table.cellMuted}>{assessment.sectionsCount}</td>
//       <td className={adminTheme.table.cell}>
//         <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium", statusMeta.badge)}>
//           {statusMeta.label}
//         </span>
//       </td>
//       <td className={cn(adminTheme.table.cellMuted, "whitespace-nowrap")}>{assessment.updatedAt}</td>
//       <td className={cn(adminTheme.table.cell, "text-right")}>
//         <button
//           type="button"
//           onClick={() => onOpen(assessment)}
//           className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
//         >
//           {isDraft ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
//           {isDraft ? "Continue Editing" : "View"}
//         </button>
//       </td>
//     </tr>
//   );
// };

// // Pagination bar: page-size selector on the left, page controls on the
// // right. Kept as its own component so it can be reused by other admin
// // tables (e.g. the audit log, once that grows past a handful of rows).
// const TablePagination = ({ page, pageCount, pageSize, onPageChange, onPageSizeChange, totalRows, rangeStart, rangeEnd }) => (
//   <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
//     <div className="flex items-center gap-2 text-sm text-slate-500">
//       <span>Rows per page</span>
//       <select
//         value={pageSize}
//         onChange={(e) => onPageSizeChange(Number(e.target.value))}
//         className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
//       >
//         {PAGE_SIZE_OPTIONS.map((size) => (
//           <option key={size} value={size}>
//             {size}
//           </option>
//         ))}
//       </select>
//     </div>

//     <div className="flex items-center gap-4 text-sm text-slate-500">
//       <span>
//         {totalRows === 0 ? "0 of 0" : `${rangeStart}–${rangeEnd} of ${totalRows}`}
//       </span>
//       <div className="flex items-center gap-1">
//         <button
//           type="button"
//           onClick={() => onPageChange(page - 1)}
//           disabled={page <= 1}
//           className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
//           aria-label="Previous page"
//         >
//           <ChevronLeft className="h-3.5 w-3.5" />
//         </button>
//         <span className="min-w-[64px] text-center text-xs font-medium text-slate-600">
//           Page {pageCount === 0 ? 0 : page} of {pageCount}
//         </span>
//         <button
//           type="button"
//           onClick={() => onPageChange(page + 1)}
//           disabled={page >= pageCount}
//           className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
//           aria-label="Next page"
//         >
//           <ChevronRight className="h-3.5 w-3.5" />
//         </button>
//       </div>
//     </div>
//   </div>
// );

// const AssessmentsListCard = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const { assessmentList, listLoading } = useSelector((state) => state.assessment);

//   const [tab, setTab] = useState("All");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const [selectedIds, setSelectedIds] = useState(() => new Set());

// const assessments = useMemo(() => {
//   const list = Array.isArray(assessmentList)
//     ? assessmentList
//     : Array.isArray(assessmentList?.results)
//     ? assessmentList.results
//     : Array.isArray(assessmentList?.data)
//     ? assessmentList.data
//     : [];

//   return list.map((item) => ({
//     id: item.assessment_id,
//     name: item.assessment_name,
//     type: item.assessment_type,
//     version: item.version_number,
//     sectionsCount: item.total_sections,
//     status: item.status,
//     updatedAt: new Date(item.updated_at).toLocaleString(),
//   }));
// }, [assessmentList]);

// useEffect(() => {
//   dispatch(fetchAssessmentListSlice());
// }, [dispatch]);

// const filtered = useMemo(() => {
//   switch (tab) {
//    case "Published":
//   return assessments.filter((item) => item.status === "PUBLISHED");

// case "Draft":
//   return assessments.filter((item) => item.status === "DRAFT");

// case "Archived":
//   return assessments.filter((item) => item.status === "ARCHIVED");

// default:
//   return assessments;
//   }
// }, [assessments, tab]);

//   const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const safePage = Math.min(page, pageCount);

//   const paginated = useMemo(() => {
//     const start = (safePage - 1) * pageSize;
//     return filtered.slice(start, start + pageSize);
//   }, [filtered, safePage, pageSize]);

//   const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
//   const rangeEnd = Math.min(safePage * pageSize, filtered.length);

//   const draftCount = useMemo(() => assessments.filter((a) => a.status === "DRAFT").length, [assessments]);

//   // Selection is tracked by id across the whole filtered set, not just the
//   // current page, so a bulk action (once wired to a real API) can act on
//   // everything the admin picked even after they paginate away.
//   const pageIds = useMemo(() => paginated.map((a) => a.id), [paginated]);
//   const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;
//   const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
//   const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;

//   const handleToggleSelect = useCallback((id) => {
//     setSelectedIds((prev) => {
//       const next = new Set(prev);
//       if (next.has(id)) next.delete(id);
//       else next.add(id);
//       return next;
//     });
//   }, []);

//   const handleToggleSelectPage = useCallback(() => {
//     setSelectedIds((prev) => {
//       const next = new Set(prev);
//       if (allOnPageSelected) {
//         pageIds.forEach((id) => next.delete(id));
//       } else {
//         pageIds.forEach((id) => next.add(id));
//       }
//       return next;
//     });
//   }, [allOnPageSelected, pageIds]);

//   const handleTabChange = useCallback((next) => {
//     setTab(next);
//     setPage(1);
//   }, []);

//   const [pendingAction, setPendingAction] = useState(null); // null | "publish" | "archive" | "delete"

 
//   const handleConfirmBulkAction = useCallback(() => {
//     if (pendingAction === "publish") {
//       setAssessments((prev) =>
//         prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: "PUBLISHED", updatedAt: "Just now" } : a))
//       );
//     } else if (pendingAction === "archive") {
//       setAssessments((prev) =>
//         prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: "ARCHIVED", updatedAt: "Just now" } : a))
//       );
//     } else if (pendingAction === "delete") {
//       setAssessments((prev) => prev.filter((a) => !selectedIds.has(a.id)));
//     }
//     setSelectedIds(new Set());
//     setPendingAction(null);
//   }, [pendingAction, selectedIds]);

//   const handlePageSizeChange = useCallback((size) => {
//     setPageSize(size);
//     setPage(1);
//   }, []);

//   const handleOpen = useCallback(
//     (assessment) => {
//       if (assessment.status === "DRAFT") {
//         navigate(`/s-admin/create-assessment?id=${assessment.id}`);
//       } else {
//         // No read-only assessment detail route exists yet — wire this up
//         // once one does, e.g. navigate(`/s-admin/assessments/${assessment.id}`).
//         navigate("/s-admin/create-assessment");
//       }
//     },
//     [navigate]
//   );

//   const emptyState = {
//   All: {
//     title: "No assessments available",
//     description: "There are no assessments available at the moment.",
//   },
//   Draft: {
//     title: "No draft assessments available",
//     description: "You don't have any draft assessments. Create a new assessment to get started.",
//   },
//   Published: {
//     title: "No published assessments available",
//     description: "There are no published assessments yet. Publish an assessment to make it available.",
//   },
//   Archived: {
//     title: "No archived assessments available",
//     description: "There are no archived assessments.",
//   },
// };
//   return (
//     <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//       <div className="flex flex-wrap items-start justify-between gap-4">
//         <div>
//           <p className={adminTheme.card.title}>Assessments</p>
//                </div>

//         <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
//           {ASSESSMENT_LIST_TABS.map((option) => {
//             const count =
//   option === "All"
//     ? assessments.length
//     : assessments.filter(
//         (a) => a.status.toUpperCase() === option.toUpperCase()
//       ).length;
//             return (
//               <button
//                 key={option}
//                 type="button"
//                 onClick={() => handleTabChange(option)}
//                 className={cn(
//                   option === tab ? adminTheme.actionButton.pillActive : adminTheme.actionButton.pillInactive,
//                   "inline-flex items-center gap-1.5"
//                 )}
//               >
//                 {option === "Draft" && <FileClock className="h-3.5 w-3.5" />}
//                 {option}
//                 <span
//                   className={cn(
//                     "rounded-full px-1.5 text-[10px] font-bold",
//                     option === tab ? "bg-white/20" : "bg-slate-200/70 text-slate-500"
//                   )}
//                 >
//                   {count}
//                 </span>
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {tab === "All" && draftCount > 0 && (
//         <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
//           <FileClock className="h-3.5 w-3.5" />
//           {draftCount} draft{draftCount === 1 ? "" : "s"} not yet published — switch to the Draft tab to pick one up.
//         </p>
//       )}

//       {selectedIds.size > 0 && (
//         <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
//           <div className="flex flex-wrap items-center gap-4">
//             <span className="font-semibold">
//               {selectedIds.size} item{selectedIds.size === 1 ? "" : "s"} selected
//             </span>
//             <span className="h-4 w-px shrink-0 bg-white/20" />
//             <button
//               type="button"
//               onClick={() => setPendingAction("publish")}
//               className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white"
//             >
//               <CheckCircle2 className="h-4 w-4" />
//               Publish
//             </button>
//             <button
//               type="button"
//               onClick={() => setPendingAction("archive")}
//               className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white"
//             >
//               <Archive className="h-4 w-4" />
//               Archive
//             </button>
//             <button
//               type="button"
//               onClick={() => setPendingAction("delete")}
//               className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white"
//             >
//               <Trash2 className="h-4 w-4" />
//               Delete
//             </button>
//           </div>
//           <button
//             type="button"
//             onClick={() => setSelectedIds(new Set())}
//             aria-label="Clear selection"
//             className="shrink-0 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>
//       )}

//       <ConfirmBulkActionDialog
//         action={pendingAction}
//         count={selectedIds.size}
//         onConfirm={handleConfirmBulkAction}
//         onCancel={() => setPendingAction(null)}
//       />

//       <div className="mt-4 overflow-x-auto">
//         <table className="w-full min-w-[760px] border-collapse">
//           <thead>
//             <tr>
//               <th className={cn(adminTheme.table.headerCell, "w-10")}>
//                 <RowCheckbox
//                   checked={allOnPageSelected}
//                   indeterminate={someOnPageSelected}
//                   onChange={handleToggleSelectPage}
//                   label="Select all rows on this page"
//                 />
//               </th>
//               <th className={adminTheme.table.headerCell}>Name</th>
//               <th className={adminTheme.table.headerCell}>Type</th>
//               <th className={adminTheme.table.headerCell}>Version</th>
//               <th className={adminTheme.table.headerCell}>Sections</th>
//               <th className={adminTheme.table.headerCell}>Status</th>
//               <th className={adminTheme.table.headerCell}>Last Updated</th>
//               <th className={cn(adminTheme.table.headerCell, "text-right")}>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//     {paginated.length === 0 ? (
//   <tr>
//     <td colSpan={8}>
//       <div className="flex flex-col items-center justify-center py-16 text-center">
//         <Inbox className="h-12 w-12 text-slate-300" />

//         <h3 className="mt-4 text-base font-semibold text-slate-700">
//           {emptyState[tab].title}
//         </h3>

//         <p className="mt-2 max-w-sm text-sm text-slate-500">
//           {emptyState[tab].description}
//         </p>
//       </div>
//     </td>
//   </tr>
// ) : (
//   paginated.map((assessment) => (
//     <AssessmentListRow
//       key={assessment.id}
//       assessment={assessment}
//       selected={selectedIds.has(assessment.id)}
//       onToggleSelect={handleToggleSelect}
//       onOpen={handleOpen}
//     />
//   ))
// )}
//           </tbody>
//         </table>
//       </div>

//       <TablePagination
//         page={safePage}
//         pageCount={pageCount}
//         pageSize={pageSize}
//         onPageChange={setPage}
//         onPageSizeChange={handlePageSizeChange}
//         totalRows={filtered.length}
//         rangeStart={rangeStart}
//         rangeEnd={rangeEnd}
//       />
//     </div>
//   );
// };

// const AssessmentTrendsCard = () => {
//   const [range, setRange] = useState("30D");
//   const weekCount = RANGE_CONFIG[range];

//   const data = useMemo(() => generateActivitySeries(weekCount), [weekCount]);
//   const yTicks = useMemo(() => getNiceYTicks(data, 25), [data]);

//   return (
//     <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//       <div className="flex flex-wrap items-start justify-between gap-4">
//         <div>
//           <p className={adminTheme.card.title}>Assessment Activity Over Time</p>
//           <p className={cn(adminTheme.card.subtitle, "mt-0.5")}>
//             New assessments started vs completed, weekly — from{" "}
//             <code className="text-xs">assessment_attempts</code>
//           </p>
//         </div>

//         <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
//           {RANGE_OPTIONS.map((option) => (
//             <button
//               key={option}
//               type="button"
//               onClick={() => setRange(option)}
//               className={option === range ? adminTheme.actionButton.pillActive : adminTheme.actionButton.pillInactive}
//             >
//               {option}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="mt-4 flex items-center justify-end gap-4">
//         <ChartLegendDot color={STARTED_COLOR} label="Started" />
//         <ChartLegendDot color={COMPLETED_COLOR} label="Completed" />
//       </div>

//       <div className="mt-4 h-64 sm:h-72">
//         <ResponsiveContainer width="100%" height="100%">
//           <ComposedChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
//             <CartesianGrid vertical={false} stroke={adminTheme.chart.gridStroke} strokeDasharray="3 3" />
//             <XAxis
//               dataKey="date"
//               tickLine={false}
//               axisLine={false}
//               tick={{ fill: adminTheme.chart.axisText, fontSize: 11 }}
//               interval="preserveStartEnd"
//               minTickGap={8}
//             />
//             <YAxis
//               tickLine={false}
//               axisLine={false}
//               tick={{ fill: adminTheme.chart.axisText, fontSize: 11 }}
//               ticks={yTicks}
//               domain={[yTicks[0], yTicks[yTicks.length - 1]]}
//               allowDecimals={false}
//             />
//             <Tooltip
//               content={<ActivityTooltip />}
//               cursor={{ stroke: adminTheme.chart.gridStroke, strokeDasharray: "4 4" }}
//             />

//             {/* Invisible stacked baseline up to `completed`, then a shaded
//                 band for `gap` on top of it — visually fills the space
//                 between the two lines from `completed` up to `started`. */}
//             <Area dataKey="completed" stackId="range" stroke="none" fill="transparent" isAnimationActive={false} />
//             <Area
//               dataKey="gap"
//               stackId="range"
//               stroke="none"
//               fill={STARTED_COLOR}
//               fillOpacity={0.08}
//               isAnimationActive={false}
//             />

//             <Line
//               type="monotone"
//               dataKey="started"
//               stroke={STARTED_COLOR}
//               strokeWidth={2.5}
//               dot={false}
//               activeDot={{ r: 5, stroke: STARTED_COLOR, strokeWidth: 2, fill: "#fff" }}
//             />
//             <Line
//               type="monotone"
//               dataKey="completed"
//               stroke={COMPLETED_COLOR}
//               strokeWidth={2.5}
//               dot={false}
//               activeDot={{ r: 5, stroke: COMPLETED_COLOR, strokeWidth: 2, fill: "#fff" }}
//             />
//           </ComposedChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// const MetricCard = ({ label, value, delta }) => (
//   <div className={cn(adminTheme.card.base, "px-5 py-4")}>
//     <p className={adminTheme.card.subtitle}>{label}</p>
//     <div className="mt-1.5 flex items-baseline gap-2">
//       <span className="text-2xl font-semibold text-slate-900">{value}</span>
//       {delta && <span className={adminTheme.badge.positive}>{delta}</span>}
//     </div>
//   </div>
// );

// // Backing query: COUNT(organizations.id) WHERE status = 'ACTIVE'
// const OrgPartnersCard = () => (
//   <div className={cn(adminTheme.card.base, "px-5 py-4")}>
//     <p className={adminTheme.card.subtitle}>Organization Partners</p>
//     <div className="mt-1.5 flex items-center gap-3">
//       <span className="text-2xl font-semibold text-slate-900">256</span>
//       <AvatarStack />
//     </div>
//   </div>
// );

// // Backing query: AVG(evaluation_results.percentage) for assessment_type = 'CAREER'
// const CareerReadinessCard = () => (
//   <div className={cn(adminTheme.card.base, "px-5 py-4")}>
//     <p className={adminTheme.card.subtitle}>Career Readiness Score</p>
//     <div className="mt-1.5 flex items-center gap-3">
//       <CareerReadinessRing percent={84} />
//       <span className="text-2xl font-semibold text-slate-900">
//         84<span className="text-base font-medium text-slate-400">%</span>
//       </span>
//     </div>
//   </div>
// );

// const MetricsRow = () => (
//   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//     {METRICS.map((metric) => (
//       <MetricCard key={metric.label} {...metric} />
//     ))}
//     <OrgPartnersCard />
//     <CareerReadinessCard />
//   </div>
// );

// const CredentialBanner = () => {
//   const [token, setToken] = useState(() => generateSecureToken());
//   const [copied, setCopied] = useState(false);
//   const [justGenerated, setJustGenerated] = useState(false);

//   const handleCopy = useCallback(async () => {
//     try {
//       if (navigator?.clipboard?.writeText) {
//         await navigator.clipboard.writeText(token);
//       } else {
//         // Fallback for insecure contexts / older browsers.
//         const textarea = document.createElement("textarea");
//         textarea.value = token;
//         textarea.style.position = "fixed";
//         textarea.style.opacity = "0";
//         document.body.appendChild(textarea);
//         textarea.focus();
//         textarea.select();
//         document.execCommand("copy");
//         document.body.removeChild(textarea);
//       }
//       setCopied(true);
//       setTimeout(() => setCopied(false), 1800);
//     } catch (err) {
//       console.error("Failed to copy token:", err);
//     }
//   }, [token]);

//   const handleGenerate = useCallback(() => {
//     // If tokens must be issued/validated server-side, replace this line
//     // with a POST to your admin-token endpoint and setToken(response.token).
//     const next = generateSecureToken();
//     setToken(next);
//     setCopied(false);
//     setJustGenerated(true);
//     setTimeout(() => setJustGenerated(false), 1800);
//   }, []);

//   return (
//     <div className={adminTheme.banner.base}>
//       <div className="flex items-center gap-3">
//         <div className={adminTheme.banner.iconWrap}>
//           <KeyRound className="h-4 w-4" />
//         </div>
//         <div>
//           <p className="text-sm font-semibold">Virtual Key Credential</p>
//           <p className={adminTheme.banner.mono}>{maskToken(token)}</p>
//         </div>
//       </div>
//       <div className="flex shrink-0 items-center gap-2">
//         <button type="button" onClick={handleCopy} className={adminTheme.banner.buttonGhost}>
//           {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
//           {copied ? "Copied" : "Copy Key"}
//         </button>
//         <button type="button" onClick={handleGenerate} className={adminTheme.banner.buttonSolid}>
//           <Sparkles className="h-3.5 w-3.5" />
//           {justGenerated ? "Generated" : "Generate Admin Token"}
//         </button>
//       </div>
//     </div>
//   );
// };

// const RecentActivitiesCard = () => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <p className={adminTheme.card.title}>Recent Activities</p>
//     <ul className="mt-4 space-y-4">
//       {RECENT_ACTIVITIES.map((item) => (
//         <li key={item.id} className="flex items-start gap-2.5">
//           <span
//             className={cn("mt-1.5 shrink-0", item.active ? adminTheme.timeline.dotActive : adminTheme.timeline.dotMuted)}
//           />
//           <div>
//             <p className={adminTheme.timeline.title}>
//               {item.text} <span className={adminTheme.timeline.emphasis}>{item.emphasis}</span>
//             </p>
//             <p className={adminTheme.timeline.time}>{item.time}</p>
//           </div>
//         </li>
//       ))}
//     </ul>
//   </div>
// );

// const UserDistributionCard = () => {
//   const total = ORG_TYPE_DISTRIBUTION.reduce((sum, d) => sum + d.value, 0);

//   return (
//     <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//       <p className={adminTheme.card.title}>Organization Distribution</p>
//       <p className={adminTheme.card.subtitle}>By organization_type</p>

//       <div className="relative mx-auto mt-4 h-44 w-44">
//         <ResponsiveContainer width="100%" height="100%">
//           <PieChart>
//             <Pie
//               data={ORG_TYPE_DISTRIBUTION}
//               dataKey="value"
//               nameKey="name"
//               innerRadius="70%"
//               outerRadius="100%"
//               paddingAngle={2}
//               stroke="none"
//             >
//               {ORG_TYPE_DISTRIBUTION.map((entry, index) => (
//                 <Cell key={entry.name} fill={adminTheme.chart.donut[index % adminTheme.chart.donut.length]} />
//               ))}
//             </Pie>
//           </PieChart>
//         </ResponsiveContainer>
//         <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
//           <span className="text-xl font-semibold text-slate-900">{(total / 100 * 18.4).toFixed(1)}k</span>
//           <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Students</span>
//         </div>
//       </div>

//       <ul className="mt-5 space-y-2.5">
//         {ORG_TYPE_DISTRIBUTION.map((entry, index) => (
//           <li key={entry.name} className="flex items-center justify-between text-sm">
//             <span className="flex items-center gap-2 text-slate-600">
//               <span
//                 className="h-2.5 w-2.5 rounded-sm"
//                 style={{ backgroundColor: adminTheme.chart.donut[index % adminTheme.chart.donut.length] }}
//               />
//               {entry.name}
//             </span>
//             <span className="font-medium text-slate-900">{entry.value}%</span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// const AuditLogCard = () => {
//   const [tab, setTab] = useState("All");

//   return (
//     <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//       <div className="flex items-center justify-between">
//         <p className={adminTheme.card.title}>Audit Log</p>
//         <div className="flex items-center gap-4">
//           {AUDIT_TABS.map((option) => (
//             <button
//               key={option}
//               type="button"
//               onClick={() => setTab(option)}
//               className={option === tab ? adminTheme.actionButton.tabActive : adminTheme.actionButton.tabInactive}
//             >
//               {option}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="mt-4 overflow-x-auto">
//         <table className="w-full min-w-[420px] border-collapse">
//           <thead>
//             <tr>
//               <th className={adminTheme.table.headerCell}>Event</th>
//               <th className={adminTheme.table.headerCell}>Actor</th>
//               <th className={adminTheme.table.headerCell}>Delta</th>
//               <th className={cn(adminTheme.table.headerCell, "text-right")}>When</th>
//             </tr>
//           </thead>
//           <tbody>
//             {AUDIT_LOG.map((row) => (
//               <tr key={row.event} className={adminTheme.table.row}>
//                 <td className={cn(adminTheme.table.cell, "font-medium text-slate-900")}>{row.event}</td>
//                 <td className={adminTheme.table.cell}>{row.actor}</td>
//                 <td className={adminTheme.table.cellMuted}>{row.delta}</td>
//                 <td className={cn(adminTheme.table.cellMuted, "text-right")}>{row.when}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// const BottomRow = () => (
//   <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
//     <RecentActivitiesCard />
//     <UserDistributionCard />
//     <AuditLogCard />
//   </div>
// );

// // ---- Page -------------------------------------------------------------------

// const AssessmentOverview = () => {
//   return (
//     <div className={cn("min-h-screen", adminTheme.surface.page)}>
//       <TopBar />

//       <main className="mx-auto max-w-[1600px] space-y-4 px-3 py-6 sm:px-4 lg:px-0">
//         <AssessmentsListCard />
//         <AssessmentTrendsCard />
//         <MetricsRow />
//         <CredentialBanner />
//         <BottomRow />
//       </main>
//     </div>
//   );
// };

// export default AssessmentOverview;