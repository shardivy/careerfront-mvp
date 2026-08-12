import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import enterpriseTheme from "../../theme/enterpriseTheme";
import {
  Search,
  ChevronDown,
  Download,
  ChevronRight,
  ArrowUpDown,
  ChevronLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Mail,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// enterpriseTheme.badge only defines success / warning / danger / primary.
// Pending & Not Started need a neutral look, so it's added here rather than
// touching your theme file.
const neutralBadge =
  "inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-500 px-3 py-1 text-xs font-medium";

// ---- Mock data (swap for your API data) ----------------------------------
const INITIAL_STUDENTS = [
  { id: 1, name: "Aisha Patel", email: "a.patel@westlake.edu", grade: "Grade 12", status: "Completed", registered: "Aug 12", completed: "Sep 3", reports: 1, color: "bg-rose-200" },
  { id: 2, name: "Marcus Chen", email: "m.chen@westlake.edu", grade: "Grade 11", status: "Completed", registered: "Aug 14", completed: "Sep 8", reports: 1, color: "bg-amber-200" },
  { id: 3, name: "Sofia Rodriguez", email: "s.rodriguez@westlake.edu", grade: "Grade 10", status: "Started", registered: "Aug 15", completed: "—", reports: 0, color: "bg-violet-200" },
  { id: 4, name: "James Okonkwo", email: "j.okonkwo@westlake.edu", grade: "Grade 9", status: "Started", registered: "Aug 16", completed: "—", reports: 0, color: "bg-slate-300" },
  { id: 5, name: "Lena Fischer", email: "l.fischer@westlake.edu", grade: "Grade 12", status: "Completed", registered: "Aug 12", completed: "Aug 29", reports: 1, color: "bg-sky-200" },
  { id: 6, name: "Arjun Sharma", email: "a.sharma@westlake.edu", grade: "Grade 11", status: "Completed", registered: "Aug 13", completed: "Sep 1", reports: 1, color: "bg-slate-800" },
  { id: 7, name: "Yuki Tanaka", email: "y.tanaka@westlake.edu", grade: "Grade 10", status: "Registered", registered: "Aug 20", completed: "—", reports: 0, color: "bg-teal-200" },
  { id: 8, name: "Ethan Brooks", email: "e.brooks@westlake.edu", grade: "Grade 9", status: "Not Started", registered: "—", completed: "—", reports: 0, color: "bg-stone-300" },
  { id: 9, name: "Priya Menon", email: "p.menon@westlake.edu", grade: "Grade 12", status: "Completed", registered: "Aug 11", completed: "Aug 27", reports: 1, color: "bg-indigo-200" },
  { id: 10, name: "Omar Hassan", email: "o.hassan@westlake.edu", grade: "Grade 11", status: "Started", registered: "Aug 17", completed: "—", reports: 0, color: "bg-emerald-200" },
  { id: 11, name: "Claire Dupont", email: "c.dupont@westlake.edu", grade: "Grade 10", status: "Pending", registered: "Aug 22", completed: "—", reports: 0, color: "bg-pink-200" },
  { id: 12, name: "Noah Williams", email: "n.williams@westlake.edu", grade: "Grade 9", status: "Completed", registered: "Aug 10", completed: "Aug 25", reports: 1, color: "bg-orange-200" },
];

const FILTERS = ["All", "Completed", "Started", "Registered", "Pending", "Not Started"];

const STATUS_STYLE = {
  Completed: { badge: enterpriseTheme.badge.success, dot: "bg-green-600" },
  Started: { badge: enterpriseTheme.badge.warning, dot: "bg-amber-500" },
  Registered: { badge: enterpriseTheme.badge.primary, dot: "bg-blue-600" },
  Pending: { badge: neutralBadge, dot: "bg-slate-400" },
  "Not Started": { badge: neutralBadge, dot: "bg-slate-400" },
};

const initials = (name) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("");

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Pending;
  return (
    <span className={s.badge}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

const ReportsBadge = ({ count }) => {
  if (!count) return <span className="text-slate-300">—</span>;
  return (
    <span className={enterpriseTheme.badge.success}>
      {count} report{count > 1 ? "s" : ""}
    </span>
  );
};

// Row actions: "View" link + "⋯" menu, revealed on row hover
const RowActions = ({ student, onView }) => (
  <div className="flex items-center justify-end gap-2">
    <button
      onClick={onView}
      className="text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      View
    </button>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye size={16} className="mr-2" />
          View
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Pencil size={16} className="mr-2" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuItem className="text-red-600">
          <Trash2 size={16} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

// Inline bulk-selection action bar — shown in the toolbar once rows are checked
const SelectionActions = ({ count, onNotify, onReports, onRemove }) => (
  <div className="flex items-center gap-1 pl-3 ml-1 border-l border-slate-200 whitespace-nowrap">
    <span className="text-sm font-medium text-blue-600 px-2">
      {count} selected
    </span>

    <button
      onClick={onNotify}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      <Mail size={15} />
      Notify
    </button>

    <button
      onClick={onReports}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      <FileText size={15} />
      Reports
    </button>

    <button
      onClick={onRemove}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
    >
      <Trash2 size={15} />
      Remove
    </button>
  </div>
);

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesFilter = filter === "All" || s.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [students, query, filter]);

  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : filtered.map((s) => s.id));
  };

  const toggleOne = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedStudents = useMemo(
    () => students.filter((s) => selected.includes(s.id)),
    [students, selected]
  );

  const exportToExcel = (rows = filtered, filename = "Student_Management.xlsx") => {
    const excelData = rows.map((student, index) => ({
      "Sr No": index + 1,
      "Student Name": student.name,
      Email: student.email,
      Grade: student.grade,
      Status: student.status,
      Registered: student.registered,
      Completed: student.completed,
      Reports: student.reports,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, filename);
  };

  // ---- Bulk actions ----
  const handleNotify = () => {
    // Swap for your actual notify API call
    console.log(
      "Notify:",
      selectedStudents.map((s) => s.email)
    );
  };

  const handleReports = () => {
    exportToExcel(selectedStudents, "Selected_Students_Reports.xlsx");
  };

  const handleRemove = () => {
    setStudents((prev) => prev.filter((s) => !selected.includes(s.id)));
    setSelected([]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* ---------------- Fixed top section ---------------- */}
      <div className="flex-shrink-0">
        {/* Breadcrumb + header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className={`${enterpriseTheme.typography.h3} sm:text-3xl`}
              style={{ color: enterpriseTheme.colors.text.heading }}
            >
              Student Management
            </h1>
            <p className="text-sm mt-1" style={{ color: enterpriseTheme.colors.text.body }}>
              {students.length} students enrolled · Westlake Academy
            </p>
          </div>

          <Button
            className={`${enterpriseTheme.button.primary} px-5 py-5 shadow-sm gap-2 self-start sm:self-auto`}
            onClick={() => exportToExcel()}
          >
            <Download size={16} />
            Export Excel
          </Button>
        </div>

        {/* Toolbar */}
        <div className={`${enterpriseTheme.card.base} p-3 sm:p-4 mb-4`}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students..."
                className="pl-9 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border ${enterpriseTheme.transition.fast} ${
                    filter === f
                      ? "text-white border-transparent"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                  style={filter === f ? { backgroundColor: enterpriseTheme.colors.primary } : undefined}
                >
                  {f}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap">
              All Grades
              <ChevronDown size={15} />
            </button>

            {/* Bulk selection actions — only shown once rows are checked */}
            {selected.length > 0 && (
              <SelectionActions
                count={selected.length}
                onNotify={handleNotify}
                onReports={handleReports}
                onRemove={handleRemove}
              />
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Scrollable middle section ---------------- */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className={`${enterpriseTheme.card.base} flex-1 min-h-0 overflow-hidden flex flex-col`}>
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr className={enterpriseTheme.table.header}>
                    <th className="w-12 px-4 py-3 text-left">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="inline-flex items-center gap-1">Student <ArrowUpDown size={12} /></span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="inline-flex items-center gap-1">Grade <ArrowUpDown size={12} /></span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="inline-flex items-center gap-1">Status <ArrowUpDown size={12} /></span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="inline-flex items-center gap-1">Registered <ArrowUpDown size={12} /></span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="inline-flex items-center gap-1">Completed <ArrowUpDown size={12} /></span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="inline-flex items-center gap-1">Reports <ArrowUpDown size={12} /></span>
                    </th>
                    <th className="px-4 py-3 text-right w-24" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className={`group ${enterpriseTheme.table.row}`}>
                      <td className="px-4 py-3.5">
                        <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => navigate("/enterprise/student-journey")}
                        >
                          <div
                            className={`w-9 h-9 rounded-full ${s.color} flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0`}
                          >
                            {initials(s.name)}
                          </div>

                          <div className="min-w-0">
                            <div className="font-medium truncate hover:underline">
                              {s.name}
                            </div>

                            <div className="text-xs text-slate-400 truncate">
                              {s.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{s.grade}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{s.registered}</td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{s.completed}</td>
                      <td className="px-4 py-3.5"><ReportsBadge count={s.reports} /></td>
                      <td className="px-4 py-3.5">
                        <RowActions student={s} onView={() => navigate("/enterprise/student-journey")} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className={`${enterpriseTheme.card.base} p-10 text-center text-slate-400`}>
            No students match your search or filter.
          </div>
        )}

        {/* Spacer so the last row isn't flush against the fixed footer */}
        <div className="h-2" />
      </div>

      {/* ---------------- Fixed pagination footer ---------------- */}
      <div
        className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 pb-1 text-sm text-slate-500 border-t border-slate-200"
        style={{ backgroundColor: enterpriseTheme.colors.background.page }}
      >
        <span>Showing {filtered.length} of {students.length} students</span>
        <div className="flex items-center gap-1.5">
          <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40" disabled>
            <ChevronLeft size={15} />
          </button>
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className="w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50"
              style={p === 1 ? { backgroundColor: enterpriseTheme.colors.primary, color: "#fff", borderColor: enterpriseTheme.colors.primary } : undefined}
            >
              {p}
            </button>
          ))}
          <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Students;