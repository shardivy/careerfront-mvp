import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    Users,
    ClipboardCheck,
    FileText,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Plus,
    Link2,
    School,
    GraduationCap,
    Megaphone,
    ChevronRight,
    CircleCheck,
    CircleDashed,
    Clock,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";

/**
 * AdminDashboard
 * Platform-level (thecareerfront Super Admin) overview. Read-only summary
 * across Organizations (Part A), Campaigns (Part A), Student Registrations
 * (Part A/C) and Evaluation/Report output (Part D). All data below is
 * mocked \u2014 swap each block for its real endpoint:
 *   GET /api/admin/dashboard/summary
 *   GET /api/admin/dashboard/registration-trend?range=...
 *   GET /api/admin/organizations?sort=-created_at&limit=6
 *   GET /api/admin/dashboard/activity?limit=8
 */

// ---- Mock data --------------------------------------------------------

const SUMMARY_CARDS = [
    { key: "organizations", label: "Organizations", value: "184", delta: "+12", trend: "up", icon: Building2, sub: "vs last month" },
    { key: "campaigns", label: "Active Campaigns", value: "37", delta: "+5", trend: "up", icon: Megaphone, sub: "vs last month" },
    { key: "students", label: "Students Registered", value: "28,940", delta: "+2,104", trend: "up", icon: Users, sub: "vs last month" },
    { key: "evaluated", label: "Assessments Evaluated", value: "24,318", delta: "-3.2%", trend: "down", icon: ClipboardCheck, sub: "completion rate" },
    { key: "reports", label: "Reports Generated", value: "23,860", delta: "+1,880", trend: "up", icon: FileText, sub: "vs last month" },
];

const REGISTRATION_TREND = [
    { month: "Feb", registrations: 2480 },
    { month: "Mar", registrations: 3120 },
    { month: "Apr", registrations: 2890 },
    { month: "May", registrations: 3640 },
    { month: "Jun", registrations: 4210 },
    { month: "Jul", registrations: 4980 },
];

// Mirrors the `registration_status` enum on student_registrations.
const REGISTRATION_STATUS_BREAKDOWN = [
    { name: "Report Generated", value: 23860, color: adminTheme.chart.donut[0] },
    { name: "Evaluated", value: 2140, color: adminTheme.chart.donut[1] },
    { name: "In Progress / Started", value: 1890, color: adminTheme.chart.donut[2] },
    { name: "Registered, not started", value: 1050, color: "#cbd5e1" },
];

const RECENT_ORGANIZATIONS = [
    { id: "SCH0184", name: "Delhi Public School", type: "SCHOOL", city: "Noida", campaigns: 3, students: 640, status: "ACTIVE", joinedAt: "2 days ago" },
    { id: "SCH0183", name: "Ryan International", type: "SCHOOL", city: "Pune", campaigns: 1, students: 210, status: "ACTIVE", joinedAt: "4 days ago" },
    { id: "CCH0041", name: "Excel Career Academy", type: "COACHING", city: "Jaipur", campaigns: 2, students: 480, status: "ACTIVE", joinedAt: "6 days ago" },
    { id: "COL0022", name: "St. Xavier's College", type: "COLLEGE", city: "Mumbai", campaigns: 1, students: 95, status: "SUSPENDED", joinedAt: "1 week ago" },
    { id: "SCH0182", name: "The Shri Ram School", type: "SCHOOL", city: "Gurugram", campaigns: 4, students: 720, status: "ACTIVE", joinedAt: "1 week ago" },
];

const ORG_TYPE_META = {
    SCHOOL: { label: "School", icon: School },
    COLLEGE: { label: "College", icon: GraduationCap },
    COACHING: { label: "Coaching", icon: Building2 },
};

const ORG_STATUS_BADGE = {
    ACTIVE: adminTheme.badge.positive,
    SUSPENDED: adminTheme.badge.negative,
    INACTIVE: adminTheme.badge.neutral,
};

const RECENT_ACTIVITY = [
    { id: 1, text: "Report generated for Aarav Sharma", context: "Delhi Public School \u00b7 Career Assessment 2026", time: "5m ago", done: true },
    { id: 2, text: "New organization onboarded", context: "Excel Career Academy, Jaipur", time: "42m ago", done: true },
    { id: 3, text: "Campaign activated", context: "Grade 10 Aptitude Drive \u00b7 Ryan International", time: "1h ago", done: true },
    { id: 4, text: "312 registrations imported", context: "via Bulk Import \u00b7 The Shri Ram School", time: "3h ago", done: true },
    { id: 5, text: "Evaluation batch in progress", context: "St. Xavier's College \u00b7 96 attempts queued", time: "5h ago", done: false },
];

const QUICK_ACTIONS = [
    { key: "organization", label: "New Organization", icon: Building2, path: "/s-admin/organizations/new" },
    { key: "campaign", label: "New Campaign", icon: Megaphone, path: "/s-admin/campaigns/new" },
    { key: "link", label: "Generate Registration Link", icon: Link2, path: "/s-admin/registration-links/new" },
    { key: "question", label: "Add Question", icon: ClipboardCheck, path: "/s-admin/create-question" },
];

const DATE_RANGES = ["7D", "30D", "90D"];

// ---- Small building blocks ------------------------------------------------

const DeltaBadge = ({ trend, delta }) => {
    const isUp = trend === "up";
    return (
        <span className={isUp ? adminTheme.badge.positive : adminTheme.badge.negative}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
        </span>
    );
};

const SummaryCard = ({ card }) => {
    const Icon = card.icon;
    return (
        <div className={cn(adminTheme.card.base, adminTheme.card.padding, "flex flex-col gap-3")}>
            <div className="flex items-center justify-between">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", adminTheme.surface.subtle)}>
                    <Icon className="h-4.5 w-4.5 text-slate-600" />
                </span>
                <DeltaBadge trend={card.trend} delta={card.delta} />
            </div>
            <div>
                <p className={adminTheme.card.title}>{card.value}</p>
                <p className={cn(adminTheme.card.subtitle, "mt-1")}>{card.label}</p>
            </div>
        </div>
    );
};

