import React, { useState, useEffect, useCallback } from "react";
import {
    FileText,
    Download,
    Search,
    SlidersHorizontal,
    Eye,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    X,
    Loader2,
} from "lucide-react";
import enterpriseTheme from "@/theme/enterpriseTheme";

const theme = enterpriseTheme;

const STATS = [
    {
        label: "Total Reports",
        value: "524",
        icon: FileText,
        iconBg: "bg-blue-50",
        iconColor: "text-[#4F7DF3]",
        valueColor: "text-[#4F7DF3]",
    },
    {
        label: "Downloaded",
        value: "412",
        icon: FileText,
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
        valueColor: "text-green-600",
    },
    {
        label: "Pending Review",
        value: "75",
        icon: FileText,
        iconBg: "bg-orange-50",
        iconColor: "text-orange-500",
        valueColor: "text-orange-500",
    },
    {
        label: "Avg Downloads/Report",
        value: "2.8",
        icon: FileText,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
        valueColor: "text-purple-600",
    },
];

// pdfUrl points at the actual file for that report. Swap this for your
// real API endpoint, e.g. `/api/reports/${id}/pdf` or an S3/CDN URL.
const REPORTS = [
    {
        id: "TMP-001-2024",
        student: "Aisha Patel",
        avatar: "https://i.pravatar.cc/40?img=47",
        grade: "Grade 12",
        generated: "Sep 5, 2024",
        size: "2.4 MB",
        downloads: 3,
        status: "Completed",
        pdfUrl: "/reports/TMP-001-2024.pdf",
    },
    {
        id: "TMP-002-2024",
        student: "Marcus Chen",
        avatar: "https://i.pravatar.cc/40?img=12",
        grade: "Grade 11",
        generated: "Sep 8, 2024",
        size: "2.2 MB",
        downloads: 1,
        status: "Completed",
        pdfUrl: "/reports/TMP-002-2024.pdf",
    },
    {
        id: "TMP-005-2024",
        student: "Lena Fischer",
        avatar: "https://i.pravatar.cc/40?img=32",
        grade: "Grade 12",
        generated: "Aug 29, 2024",
        size: "2.6 MB",
        downloads: 5,
        status: "Completed",
        pdfUrl: "/reports/TMP-005-2024.pdf",
    },
    {
        id: "TMP-006-2024",
        student: "Arjun Sharma",
        avatar: "https://i.pravatar.cc/40?img=51",
        grade: "Grade 11",
        generated: "Sep 1, 2024",
        size: "2.3 MB",
        downloads: 2,
        status: "Completed",
        pdfUrl: "/reports/TMP-006-2024.pdf",
    },
    {
        id: "TMP-009-2024",
        student: "Priya Menon",
        avatar: "https://i.pravatar.cc/40?img=25",
        grade: "Grade 12",
        generated: "Aug 27, 2024",
        size: "2.5 MB",
        downloads: 4,
        status: "Completed",
        pdfUrl: "/reports/TMP-009-2024.pdf",
    },
];

