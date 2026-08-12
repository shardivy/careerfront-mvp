import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    Copy,
    Trash2,
    Archive,
    CheckCircle2,
    Tag,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Zap,
    AlertCircle,
    AlertTriangle,
    FileClock,
    SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { useDispatch, useSelector } from "react-redux";
import { getQuestions } from "../../slices/questionSlice";
import { fetchGrades } from "../../slices/gradeSlice";
import { fetchSubsections } from "../../slices/subsectionSlice";
import Skeleton from "../ui/Skeleton";

/**
 * QuestionLibrary
 * The table CreateQuestion's "Back to Library" / publish actions return to.
 * Rows are one per `questions` row (id = question_code). Status lives on the
 * question itself: DRAFT = saved but not published (via the wizard's
 * "Discard"/step-save flow), PUBLISHED = live in the shared bank.
 */

// ---- Meta config --------------------------------------------------------

const DIFFICULTY_META = {
    EASY: { label: "Easy", color: "text-emerald-600", icon: CheckCircle2 },
    MEDIUM: { label: "Medium", color: "text-amber-600", icon: AlertCircle },
    HARD: { label: "Hard", color: "text-red-600", icon: AlertTriangle },
};

const STATUS_META = {
    PUBLISHED: { label: "Published", badge: "bg-emerald-50 text-emerald-700" },
    DRAFT: { label: "Draft", badge: "bg-amber-50 text-amber-700" },
};

const TABS = ["All", "Published", "Draft"];
const PAGE_SIZE_OPTIONS = [5, 10, 25];

const QUESTION_TYPE_LABEL = (type) => String(type ?? "").replace(/_/g, " ");

const stripHtml = (html) => {
    if (typeof html !== "string") return "";
    if (typeof DOMParser === "undefined") {
        return html.replace(/<[^>]+>/g, "").trim();
    }
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent?.trim() ?? "";
};

const getQuestionThumbnailUrl = (question) => {
    if (String(question.mediaType ?? "").toLowerCase() !== "image") return null;
    return question.mediaUrl || question.mediaFile || null;
};

const formatModified = (text) => {
    if (!text) return { date: "-", time: "" };
    const value = String(text).trim();

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return {
            date: parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
            time: parsed.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        };
    }

    const parts = value.split("·").map((part) => part.trim());
    if (parts.length === 2) {
        return { date: parts[0], time: parts[1] };
    }

    return { date: value, time: "" };
};

// Empty string = "no filter applied" (everything shows).
const DEFAULT_FILTERS = { subsection: "", grade: "" };

// ---- Small building blocks ------------------------------------------------

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

const DifficultyBadge = ({ level }) => {
    const meta = DIFFICULTY_META[level] ?? {
        label: level ? String(level) : "Unknown",
        color: "text-slate-500",
        icon: AlertCircle,
    };
    const Icon = meta.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-sm font-medium", meta.color)}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const meta = STATUS_META[status] ?? {
        label: status ? String(status) : "Unknown",
        badge: "bg-slate-100 text-slate-500",
    };
    return (
        <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", meta.badge)}>
            {meta.label}
        </span>
    );
};

// ---- Filter dropdown row ------------------------------------------------

const FILTER_FIELD_META = {
    subsection: { label: "Subsection", placeholder: "Filter by subsection" },
    grade: { label: "Grade", placeholder: "Filter by grade" },
};