const RangeToggle = ({ range, onChange }) => (
    <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
        {DATE_RANGES.map((option) => (
            <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                className={option === range ? adminTheme.actionButton.pillActive : adminTheme.actionButton.pillInactive}
            >
                {option}
            </button>
        ))}
    </div>
);

const RegistrationTrendCard = ({ range, onRangeChange }) => (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-2")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <p className={adminTheme.card.title}>Student Registrations</p>
                <p className={cn(adminTheme.card.subtitle, "mt-1")}>New registrations across all organizations</p>
            </div>
            <RangeToggle range={range} onChange={onRangeChange} />
        </div>
        <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REGISTRATION_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                        <linearGradient id="registrationFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={adminTheme.chart.areaFrom} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={adminTheme.chart.areaTo} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={adminTheme.chart.gridStroke} />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: adminTheme.chart.axisText, fontSize: 12 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: adminTheme.chart.axisText, fontSize: 12 }} width={40} />
                    <Tooltip
                        contentStyle={{ borderRadius: 8, borderColor: adminTheme.chart.gridStroke, fontSize: 12 }}
                        labelStyle={{ color: adminTheme.chart.stroke, fontWeight: 600 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="registrations"
                        stroke={adminTheme.chart.stroke}
                        strokeWidth={2}
                        fill="url(#registrationFill)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const StatusDonutCard = () => {
    const total = REGISTRATION_STATUS_BREAKDOWN.reduce((sum, s) => sum + s.value, 0);
    return (
        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
            <p className={adminTheme.card.title}>Registration Status</p>
            <p className={cn(adminTheme.card.subtitle, "mt-1")}>Where students are in the funnel</p>
            <div className="relative mt-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={REGISTRATION_STATUS_BREAKDOWN}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={72}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {REGISTRATION_STATUS_BREAKDOWN.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, borderColor: adminTheme.chart.gridStroke, fontSize: 12 }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-lg font-bold text-slate-900">{(total / 1000).toFixed(1)}k</p>
                    <p className="text-[11px] text-slate-400">Total</p>
                </div>
            </div>
            <div className="mt-3 space-y-2">
                {REGISTRATION_STATUS_BREAKDOWN.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-600">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                        </span>
                        <span className="font-medium text-slate-900">{entry.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OrgTypeBadge = ({ type }) => {
    const meta = ORG_TYPE_META[type] ?? { label: type, icon: Building2 };
    const Icon = meta.icon;
    return (
        <span className={cn(adminTheme.badge.neutral, "gap-1")}>
            <Icon className="h-3 w-3" />
            {meta.label}
        </span>
    );
};

const RecentOrganizationsCard = ({ onViewAll }) => (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-2")}>
        <div className="flex items-center justify-between">
            <div>
                <p className={adminTheme.card.title}>Recent Organizations</p>
                <p className={cn(adminTheme.card.subtitle, "mt-1")}>Latest onboarded schools, colleges &amp; coaching centers</p>
            </div>
            <button type="button" onClick={onViewAll} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
                View all
                <ChevronRight className="h-3.5 w-3.5" />
            </button>
        </div>
        <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
                <thead>
                    <tr>
                        <th className={adminTheme.table.headerCell}>Organization</th>
                        <th className={adminTheme.table.headerCell}>Type</th>
                        <th className={adminTheme.table.headerCell}>Campaigns</th>
                        <th className={adminTheme.table.headerCell}>Students</th>
                        <th className={adminTheme.table.headerCell}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {RECENT_ORGANIZATIONS.map((org) => (
                        <tr key={org.id} className={adminTheme.table.row}>
                            <td className={adminTheme.table.cell}>
                                <p className="font-semibold text-slate-900">{org.name}</p>
                                <p className="text-xs text-slate-400">{org.city} \u00b7 Joined {org.joinedAt}</p>
                            </td>
                            <td className={adminTheme.table.cell}>
                                <OrgTypeBadge type={org.type} />
                            </td>
                            <td className={adminTheme.table.cellMuted}>{org.campaigns}</td>
                            <td className={adminTheme.table.cellMuted}>{org.students.toLocaleString()}</td>
                            <td className={adminTheme.table.cell}>
                                <span className={ORG_STATUS_BADGE[org.status] ?? adminTheme.badge.neutral}>{org.status}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const RecentActivityCard = () => (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
        <p className={adminTheme.card.title}>Recent Activity</p>
        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Platform-wide, most recent first</p>
        <ul className="mt-4 space-y-4">
            {RECENT_ACTIVITY.map((item, index) => (
                <li key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <span className={item.done ? adminTheme.timeline.dotActive : adminTheme.timeline.dotMuted} />
                        {index < RECENT_ACTIVITY.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-slate-100" />}
                    </div>
                    <div className="pb-1">
                        <p className={adminTheme.timeline.title}>{item.text}</p>
                        <p className="text-xs text-slate-400">{item.context}</p>
                        <p className={cn(adminTheme.timeline.time, "mt-0.5 inline-flex items-center gap-1")}>
                            <Clock className="h-3 w-3" />
                            {item.time}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

const QuickActionsCard = ({ onNavigate }) => (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
        <p className={adminTheme.card.title}>Quick Actions</p>
        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Jump straight into common tasks</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.key}
                        type="button"
                        onClick={() => onNavigate(action.path)}
                        className={cn(
                            "flex flex-col items-start gap-3 rounded-lg border p-3.5 text-left transition",
                            adminTheme.border.default,
                            adminTheme.surface.hover,
                            adminTheme.border.hoverStrong
                        )}
                    >
                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-md", adminTheme.surface.subtle)}>
                            <Icon className="h-4 w-4 text-slate-600" />
                        </span>
                        <span className="text-xs font-semibold leading-snug text-slate-700">{action.label}</span>
                    </button>
                );
            })}
        </div>
    </div>
);

const EvaluationHealthCallout = () => (
    <div className={adminTheme.callout.base}>
        <p className={adminTheme.callout.title}>
            <CircleCheck className="h-4 w-4 text-emerald-400" />
            Evaluation Engine
        </p>
        <p className={adminTheme.callout.body}>
            96 attempts are queued for evaluation across 3 organizations. Average turnaround this week is 4 minutes per attempt.
        </p>
        <button type="button" className={adminTheme.callout.button}>
            <CircleDashed className="h-4 w-4" />
            View Evaluation Queue
        </button>
    </div>
);

// ---- Top bar ------------------------------------------------------------

const TopBar = ({ onNewCampaign }) => (
    <div className={cn("border-b bg-white", adminTheme.border.default)}>
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
                <p className="mt-1 text-sm text-slate-500">Organizations, campaigns and assessment activity across TrueMindPath.</p>
            </div>
            <button type="button" onClick={onNewCampaign} className={adminTheme.actionButton.primary}>
                <Plus className="h-4 w-4" />
                New Campaign
            </button>
        </div>
    </div>
);

// ---- Page -----------------------------------------------------------------

const Dashboard = () => {
    const navigate = useNavigate();
    const [range, setRange] = useState("30D");

    const summaryCards = useMemo(() => SUMMARY_CARDS, []);

    return (
        <div className={cn("min-h-screen", adminTheme.surface.page)}>
            <TopBar onNewCampaign={() => navigate("/s-admin/campaigns/new")} />

            <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {summaryCards.map((card) => (
                        <SummaryCard key={card.key} card={card} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <RegistrationTrendCard range={range} onRangeChange={setRange} />
                    <StatusDonutCard />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <RecentOrganizationsCard onViewAll={() => navigate("/s-admin/organizations")} />
                    <RecentActivityCard />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <QuickActionsCard onNavigate={(path) => navigate(path)} />
                    </div>
                    <EvaluationHealthCallout />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;


// import { useEffect, useMemo, useState } from "react";
// import {
//   Search,
//   Bell,
//   Plus,
//   Layers,
//   CheckCircle2,
//   Lock,
//   ShieldCheck,
//   Pencil,
//   ChevronLeft,
//   ChevronRight,
//   MoreVertical,
//   Zap,
//   UploadCloud,
//   Tag,
//   GraduationCap,
//   LayoutGrid,
//   Users,
//   ArrowUpRight,
// } from "lucide-react";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
// } from "recharts";
// import { cn } from "@/lib/utils";
// import { adminTheme } from "@/theme/adminTheme";

// /**
//  * QuestionBankRepository
//  * Overview dashboard for the aptitude-test question bank: repository health,
//  * question analytics, the most-used items, and connected LMS platforms.
//  *
//  * Data model alignment:
//  *   - Question rows          -> `questions` (+ `subsections` for dimension/grade context)
//  *   - Difficulty split        -> questions.difficulty_level (EASY / MEDIUM / HARD)
//  *   - Question type split     -> questions.question_type enum
//  *   - Category/dimension tags -> subsections.dimension_id -> dimensions.name
//  *   - Grade tags               -> question_grade_mapping (question_id -> grade_id)
//  *   - Usage / success rate     -> aggregated from student_responses + scoring_rules,
//  *                                 joined via assessment_blueprint_items
//  *   - Search + category chips are wired to the "Most Used Questions" table below —
//  *     they're not decorative, changing them re-filters and re-paginates real state.
//  *
//  * "Connected Learning Platforms" (Canvas/Moodle/Blackboard) has no backing table in
//  * the shared schema — it's a platform-level LMS integration, flagged below rather
//  * than force-mapped to a DB column.
//  *
//  * All visual styling is sourced from `adminTheme` so this page automatically
//  * stays in sync with the rest of the admin panel.
//  */

// // ---- Mock data (aptitude test management domain) --------------------------

// const TABS = ["Repository", "Assessments", "Reports"];

// const PLATFORMS = [
//   { name: "Canvas LMS", dot: "bg-emerald-400" },
//   { name: "Moodle", dot: "bg-emerald-400" },
//   { name: "Blackboard", dot: "bg-amber-400" },
// ];

// // Backing queries:
// //   Total Questions     -> COUNT(questions.id)
// //   Active Questions    -> COUNT(questions.id) WHERE is_active = TRUE
// //   Inactive Questions  -> COUNT(questions.id) WHERE is_active = FALSE
// //   Mandatory Questions -> COUNT(questions.id) WHERE is_mandatory = TRUE
// // Note: the schema only has an `is_active` boolean on `questions` (no
// // DRAFT/PUBLISHED/ARCHIVED lifecycle enum), so these four cards are the
// // real column-backed states rather than a workflow status that doesn't exist yet.
// const STAT_CARDS = [
//   {
//     label: "Total Questions",
//     value: "15,420",
//     delta: "+4.2%",
//     icon: Layers,
//     iconBg: "bg-slate-100",
//     iconColor: "text-slate-600",
//     sparkColor: "#0f766e",
//     sparkline: [12, 14, 13, 16, 15, 18, 17, 20, 19, 22],
//   },
//   {
//     label: "Active Questions",
//     value: "14,800",
//     delta: "+1.8%",
//     icon: CheckCircle2,
//     iconBg: "bg-emerald-50",
//     iconColor: "text-emerald-600",
//     sparkColor: "#059669",
//     sparkline: [10, 11, 11, 12, 13, 12, 14, 15, 15, 16],
//   },
//   {
//     label: "Inactive Questions",
//     value: "620",
//     note: "is_active = false",
//     icon: Lock,
//     iconBg: "bg-slate-100",
//     iconColor: "text-slate-500",
//     sparkColor: "#94a3b8",
//     sparkline: [16, 15, 15, 14, 13, 13, 12, 11, 10, 9],
//   },
//   {
//     label: "Mandatory Questions",
//     value: "9,140",
//     note: "is_mandatory = true",
//     icon: ShieldCheck,
//     iconBg: "bg-orange-50",
//     iconColor: "text-orange-500",
//     sparkColor: "#ea580c",
//     sparkline: [6, 7, 6, 8, 9, 8, 10, 9, 11, 12],
//   },
// ];

// // Source: questions.updated_at DESC (there's no dedicated audit-log table for
// // question edits in the schema, so this reads off updated_at / created_by).
// // Status reflects the real `is_active` boolean, not an invented lifecycle.
// const ACTIVITY_FEED = [
//   {
//     name: "Dr. Meera Iyer",
//     action: "updated",
//     title: "Series Completion Q12",
//     meta: "Logical Reasoning · Grade 9 · 12 min ago",
//     status: "Active",
//     initials: "MI",
//     avatarBg: "bg-indigo-500",
//   },
//   {
//     name: "Arjun Verma",
//     action: "added",
//     title: "Train Speed Problem",
//     meta: "Numerical Aptitude · Grade 10 · 48 min ago",
//     status: "Active",
//     initials: "AV",
//     avatarBg: "bg-sky-500",
//   },
//   {
//     name: "Priya Nair",
//     action: "deactivated",
//     title: "Synonym Match Set",
//     meta: "Verbal Ability · Grade 11 · 2 hours ago",
//     status: "Inactive",
//     initials: "PN",
//     avatarBg: "bg-rose-500",
//   },
//   {
//     name: "Rohan Das",
//     action: "tagged",
//     title: "Pattern Sequence",
//     metaSuffix: "set",
//     meta: "Abstract Reasoning · Grade 8 · 5 hours ago",
//     status: "Active",
//     initials: "RD",
//     avatarBg: "bg-amber-500",
//   },
// ];

// const STATUS_STYLES = {
//   Active: "bg-emerald-50 text-emerald-700",
//   Inactive: "bg-slate-100 text-slate-500",
// };

// // questions.difficulty_level enum: EASY / MEDIUM / HARD
// const DIFFICULTY_DATA = [
//   { name: "Easy", enumValue: "EASY", value: 38, color: "#10b981" },
//   { name: "Medium", enumValue: "MEDIUM", value: 42, color: "#d97706" },
//   { name: "Hard", enumValue: "HARD", value: 20, color: "#dc2626" },
// ];

// // questions.question_type enum (top 5 most-used types shown here)
// const QUESTION_TYPE_DATA = [
//   { name: "Single Choice", enumValue: "SINGLE_CHOICE", value: 4200 },
//   { name: "Integer Entry", enumValue: "INTEGER", value: 3100 },
//   { name: "Short Text", enumValue: "SHORT_TEXT", value: 2600 },
//   { name: "Match the Following", enumValue: "MATCH_THE_FOLLOWING", value: 2050 },
//   { name: "Likert (5-pt)", enumValue: "LIKERT_5", value: 1400 },
// ];

// // Sample rows for the "Most Used Questions" table. Each field maps to a
// // real column/join:
// //   id            -> questions.question_code
// //   prompt        -> questions.question_text
// //   dimension     -> subsections.dimension_id -> dimensions.name
// //   grade         -> question_grade_mapping.grade (first mapped grade shown)
// //   difficulty    -> questions.difficulty_level
// //   questionType  -> questions.question_type
// //   isMandatory   -> questions.is_mandatory
// //   usage         -> COUNT(student_responses) via assessment_blueprint_items
// //   success       -> % of scored responses where scoring_rules.is_correct = TRUE
// const ALL_QUESTIONS = [
//   { id: "LR-1042", prompt: "If all Bloops are Razzles and all Razzles are Lazzles, are all Bloops Lazzles?", dimension: "Logical Reasoning", grade: "Gr 9", difficulty: "MEDIUM", questionType: "SINGLE_CHOICE", isMandatory: true, usage: "11,240", success: 74 },
//   { id: "NA-0885", prompt: "A train 120m long crosses a pole in 8 seconds. Find its speed in km/h.", dimension: "Numerical Aptitude", grade: "Gr 10", difficulty: "HARD", questionType: "INTEGER", isMandatory: true, usage: "9,860", success: 68 },
//   { id: "VA-0231", prompt: "Choose the word most similar in meaning to \"Ephemeral.\"", dimension: "Verbal Ability", grade: "Gr 11", difficulty: "EASY", questionType: "SINGLE_CHOICE", isMandatory: false, usage: "8,415", success: 82 },
//   { id: "AR-0567", prompt: "Identify the figure that completes the given sequence.", dimension: "Abstract Reasoning", grade: "Gr 8", difficulty: "MEDIUM", questionType: "IMAGE_SELECTION", isMandatory: true, usage: "7,290", success: 59 },
//   { id: "SR-0142", prompt: "Which 3D shape is formed when this net is folded?", dimension: "Spatial Reasoning", grade: "Gr 9", difficulty: "HARD", questionType: "IMAGE_SELECTION", isMandatory: false, usage: "6,820", success: 63 },
//   { id: "SJ-0099", prompt: "You notice a teammate copying answers during a mock test. What do you do?", dimension: "Situational Judgement", grade: "Gr 12", difficulty: "MEDIUM", questionType: "SINGLE_CHOICE", isMandatory: true, usage: "6,110", success: 71 },
//   { id: "NA-0912", prompt: "If 15 workers finish a task in 12 days, how many days for 20 workers?", dimension: "Numerical Aptitude", grade: "Gr 10", difficulty: "HARD", questionType: "INTEGER", isMandatory: true, usage: "5,980", success: 66 },
//   { id: "LR-1108", prompt: "Complete the series: 2, 6, 12, 20, __", dimension: "Logical Reasoning", grade: "Gr 9", difficulty: "MEDIUM", questionType: "INTEGER", isMandatory: false, usage: "5,740", success: 77 },
//   { id: "VA-0304", prompt: "Rearrange the jumbled letters to form a meaningful word: \"TAINOUC.\"", dimension: "Verbal Ability", grade: "Gr 8", difficulty: "EASY", questionType: "SHORT_TEXT", isMandatory: false, usage: "5,210", success: 85 },
//   { id: "AR-0602", prompt: "Find the odd one out among the given figures.", dimension: "Abstract Reasoning", grade: "Gr 11", difficulty: "MEDIUM", questionType: "IMAGE_SELECTION", isMandatory: true, usage: "4,890", success: 61 },
//   { id: "SR-0201", prompt: "Rotate the given shape 90° clockwise and select the correct match.", dimension: "Spatial Reasoning", grade: "Gr 10", difficulty: "HARD", questionType: "IMAGE_SELECTION", isMandatory: false, usage: "4,630", success: 58 },
//   { id: "SJ-0154", prompt: "A group member disagrees with the plan during a timed group task. Best response?", dimension: "Situational Judgement", grade: "Gr 12", difficulty: "MEDIUM", questionType: "SINGLE_CHOICE", isMandatory: true, usage: "4,405", success: 73 },
// ];

// const DIFFICULTY_BADGE_STYLES = {
//   EASY: "bg-emerald-50 text-emerald-700",
//   MEDIUM: "bg-amber-50 text-amber-700",
//   HARD: "bg-red-50 text-red-600",
// };

// const DIFFICULTY_LABELS = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

// const PAGE_SIZE = 4;
// const TOTAL_ITEMS_IN_REPOSITORY = "15,420"; // COUNT(questions.id) across the whole bank

// // Derived filter chips: "All Categories" plus every distinct dimension
// // present in the sample data (subsections.dimension_id -> dimensions.name).
// const CATEGORY_FILTERS = [
//   "All Categories",
//   ...Array.from(new Set(ALL_QUESTIONS.map((q) => q.dimension))),
// ];

// const QA_CHECKLIST = [
//   {
//     title: "Resolve Pending Inactive Questions",
//     description: "620 items marked is_active = false awaiting review",
//     icon: Pencil,
//     iconBg: "bg-orange-50",
//     iconColor: "text-orange-500",
//   },
//   {
//     title: "Verify Grade-Level Mappings",
//     description: "9 questions missing question_grade_mapping rows",
//     icon: Tag,
//     iconBg: "bg-amber-50",
//     iconColor: "text-amber-600",
//   },
//   {
//     title: "Push Blueprint Sync to Assessment Engine",
//     description: "assessment_blueprint_items scheduled for 18:00 UTC",
//     icon: UploadCloud,
//     iconBg: "bg-slate-100",
//     iconColor: "text-slate-600",
//   },
//   {
//     title: "Run Bias & Fairness Audit",
//     description: "Psychometric review standard across scoring_rules",
//     icon: ShieldCheck,
//     iconBg: "bg-emerald-50",
//     iconColor: "text-emerald-600",
//   },
// ];

// // No LMS-connector table exists in the shared schema — this stays a
// // platform-level integration list rather than a DB-backed one.
// const CONNECTED_PLATFORMS = [
//   { name: "Canvas LMS", meta: "Synced 4 min ago", status: "Active", icon: LayoutGrid, iconBg: "bg-rose-50", iconColor: "text-rose-500", statusColor: "text-emerald-600", dotColor: "bg-emerald-500" },
//   { name: "Moodle", meta: "Synced 11 min ago", status: "Active", icon: GraduationCap, iconBg: "bg-slate-100", iconColor: "text-slate-600", statusColor: "text-emerald-600", dotColor: "bg-emerald-500" },
//   { name: "Blackboard", meta: "Retry in 2 min", status: "Retrying", icon: Users, iconBg: "bg-amber-50", iconColor: "text-amber-600", statusColor: "text-amber-600", dotColor: "bg-amber-500" },
// ];

// // ---- Small building blocks ---------------------------------------------

// const Sparkline = ({ data, color }) => {
//   const max = Math.max(...data);
//   const min = Math.min(...data);
//   const range = max - min || 1;
//   const points = data
//     .map((value, index) => {
//       const x = (index / (data.length - 1)) * 100;
//       const y = 30 - ((value - min) / range) * 26;
//       return `${x},${y}`;
//     })
//     .join(" ");
//   const areaPoints = `0,32 ${points} 100,32`;

//   return (
//     <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full">
//       <polyline points={areaPoints} fill={color} opacity="0.08" stroke="none" />
//       <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//     </svg>
//   );
// };

// const StatCard = ({ label, value, delta, note, icon: Icon, iconBg, iconColor, sparkline, sparkColor }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <div className="flex items-center justify-between gap-3">
//       <p className="text-sm font-medium text-slate-500">{label}</p>
//       <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconBg)}>
//         <Icon className={cn("h-4 w-4", iconColor)} />
//       </span>
//     </div>
//     <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
//       <span className="text-3xl font-bold text-slate-900">{value}</span>
//       {delta && (
//         <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
//           <ArrowUpRight className="h-3 w-3" />
//           {delta}
//         </span>
//       )}
//       {note && <span className="text-xs font-medium text-slate-400">{note}</span>}
//     </div>
//     <div className="mt-4">
//       <Sparkline data={sparkline} color={sparkColor} />
//     </div>
//   </div>
// );

// const InitialsAvatar = ({ initials, bg }) => (
//   <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", bg)}>
//     {initials}
//   </span>
// );

// const ActivityItem = ({ item }) => (
//   <div className="flex items-start gap-3 py-4 first:pt-0">
//     <InitialsAvatar initials={item.initials} bg={item.avatarBg} />
//     <div className="min-w-0 flex-1">
//       <p className="truncate text-sm text-slate-700">
//         <span className="font-semibold text-slate-900">{item.name}</span> {item.action}{" "}
//         <span className="font-semibold text-slate-900">&quot;{item.title}&quot;</span>
//         {item.metaSuffix ? ` ${item.metaSuffix}` : ""}
//       </p>
//       <p className="mt-0.5 truncate text-xs text-slate-400">{item.meta}</p>
//     </div>
//     <span className={cn("shrink-0 rounded-md px-2 py-1 text-xs font-semibold", STATUS_STYLES[item.status])}>
//       {item.status}
//     </span>
//   </div>
// );

// const DifficultyDonut = () => (
//   <div>
//     <p className="text-sm font-semibold text-slate-900">Difficulty Distribution</p>
//     <p className="text-xs text-slate-400">questions.difficulty_level</p>
//     <div className="mx-auto h-[200px] max-w-[220px]">
//       <ResponsiveContainer width="100%" height="100%">
//         <PieChart>
//           <Pie
//             data={DIFFICULTY_DATA}
//             dataKey="value"
//             nameKey="name"
//             innerRadius={58}
//             outerRadius={88}
//             paddingAngle={2}
//             stroke="none"
//           >
//             {DIFFICULTY_DATA.map((entry) => (
//               <Cell key={entry.name} fill={entry.color} />
//             ))}
//           </Pie>
//           <Tooltip
//             formatter={(value, name) => [`${value}%`, name]}
//             contentStyle={{ borderRadius: 8, border: `1px solid ${adminTheme.chart.gridStroke}`, fontSize: 12 }}
//           />
//         </PieChart>
//       </ResponsiveContainer>
//     </div>
//     <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
//       {DIFFICULTY_DATA.map((entry) => (
//         <span key={entry.name} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
//           <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
//           {entry.name}
//         </span>
//       ))}
//     </div>
//   </div>
// );

// const QuestionTypeBars = () => (
//   <div className="mt-6">
//     <p className="text-sm font-semibold text-slate-900">Question Type Distribution</p>
//     <p className="text-xs text-slate-400">questions.question_type</p>
//     <div className="mt-2 h-[210px]">
//       <ResponsiveContainer width="100%" height="100%">
//         <BarChart data={QUESTION_TYPE_DATA} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
//           <CartesianGrid horizontal={false} stroke={adminTheme.chart.gridStroke} />
//           <XAxis
//             type="number"
//             tick={{ fontSize: 11, fill: adminTheme.chart.axisText }}
//             axisLine={false}
//             tickLine={false}
//           />
//           <YAxis
//             type="category"
//             dataKey="name"
//             width={130}
//             tick={{ fontSize: 11, fill: "#334155" }}
//             axisLine={false}
//             tickLine={false}
//           />
//           <Tooltip
//             cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
//             contentStyle={{ borderRadius: 8, border: `1px solid ${adminTheme.chart.gridStroke}`, fontSize: 12 }}
//           />
//           <Bar dataKey="value" fill={adminTheme.chart.stroke} radius={[0, 4, 4, 0]} barSize={14} />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   </div>
// );

// // ---- Page sections ---------------------------------------------------------

// const PageHeader = ({ activeTab, onTabChange }) => (
//   <header className={cn("border-b bg-white", adminTheme.border.default)}>
//     <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
//       <div>
//         <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Question Bank Repository</h1>
//         <p className="mt-1 text-sm text-slate-400">Last synced with Assessment Engine · 4 minutes ago</p>
//       </div>

//       <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
//         <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
//           {TABS.map((tab) => (
//             <button
//               key={tab}
//               type="button"
//               onClick={() => onTabChange(tab)}
//               className={cn(
//                 "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4",
//                 activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
//               )}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>
//         <button type="button" className={adminTheme.button.iconBordered} aria-label="Notifications">
//           <Bell className="h-4 w-4" />
//         </button>
//         <button type="button" className={cn(adminTheme.actionButton.primary, "shrink-0")}>
//           <Plus className="h-4 w-4" />
//           <span className="hidden sm:inline">Add Question</span>
//           <span className="sm:hidden">Add</span>
//         </button>
//       </div>
//     </div>
//   </header>
// );

// const StatusBanner = () => (
//   <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 sm:px-10 sm:py-10">
//     <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
//       <div>
//         <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
//           Institutional Assessment Repository
//         </p>
//         <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">All systems operational</h2>
//         <p className="mt-2 max-w-xl text-sm text-slate-300">
//           Your aptitude question bank is synchronized across three connected learning management
//           platforms.
//         </p>
//       </div>
//       <div className="flex flex-wrap gap-x-6 gap-y-2">
//         {PLATFORMS.map((platform) => (
//           <span key={platform.name} className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
//             <span className={cn("h-2 w-2 rounded-full", platform.dot)} />
//             {platform.name}
//           </span>
//         ))}
//       </div>
//     </div>
//   </div>
// );

// // Search + category chips here now drive the "Most Used Questions" table
// // below via lifted state in <Dashboard />, instead of being decorative.
// const RecentActivityCard = ({ searchTerm, onSearchChange, activeFilter, onFilterChange }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-3")}>
//     <div className="flex items-start justify-between gap-3">
//       <div>
//         <h3 className="text-base font-semibold text-slate-900">Recent Activity Feed</h3>
//         <p className={cn(adminTheme.card.subtitle, "mt-1")}>Live updates across your repository</p>
//       </div>
//       <button type="button" className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
//         View all →
//       </button>
//     </div>

//     <div className="relative mt-5">
//       <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//       <input
//         type="text"
//         value={searchTerm}
//         onChange={(e) => onSearchChange(e.target.value)}
//         placeholder="Search by question code or prompt text..."
//         className={cn(
//           "h-11 w-full pl-9 pr-3 text-sm",
//           adminTheme.radius.md,
//           adminTheme.border.default,
//           "border bg-slate-50 text-slate-900 placeholder:text-slate-400",
//           "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
//         )}
//       />
//       <p className="mt-1.5 text-xs text-slate-400">Filters the &quot;Most Used Questions&quot; table below</p>
//     </div>

//     <div className="mt-4 flex flex-wrap gap-2">
//       {CATEGORY_FILTERS.map((filter) => (
//         <button
//           key={filter}
//           type="button"
//           onClick={() => onFilterChange(filter)}
//           className={activeFilter === filter ? adminTheme.actionButton.pillActive : adminTheme.actionButton.pillInactive}
//         >
//           {filter}
//         </button>
//       ))}
//     </div>

//     <div className="mt-2 divide-y divide-slate-100">
//       {ACTIVITY_FEED.map((item) => (
//         <ActivityItem key={item.title} item={item} />
//       ))}
//     </div>
//   </div>
// );

// const QuestionAnalyticsCard = () => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-2")}>
//     <h3 className="text-base font-semibold text-slate-900">Question Analytics</h3>
//     <p className={cn(adminTheme.card.subtitle, "mt-1")}>Distribution across the bank</p>

//     <div className="mt-5">
//       <DifficultyDonut />
//       <QuestionTypeBars />
//     </div>
//   </div>
// );

// const MostUsedQuestionsCard = ({ questions, currentPage, onPageChange, hasActiveFilters }) => {
//   const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
//   const safePage = Math.min(currentPage, totalPages);
//   const start = (safePage - 1) * PAGE_SIZE;
//   const pageItems = questions.slice(start, start + PAGE_SIZE);

//   return (
//     <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div className="flex items-center gap-3">
//           <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
//             <Zap className="h-4 w-4 text-white" />
//           </span>
//           <div>
//             <h3 className="text-base font-semibold text-slate-900">Most Used Questions Engine</h3>
//             <p className={adminTheme.card.subtitle}>Top-performing items by test exposure</p>
//           </div>
//         </div>
//         <div className="flex flex-wrap items-center gap-2">
//           <button type="button" className={adminTheme.actionButton.secondary}>
//             <Plus className="h-4 w-4" />
//             Add New Question
//           </button>
//           <button type="button" className={adminTheme.actionButton.primary}>
//             <UploadCloud className="h-4 w-4" />
//             Bulk Import (CSV/Excel)
//           </button>
//         </div>
//       </div>

//       <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
//         <table className="w-full min-w-[820px] border-collapse">
//           <thead>
//             <tr>
//               <th className={cn(adminTheme.table.headerCell, "pl-5 sm:pl-6")}>Item Code</th>
//               <th className={adminTheme.table.headerCell}>Question Prompt</th>
//               <th className={adminTheme.table.headerCell}>Dimension &amp; Grade</th>
//               <th className={adminTheme.table.headerCell}>Difficulty</th>
//               <th className={adminTheme.table.headerCell}>Usage Frequency</th>
//               <th className={cn(adminTheme.table.headerCell, "pr-5 sm:pr-6")}>Success Rate</th>
//             </tr>
//           </thead>
//           <tbody>
//             {pageItems.length === 0 ? (
//               <tr>
//                 <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400 sm:px-6">
//                   No questions match this search / filter combination.
//                 </td>
//               </tr>
//             ) : (
//               pageItems.map((question) => (
//                 <tr key={question.id} className={adminTheme.table.row}>
//                   <td className={cn(adminTheme.table.cellMuted, "pl-5 font-medium sm:pl-6")}>{question.id}</td>
//                   <td className={cn(adminTheme.table.cell, "max-w-xs font-medium text-slate-900")}>
//                     <span className="line-clamp-2">{question.prompt}</span>
//                   </td>
//                   <td className={adminTheme.table.cell}>
//                     {question.dimension} &middot; {question.grade}
//                   </td>
//                   <td className={adminTheme.table.cell}>
//                     <span
//                       className={cn(
//                         "rounded-md px-2 py-1 text-xs font-semibold",
//                         DIFFICULTY_BADGE_STYLES[question.difficulty]
//                       )}
//                     >
//                       {DIFFICULTY_LABELS[question.difficulty]}
//                     </span>
//                   </td>
//                   <td className={adminTheme.table.cell}>{question.usage} / yr</td>
//                   <td className={cn(adminTheme.table.cell, "pr-5 sm:pr-6")}>
//                     <div className="flex items-center gap-3">
//                       <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
//                         <div
//                           className={cn(
//                             "h-full rounded-full",
//                             question.success >= 70 ? "bg-emerald-500" : question.success >= 60 ? "bg-amber-500" : "bg-red-400"
//                           )}
//                           style={{ width: `${question.success}%` }}
//                         />
//                       </div>
//                       <span className="text-sm font-semibold text-slate-700">{question.success}%</span>
//                       <button type="button" className="ml-auto text-slate-300 hover:text-slate-600" aria-label="Row actions">
//                         <MoreVertical className="h-4 w-4" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
//         <p className="text-sm text-slate-400">
//           Showing <span className="font-semibold text-slate-700">{pageItems.length}</span> of{" "}
//           <span className="font-semibold text-slate-700">{questions.length}</span>{" "}
//           {hasActiveFilters ? "matching" : "sample"} items
//           {!hasActiveFilters && (
//             <>
//               {" "}
//               (<span className="font-semibold text-slate-700">{TOTAL_ITEMS_IN_REPOSITORY}</span> total in
//               repository)
//             </>
//           )}
//         </p>
//         <div className="flex items-center gap-2">
//           <button
//             type="button"
//             onClick={() => onPageChange(Math.max(1, safePage - 1))}
//             disabled={safePage === 1}
//             className={cn(adminTheme.button.iconBordered, safePage === 1 && "cursor-not-allowed opacity-50")}
//             aria-label="Previous page"
//           >
//             <ChevronLeft className="h-4 w-4" />
//           </button>
//           {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//             <button
//               key={page}
//               type="button"
//               onClick={() => onPageChange(page)}
//               className={cn(
//                 "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition",
//                 page === safePage
//                   ? "bg-slate-900 text-white"
//                   : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//               )}
//             >
//               {page}
//             </button>
//           ))}
//           <button
//             type="button"
//             onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
//             disabled={safePage === totalPages}
//             className={cn(adminTheme.button.iconBordered, safePage === totalPages && "cursor-not-allowed opacity-50")}
//             aria-label="Next page"
//           >
//             <ChevronRight className="h-4 w-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const QAChecklistCard = () => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <h3 className="text-base font-semibold text-slate-900">QA Checklist</h3>
//     <p className={cn(adminTheme.card.subtitle, "mt-1")}>Active workflows before release</p>

//     <div className="relative mt-5 space-y-5">
//       {QA_CHECKLIST.map((item, index) => (
//         <div key={item.title} className="relative flex items-start gap-3">
//           {index !== QA_CHECKLIST.length - 1 && (
//             <span className="absolute left-5 top-10 h-[calc(100%-8px)] w-px bg-slate-100" />
//           )}
//           <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", item.iconBg)}>
//             <item.icon className={cn("h-4 w-4", item.iconColor)} />
//           </span>
//           <div className="min-w-0 flex-1">
//             <p className="text-sm font-semibold text-slate-900">{item.title}</p>
//             <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
//           </div>
//           <button type="button" className="shrink-0 text-slate-300 hover:text-slate-600" aria-label="Task actions">
//             <MoreVertical className="h-4 w-4" />
//           </button>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// const ConnectedPlatformsCard = () => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <h3 className="text-base font-semibold text-slate-900">Connected Learning Platforms</h3>
//     <p className={cn(adminTheme.card.subtitle, "mt-1")}>Integration health overview</p>

//     <div className="mt-5 space-y-3">
//       {CONNECTED_PLATFORMS.map((platform) => (
//         <div
//           key={platform.name}
//           className={cn("flex items-center gap-3 border p-4", adminTheme.border.default, adminTheme.radius.lg)}
//         >
//           <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", platform.iconBg)}>
//             <platform.icon className={cn("h-5 w-5", platform.iconColor)} />
//           </span>
//           <div className="min-w-0 flex-1">
//             <p className="text-sm font-semibold text-slate-900">{platform.name}</p>
//             <p className="mt-0.5 text-xs text-slate-400">{platform.meta}</p>
//           </div>
//           <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-sm font-medium", platform.statusColor)}>
//             <span className={cn("h-1.5 w-1.5 rounded-full", platform.dotColor)} />
//             {platform.status}
//           </span>
//         </div>
//       ))}

//       <button
//         type="button"
//         className={cn(
//           "flex w-full items-center justify-center gap-1.5 border border-dashed p-4 text-sm font-medium text-slate-400",
//           "hover:border-slate-300 hover:text-slate-600",
//           adminTheme.border.default,
//           adminTheme.radius.lg
//         )}
//       >
//         <Plus className="h-4 w-4" />
//         Connect New Platform
//       </button>
//     </div>
//   </div>
// );

// // ---- Page -------------------------------------------------------------------

// const Dashboard = () => {
//   const [activeTab, setActiveTab] = useState("Repository");
//   const [activeFilter, setActiveFilter] = useState("All Categories");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);

//   // Real filtering: category chip -> questions.dimension (via subsections.dimension_id),
//   // search -> questions.question_code OR questions.question_text (case-insensitive).
//   const filteredQuestions = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();

//     return ALL_QUESTIONS.filter((question) => {
//       const matchesCategory = activeFilter === "All Categories" || question.dimension === activeFilter;
//       const matchesSearch =
//         !term ||
//         question.id.toLowerCase().includes(term) ||
//         question.prompt.toLowerCase().includes(term);
//       return matchesCategory && matchesSearch;
//     });
//   }, [activeFilter, searchTerm]);

//   const hasActiveFilters = activeFilter !== "All Categories" || searchTerm.trim().length > 0;

//   // Jump back to page 1 whenever the search term or category filter changes,
//   // so pagination never points at a page that no longer exists.
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [activeFilter, searchTerm]);

//   return (
//     <div className={cn("min-h-screen", adminTheme.surface.page)}>
//       <PageHeader activeTab={activeTab} onTabChange={setActiveTab} />

//       <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
//         <StatusBanner />

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           {STAT_CARDS.map((card) => (
//             <StatCard key={card.label} {...card} />
//           ))}
//         </div>

//         <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
//           <RecentActivityCard
//             searchTerm={searchTerm}
//             onSearchChange={setSearchTerm}
//             activeFilter={activeFilter}
//             onFilterChange={setActiveFilter}
//           />
//           <QuestionAnalyticsCard />
//         </div>

//         <MostUsedQuestionsCard
//           questions={filteredQuestions}
//           currentPage={currentPage}
//           onPageChange={setCurrentPage}
//           hasActiveFilters={hasActiveFilters}
//         />

//         <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//           <QAChecklistCard />
//           <ConnectedPlatformsCard />
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;