const StatCard = ({
    label,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    valueColor,
}) => (
    <div
        className={`${theme.card.base} p-3 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0`}
    >
        <div
            className={`${iconBg} flex items-center justify-center rounded-xl
      w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0`}
        >
            <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        <div className="min-w-0">
            <div
                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${valueColor}`}
            >
                {value}
            </div>

            <div className="text-xs sm:text-sm text-slate-500 leading-tight break-words">
                {label}
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }) => (
    <span className={theme.badge.success}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
        {status}
    </span>
);

// Fetches the PDF as a blob and force-downloads it with a clean filename.
// Falls back to opening the URL directly if the fetch fails (e.g. CORS).
const downloadPdf = async (report) => {
    try {
        const res = await fetch(report.pdfUrl);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${report.id}-${report.student.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error("Download failed, opening in new tab instead:", err);
        window.open(report.pdfUrl, "_blank", "noopener,noreferrer");
    }
};

// Stand-in for the real PDF until there's a live report-generation endpoint.
// Renders an actual document instead of pointing an <iframe> at a file that
// doesn't exist yet (which just shows the browser's 404 page).
const ReportDocument = ({ report }) => (
    <div className="bg-white max-w-2xl mx-auto my-6 shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        {/* Letterhead */}
        <div className="bg-[#4F7DF3] px-8 py-6 text-white">
            <p className="text-xs uppercase tracking-wider text-blue-100">
                Career Intelligence Report
            </p>
            <h1 className="text-xl font-semibold mt-1">{report.student}</h1>
            <p className="text-sm text-blue-100 mt-0.5">
                {report.grade} &middot; Report ID {report.id}
            </p>
        </div>

        <div className="px-8 py-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-slate-400">Generated</p>
                    <p className="text-slate-800 font-medium">{report.generated}</p>
                </div>
                <div>
                    <p className="text-slate-400">File Size</p>
                    <p className="text-slate-800 font-medium">{report.size}</p>
                </div>
                <div>
                    <p className="text-slate-400">Status</p>
                    <p className="text-slate-800 font-medium">{report.status}</p>
                </div>
            </div>

            <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-2">
                    Aptitude Summary
                </h2>
                <div className="space-y-2">
                    {["Logical Reasoning", "Verbal Ability", "Numerical Skills"].map(
                        (skill, i) => (
                            <div key={skill} className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 w-32 flex-shrink-0">
                                    {skill}
                                </span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#4F7DF3] rounded-full"
                                        style={{ width: `${65 + i * 10}%` }}
                                    />
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-2">
                    Recommended Career Paths
                </h2>
                <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                    <li>Data Science &amp; Analytics</li>
                    <li>Software Engineering</li>
                    <li>Product Management</li>
                </ul>
            </div>

            <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
                This is a placeholder preview. Connect the report-generation API to
                render the real PDF here.
            </p>
        </div>
    </div>
);

const PreviewModal = ({ report, onClose, onDownload, downloadingId }) => {
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!report) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal header */}
                <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="font-semibold text-slate-900">{report.student}</h2>
                        <p className="text-sm text-slate-500">{report.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onDownload(report)}
                            disabled={downloadingId === report.id}
                            className={`${theme.button.secondary} flex items-center gap-2 text-sm disabled:opacity-60`}
                        >
                            {downloadingId === report.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Download
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Close preview"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Report preview */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 px-4">
                    <ReportDocument report={report} />
                </div>
            </div>
        </div>
    );
};

const Reports = () => {
    const [search, setSearch] = useState("");
    const [previewReport, setPreviewReport] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    const handleDownload = async (report) => {
        setDownloadingId(report.id);
        await downloadPdf(report);
        setDownloadingId(null);
    };

    const filteredReports = REPORTS.filter(
        (r) =>
            r.student.toLowerCase().includes(search.toLowerCase()) ||
            r.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className={`${theme.typography.h3} text-slate-900`}>
                        Report Library
                    </h1>
                    <p className="text-slate-500 mt-1">
                        All generated career intelligence reports
                    </p>
                </div>
                <button
                    className={`${theme.button.primary} flex items-center gap-2 self-start sm:self-auto`}
                >
                    <Download className="w-4 h-4" />
                    Bulk Download
                </button>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                {STATS.map((s) => (
                    <StatCard key={s.label} {...s} />
                ))}
            </div>

            {/* Table card */}
            <div className={`${theme.card.base} overflow-hidden`}>
                {/* Search + filter */}
                <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-2 border-b border-slate-100">
                    <div className="relative w-full sm:w-72 lg:w-120">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by student or report ID..."
                            className={`${theme.input.base} pl-10`}
                        />
                    </div>

                    <button
                        className={`${theme.button.secondary} flex items-center justify-center gap-2 whitespace-nowrap`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filter
                    </button>
                </div>

                {/* Table (scrolls horizontally on small screens) */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead>
                            <tr className={theme.table.header}>
                                <th className="px-5 py-3">Report ID</th>
                                <th className="px-5 py-3">Student</th>
                                <th className="px-5 py-3">Grade</th>
                                <th className="px-5 py-3">Generated</th>
                                <th className="px-5 py-3">File Size</th>
                                <th className="px-5 py-3">Downloads</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((r) => (
                                <tr key={r.id} className={theme.table.row}>
                                    <td className="px-5 py-4">
                                        <span className="text-[#4F7DF3] font-medium text-sm">
                                            {r.id}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={r.avatar}
                                                alt={r.student}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <span className="font-medium text-slate-800">
                                                {r.student}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-500">{r.grade}</td>
                                    <td className="px-5 py-4 text-slate-500">{r.generated}</td>
                                    <td className="px-5 py-4 text-slate-500">{r.size}</td>
                                    <td className="px-5 py-4 font-medium text-slate-700">
                                        {r.downloads}×
                                    </td>
                                    <td className="px-5 py-4">
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-4 text-sm">
                                            <button
                                                onClick={() => setPreviewReport(r)}
                                                className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => handleDownload(r)}
                                                disabled={downloadingId === r.id}
                                                className="flex items-center gap-1 text-[#4F7DF3] hover:text-[#3B6AF0] disabled:opacity-60"
                                            >
                                                {downloadingId === r.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                Download
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredReports.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-10 text-center text-slate-400 text-sm"
                                    >
                                        No reports match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
                    <span className="text-sm text-slate-500">
                        Showing {filteredReports.length} of 524 reports
                    </span>
                    <div className="flex items-center gap-1">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {[1, 2, 3].map((p) => (
                            <button
                                key={p}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${p === 1
                                        ? "bg-[#4F7DF3] text-white"
                                        : "text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                        <span className="w-8 h-8 flex items-center justify-center text-slate-400">
                            <MoreHorizontal className="w-4 h-4" />
                        </span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">
                            105
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <PreviewModal
                report={previewReport}
                onClose={() => setPreviewReport(null)}
                onDownload={handleDownload}
                downloadingId={downloadingId}
            />
        </div>
    );
};

export default Reports;