const FilterSelect = ({ field, value, options, onChange }) => {
    const meta = FILTER_FIELD_META[field];
    const hasValue = value !== "";
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={`filter-${field}`} className="text-xs font-medium text-slate-500">
                {meta.label}
            </label>
            <div className="relative">
                <select
                    id={`filter-${field}`}
                    value={value}
                    onChange={(e) => onChange(field, e.target.value)}
                    className={cn(
                        "h-9 w-full min-w-[160px] appearance-none rounded-md border border-slate-200 bg-white pl-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400",
                        hasValue ? "pr-14 text-slate-900" : "pr-8 text-slate-500",
                    )}
                >
                    <option value="" disabled hidden>
                        {meta.placeholder}
                    </option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
                {hasValue && (
                    <button
                        type="button"
                        onClick={() => onChange(field, "")}
                        aria-label={`Clear ${meta.label} filter`}
                        className="absolute right-7 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
        </div>
    );
};

const FilterBar = ({ filters, search, onSearchChange, onFilterChange, subsectionOptions, gradeOptions }) => (
    <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        <FilterSelect field="subsection" value={filters.subsection} options={subsectionOptions} onChange={onFilterChange} />
        <FilterSelect field="grade" value={filters.grade} options={gradeOptions} onChange={onFilterChange} />
        <div className="flex flex-col gap-1">
            <label htmlFor="question-search" className="text-xs font-medium text-slate-500">
                Search
            </label>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    id="question-search"
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search questions..."
                    className="h-9 min-w-[220px] rounded-md border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                {search.trim() && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    </div>
);

// ---- Confirm dialog (bulk actions) -----------------------------------------

const BULK_ACTION_COPY = {
    publish: {
        title: "Publish selected questions?",
        body: (count) => `${count} item${count === 1 ? "" : "s"} will go live in the shared Question Library immediately.`,
        confirmLabel: "Publish",
        tone: "default",
    },
    archive: {
        title: "Archive selected questions?",
        body: (count) => `${count} item${count === 1 ? "" : "s"} will be moved out of active use.`,
        confirmLabel: "Archive",
        tone: "default",
    },
    delete: {
        title: "Delete selected questions?",
        body: (count) => `${count} item${count === 1 ? "" : "s"} will be permanently deleted. This can't be undone.`,
        confirmLabel: "Delete",
        tone: "danger",
    },
};

const ConfirmBulkActionDialog = ({ action, count, onConfirm, onCancel }) => {
    if (!action) return null;
    const copy = BULK_ACTION_COPY[action];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onCancel} role="presentation">
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

const DeleteQuestionDialog = ({ question, onConfirm, onCancel }) => {
    if (!question) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onCancel} role="presentation">
            <div
                className={cn(adminTheme.card.base, "w-full max-w-sm p-5")}
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-question-title"
            >
                <p id="delete-question-title" className="text-base font-semibold text-slate-900">
                    Delete question?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                    This will permanently remove <span className="font-semibold text-slate-700">{question.id}</span> from the library.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditTagsDialog = ({ open, count, onApply, onCancel }) => {
    const [tags, setTags] = useState([]);
    const [draft, setDraft] = useState("");

    if (!open) return null;

    const commitDraft = () => {
        const clean = draft.trim();
        if (clean && !tags.includes(clean)) setTags((prev) => [...prev, clean]);
        setDraft("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onCancel} role="presentation">
            <div className={cn(adminTheme.card.base, "w-full max-w-sm p-5")} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <p className="text-base font-semibold text-slate-900">Add tags to {count} question{count === 1 ? "" : "s"}</p>
                <p className="mt-2 text-sm text-slate-500">These tags will be added alongside any tags the questions already have.</p>
                <div className="mt-4 flex min-h-11 w-full flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-2 focus-within:ring-2 focus-within:ring-slate-900/10">
                    {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                            {tag}
                            <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
                                <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                commitDraft();
                            }
                        }}
                        onBlur={commitDraft}
                        placeholder="Add tag..."
                        className="h-7 min-w-[100px] flex-1 border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className={adminTheme.actionButton.secondary}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onApply(tags);
                            setTags([]);
                        }}
                        disabled={tags.length === 0}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700",
                            tags.length === 0 && "cursor-not-allowed opacity-50 hover:bg-indigo-600"
                        )}
                    >
                        Apply Tags
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---- Table row --------------------------------------------------------

const QuestionRow = ({ question, selected, serialNumber, onToggleSelect, onView, onEdit, onDuplicate, onDelete }) => (
    <tr className={cn(adminTheme.table.row, selected && "bg-indigo-50/40")}>
        <td className={cn(adminTheme.table.cell, "w-10")}>
            <RowCheckbox checked={selected} onChange={() => onToggleSelect(question.id)} label={`Select ${question.id}`} />
        </td>
        <td className={cn(adminTheme.table.cellMuted, "whitespace-nowrap font-mono text-xs")}>{serialNumber}</td>
        <td className={cn(adminTheme.table.cell, "max-w-sm min-w-0")}>
            <div className="flex items-start gap-3">
                {getQuestionThumbnailUrl(question) ? (
                    <img
                        src={getQuestionThumbnailUrl(question)}
                        alt=""
                        aria-hidden="true"
                        className="h-14 w-14 flex-none rounded-md border border-slate-200 object-cover"
                    />
                ) : null}
                <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900" title={stripHtml(question.prompt)}>
                        {stripHtml(question.prompt)}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        {question.usages > 0 && (
                            <>
                                <Zap className="h-3 w-3" />
                                {(question.usages / 1000).toFixed(1)}k usages
                                <span className="text-slate-300">•</span>
                            </>
                        )}
                        Created by {question.createdBy}
                    </p>
                </div>
            </div>
        </td>
        <td className={adminTheme.table.cell}>
            <span className={cn(adminTheme.badge.neutral, "uppercase")}>{QUESTION_TYPE_LABEL(question.type)}</span>
        </td>
        <td className={cn(adminTheme.table.cellMuted, "text-sm")}>
            <p className="font-semibold text-slate-700">{question.subsection}</p>
            <p>{question.grade}</p>
        </td>
        <td className={adminTheme.table.cell}>
            <DifficultyBadge level={question.difficulty} />
        </td>
        <td className={cn(adminTheme.table.cellMuted, "whitespace-nowrap")}>{(() => {
            const modified = formatModified(question.modifiedAt);
            return (
                <div className="flex flex-col gap-0.5 text-sm">
                    <span>{modified.date}</span>
                    <span className="text-slate-500">{modified.time}</span>
                </div>
            );
        })()}</td>
        <td className={adminTheme.table.cell}>
            <StatusBadge status={question.status} />
        </td>
        <td className={cn(adminTheme.table.cell, "text-right")}>
            <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => onView(question)} title="View" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                    <Eye className="h-4 w-4" />
                </button>
                {question.status === "DRAFT" && (
                    <button type="button" onClick={() => onEdit(question)} title="Edit" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                        <Pencil className="h-4 w-4" />
                    </button>
                )}
                <button type="button" onClick={() => onDelete(question)} title="Delete" className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </td>
    </tr>
);

// ---- Pagination ---------------------------------------------------------

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
            <span>{totalRows === 0 ? "0 of 0" : `${rangeStart}\u2013${rangeEnd} of ${totalRows}`}</span>
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

// ---- Top bar ------------------------------------------------------------

const TopBar = ({ onNewQuestion }) => (
    <div className={cn("border-b bg-white", adminTheme.border.default)}>
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Question Library</h1>
                <p className="mt-1 text-sm text-slate-500">Every question available to add into an assessment, published or drafted.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={onNewQuestion} className={adminTheme.actionButton.primary}>
                    <Plus className="h-4 w-4" />
                    New Question
                </button>
            </div>
        </div>
    </div>
);

// ---- Page -----------------------------------------------------------------

const QuestionLibrary = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { questions, getQuestionsLoading, getQuestionsError } = useSelector((state) => state.question);
    const { grades, gradesLoading, gradesError } = useSelector((state) => state.grade);
    const { subsections, subsectionsLoading, subsectionsError } = useSelector((state) => state.subsection);

    const [displayQuestions, setDisplayQuestions] = useState([]);
    const [tab, setTab] = useState("All");
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [pendingAction, setPendingAction] = useState(null); // null | "publish" | "archive" | "delete"
    const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState(null);
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

    // Keep displayQuestions in sync with the API-backed questions, but be
    // defensive about non-array payloads (see questionSlice normalization).
    useEffect(() => {
        setDisplayQuestions(Array.isArray(questions) ? questions : []);
    }, [questions]);

    // Fetch questions, subsections, and grades when page loads.
    useEffect(() => {
        dispatch(getQuestions());
        dispatch(fetchSubsections());
        dispatch(fetchGrades());
    }, [dispatch]);

    // Option lists for the filter dropdowns.
    const subsectionOptions = useMemo(() => {
        const list = Array.isArray(subsections)
            ? subsections
            : Array.isArray(subsections?.data)
            ? subsections.data
            : Array.isArray(subsections?.results?.data)
            ? subsections.results.data
            : Array.isArray(subsections?.results)
            ? subsections.results
            : [];

        return Array.from(
            new Set(
                list
                    .map((item) => item?.name ?? item?.subsection_name ?? (item?.id != null ? String(item.id) : null))
                    .filter(Boolean)
            )
        ).sort();
    }, [subsections]);

    const gradeOptions = useMemo(() => {
        const list = Array.isArray(grades)
            ? grades
            : Array.isArray(grades?.data)
            ? grades.data
            : Array.isArray(grades?.results?.data)
            ? grades.results.data
            : Array.isArray(grades?.results)
            ? grades.results
            : [];

        return Array.from(
            new Set(
                list
                    .map((item) => item?.grade_name ?? item?.name ?? (item?.id != null ? String(item.id) : null))
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }, [grades]);

    const activeFilterCount = useMemo(
        () => Object.values(filters).filter((v) => v !== "").length,
        [filters]
    );

    const handleFilterChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setPage(1);
    }, []);

    const filterLoading = gradesLoading || subsectionsLoading;
    const filterError = gradesError || subsectionsError;

    const handleSearchChange = useCallback((value) => {
        setSearch(value);
        setPage(1);
    }, []);

    // Defensive filtering: real API data may have a numeric id, a null
    // prompt/subsection, or a status/type value that doesn't match the
    // mock strings — coerce everything to string before comparing.
    const filtered = useMemo(() => {
        let rows = displayQuestions;

        if (tab !== "All") {
            rows = rows.filter((q) => STATUS_META[q.status]?.label === tab);
        }
        if (filters.subsection !== "") {
            rows = rows.filter((q) => q.subsection === filters.subsection);
        }
        if (filters.grade !== "") {
            rows = rows.filter((q) => q.grade === filters.grade);
        }
        if (search.trim()) {
            const needle = search.trim().toLowerCase();
            rows = rows.filter((q) => {
                const id = String(q.id ?? "").toLowerCase();
                const prompt = stripHtml(q.prompt ?? "").toLowerCase();
                const subsection = String(q.subsection ?? "").toLowerCase();
                return id.includes(needle) || prompt.includes(needle) || subsection.includes(needle);
            });
        }
        return rows;
    }, [displayQuestions, tab, filters, search]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, pageCount);

    const paginated = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, filtered.length);

    const draftCount = useMemo(() => displayQuestions.filter((q) => q.status === "DRAFT").length, [displayQuestions]);

    const activeFilterOrSearchCount = activeFilterCount + (search.trim() ? 1 : 0);

    const pageIds = useMemo(() => paginated.map((q) => q.id), [paginated]);
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
            if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
            else pageIds.forEach((id) => next.add(id));
            return next;
        });
    }, [allOnPageSelected, pageIds]);

    const handleTabChange = useCallback((next) => {
        setTab(next);
        setPage(1);
    }, []);

    const handlePageSizeChange = useCallback((size) => {
        setPageSize(size);
        setPage(1);
    }, []);

    const handleConfirmBulkAction = useCallback(() => {
        if (pendingAction === "publish") {
            setDisplayQuestions((prev) =>
                prev.map((q) => (selectedIds.has(q.id) ? { ...q, status: "PUBLISHED", modifiedAt: "Just now" } : q))
            );
        } else if (pendingAction === "archive") {
            setDisplayQuestions((prev) => prev.filter((q) => !selectedIds.has(q.id)));
        } else if (pendingAction === "delete") {
            setDisplayQuestions((prev) => prev.filter((q) => !selectedIds.has(q.id)));
        }
        setSelectedIds(new Set());
        setPendingAction(null);
    }, [pendingAction, selectedIds]);

    const handleApplyTags = useCallback(
        (tags) => {
            setDisplayQuestions((prev) => prev.map((q) => (selectedIds.has(q.id) ? { ...q, tags: [...(q.tags ?? []), ...tags] } : q)));
            setSelectedIds(new Set());
            setIsTagDialogOpen(false);
        },
        [selectedIds]
    );

    const handleConfirmDeleteRow = useCallback(() => {
        if (!pendingDeleteQuestion) return;
        setDisplayQuestions((prev) => prev.filter((q) => q.id !== pendingDeleteQuestion.id));
        setPendingDeleteQuestion(null);
    }, [pendingDeleteQuestion]);

    const handleView = (question) => navigate(`/s-admin/question-library/${question.id}`);
    const handleEdit = (question) => navigate(`/s-admin/edit-question/${question.id}`);
    const handleDuplicate = (question) =>
        setDisplayQuestions((prev) => [
            { ...question, id: `${question.id}-copy`, status: "DRAFT", usages: 0, modifiedAt: "Just now" },
            ...prev,
        ]);
    const handleDeleteRow = (question) => setPendingDeleteQuestion(question);

    return (
        <div className={cn("min-h-screen", adminTheme.surface.page)}>
            <TopBar onNewQuestion={() => navigate("/s-admin/create-question")} />

            <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6 lg:px-0">
                <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className={adminTheme.card.title}>Questions</p>
                        </div>

                        <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
                            {TABS.map((option) => {
                                const count =
                                    option === "All"
                                        ? displayQuestions.length
                                        : displayQuestions.filter((q) => STATUS_META[q.status]?.label === option).length;
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

                    <FilterBar
                        filters={filters}
                        search={search}
                        onSearchChange={handleSearchChange}
                        onFilterChange={handleFilterChange}
                        subsectionOptions={subsectionOptions}
                        gradeOptions={gradeOptions}
                    />

                    {tab === "All" && draftCount > 0 && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                            <FileClock className="h-3.5 w-3.5" />
                            {draftCount} draft{draftCount === 1 ? "" : "s"} not yet published — switch to the Draft tab to pick one up.
                        </p>
                    )}

                    {selectedIds.size > 0 && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-semibold">{selectedIds.size} item{selectedIds.size === 1 ? "" : "s"} selected</span>
                                <span className="h-4 w-px shrink-0 bg-white/20" />
                                <button type="button" onClick={() => setPendingAction("publish")} className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Publish
                                </button>
                                <button type="button" onClick={() => setPendingAction("archive")} className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white">
                                    <Archive className="h-4 w-4" />
                                    Archive
                                </button>
                                <button type="button" onClick={() => setPendingAction("delete")} className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white">
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                                <button type="button" onClick={() => setIsTagDialogOpen(true)} className="inline-flex items-center gap-1.5 font-semibold text-white/90 hover:text-white">
                                    <Tag className="h-4 w-4" />
                                    Edit Tags
                                </button>
                            </div>
                            <button type="button" onClick={() => setSelectedIds(new Set())} aria-label="Clear selection" className="shrink-0 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <ConfirmBulkActionDialog action={pendingAction} count={selectedIds.size} onConfirm={handleConfirmBulkAction} onCancel={() => setPendingAction(null)} />
                    <DeleteQuestionDialog
                        question={pendingDeleteQuestion}
                        onConfirm={handleConfirmDeleteRow}
                        onCancel={() => setPendingDeleteQuestion(null)}
                    />
                    <EditTagsDialog open={isTagDialogOpen} count={selectedIds.size} onApply={handleApplyTags} onCancel={() => setIsTagDialogOpen(false)} />

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[960px] border-collapse">
                            <thead>
                                <tr>
                                    <th className={cn(adminTheme.table.headerCell, "w-10")}>
                                        <RowCheckbox checked={allOnPageSelected} indeterminate={someOnPageSelected} onChange={handleToggleSelectPage} label="Select all rows on this page" />
                                    </th>
                                    <th className={adminTheme.table.headerCell}>Sr.No</th>
                                    <th className={adminTheme.table.headerCell}>Question Content</th>
                                    <th className={adminTheme.table.headerCell}>Type</th>
                                    <th className={adminTheme.table.headerCell}>Subsection / Grade</th>
                                    <th className={adminTheme.table.headerCell}>Difficulty</th>
                                    <th className={adminTheme.table.headerCell}>Modified</th>
                                    <th className={adminTheme.table.headerCell}>Status</th>
                                    <th className={cn(adminTheme.table.headerCell, "text-right")}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getQuestionsLoading ? (
                                    Array.from({ length: 6 }).map((_, idx) => (
                                        <tr key={`skeleton-${idx}`} className="animate-pulse">
                                            <td className={cn(adminTheme.table.cell, "py-3")}>
                                                <Skeleton className="h-4 w-4 rounded-md" />
                                            </td>
                                            <td className={adminTheme.table.cell}>
                                                <Skeleton className="h-4 w-24 rounded-md" />
                                            </td>
                                            <td className={cn(adminTheme.table.cell, "max-w-sm")}>
                                                <Skeleton className="h-4 w-full rounded-md" />
                                            </td>
                                            <td className={adminTheme.table.cell}>
                                                <Skeleton className="h-4 w-16 rounded-md" />
                                            </td>
                                            <td className={cn(adminTheme.table.cellMuted, "text-sm")}>
                                                <Skeleton className="h-4 w-32 rounded-md" />
                                            </td>
                                            <td className={adminTheme.table.cell}>
                                                <Skeleton className="h-4 w-14 rounded-md" />
                                            </td>
                                            <td className={cn(adminTheme.table.cellMuted, "whitespace-nowrap")}>
                                                <Skeleton className="h-4 w-20 rounded-md" />
                                            </td>
                                            <td className={adminTheme.table.cell}>
                                                <Skeleton className="h-4 w-16 rounded-md" />
                                            </td>
                                            <td className={cn(adminTheme.table.cell, "text-right")}>
                                                <Skeleton className="h-4 w-20 rounded-md ml-auto" />
                                            </td>
                                        </tr>
                                    ))
                                ) : getQuestionsError ? (
                                    <tr>
                                        <td colSpan={9} className="px-3 py-10 text-center text-sm text-red-500">
                                            {typeof getQuestionsError === "string" ? getQuestionsError : "Failed to load questions"}
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-3 py-10 text-center text-sm text-slate-400">
                                            No questions found
                                        </td>
                                    </tr>
                                ) : (
                                   paginated.map((question, index) => (
    <QuestionRow
        key={question.id}
        question={question}
        serialNumber={(safePage - 1) * pageSize + index + 1}
        selected={selectedIds.has(question.id)}
        onToggleSelect={handleToggleSelect}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteRow}
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
            </main>
        </div>
    );
};

export default QuestionLibrary;