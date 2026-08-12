import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Bell,
  Plus,
  Layers,
  CheckCircle2,
  Lock,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Zap,
  UploadCloud,
  Tag,
  ShieldCheck,
  GraduationCap,
  LayoutGrid,
  Users,
  ArrowUpRight,
  FileText,
  ClipboardList,
  CalendarDays,
  Percent,
  Download,
  Sparkles,
  Building2,
  FileClock,
  Archive,
  Trash2,
  Inbox,
  X,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { fetchAssessmentListSlice } from "../../slices/assessmentSlice";

/**
 * QuestionBankRepository
 * Admin panel for the assessment platform's back office: the question bank
 * repository, the assessment library + campaign runtime, and the evaluation
 * report engine — all driven off the same tab bar in the header.
 * All visual styling is sourced from `adminTheme` so this page automatically
 * stays in sync with the rest of the admin panel.
 */

// ---- Mock data (aptitude test management domain) --------------------------

const TABS = ["Repository", "Assessments", "Reports"];

const FILTERS = ["All Sections", "Aptitude", "Interest", "Personality", "Psychometric"];

const PLATFORMS = [
  { name: "Canvas LMS", dot: "bg-emerald-400" },
  { name: "Moodle", dot: "bg-emerald-400" },
  { name: "Blackboard", dot: "bg-amber-400" },
];

const STAT_CARDS = [
  {
    label: "Total Questions",
    value: "15,420",
    delta: "+4.2%",
    icon: Layers,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    sparkColor: "#0f766e",
    sparkline: [12, 14, 13, 16, 15, 18, 17, 20, 19, 22],
  },
  {
    label: "Active Questions",
    value: "14,800",
    delta: "+1.8%",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    sparkColor: "#059669",
    sparkline: [10, 11, 11, 12, 13, 12, 14, 15, 15, 16],
  },
  {
    label: "Inactive Questions",
    value: "620",
    note: "is_active = false",
    icon: Lock,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    sparkColor: "#94a3b8",
    sparkline: [16, 15, 15, 14, 13, 13, 12, 11, 10, 9],
  },
  {
    label: "Multi-Grade Mapped",
    value: "9,140",
    note: "via question_grade_mapping",
    icon: Tag,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    sparkColor: "#ea580c",
    sparkline: [6, 7, 6, 8, 9, 8, 10, 9, 11, 12],
  },
];

const ACTIVITY_FEED = [
  {
    name: "Dr. Meera Iyer",
    action: "updated",
    title: "Series Completion Q12",
    meta: "Aptitude · Logical Reasoning · 12 min ago",
    status: "Active",
    initials: "MI",
    avatarBg: "bg-indigo-500",
  },
  {
    name: "Arjun Verma",
    action: "added",
    title: "Train Speed Problem",
    metaSuffix: "to subsection",
    meta: "Aptitude · Numerical Ability · 48 min ago",
    status: "Inactive",
    initials: "AV",
    avatarBg: "bg-sky-500",
  },
  {
    name: "Priya Nair",
    action: "deactivated",
    title: "Synonym Match Set",
    meta: "Aptitude · Verbal Ability · 2 hours ago",
    status: "Inactive",
    initials: "PN",
    avatarBg: "bg-rose-500",
  },
  {
    name: "Rohan Das",
    action: "grade-mapped",
    title: "Pattern Sequence",
    metaSuffix: "to Gr 8 & Gr 9",
    meta: "Aptitude · Abstract Reasoning · 5 hours ago",
    status: "Active",
    initials: "RD",
    avatarBg: "bg-amber-500",
  },
];

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-500",
  INACTIVE: "bg-slate-100 text-slate-500",
  Retrying: "bg-amber-50 text-amber-700",
  DRAFT: "bg-amber-50 text-amber-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
  COMPLETED: "bg-slate-100 text-slate-500",
  Completed: "bg-slate-100 text-slate-500",
  Generated: "bg-emerald-50 text-emerald-700",
  Generating: "bg-amber-50 text-amber-700",
};

// difficulty_level enum on `questions`: EASY / MEDIUM / HARD
const DIFFICULTY_DATA = [
  { name: "Easy", value: 38, color: "#10b981" },
  { name: "Medium", value: 42, color: "#d97706" },
  { name: "Hard", value: 20, color: "#dc2626" },
];

// question_type enum on `questions` (subset shown, remaining types rolled into "Other")
const QUESTION_TYPE_DATA = [
  { name: "SINGLE_CHOICE", value: 5200 },
  { name: "LIKERT_5", value: 3400 },
  { name: "IMAGE_SELECTION", value: 2400 },
  { name: "INTEGER", value: 1800 },
  { name: "SHORT_TEXT", value: 1400 },
  { name: "Other types", value: 1220 },
];

// dimension_id -> dimensions.color_code, used for the badge dot in the table below
const DIMENSION_COLORS = {
  "Logical Reasoning": "#4A90E2",
  "Numerical Ability": "#0891b2",
  "Verbal Ability": "#7c3aed",
  "Abstract Reasoning": "#d97706",
  "Spatial Ability": "#dc2626",
  Investigative: "#059669",
  Conscientiousness: "#db2777",
  "Situational Judgement": "#475569",
};

// Mirrors the `questions` table joined to sections / subsections / dimensions
// and question_grade_mapping. default_marks / negative_marks come straight
// from the schema; grades[] is the many-to-many grade mapping.
const INITIAL_QUESTIONS = [
  { id: "LR-1042", prompt: "If all Bloops are Razzles and all Razzles are Lazzles, are all Bloops Lazzles?", section: "Aptitude", subsection: "Logical Reasoning", dimension: "Logical Reasoning", questionType: "SINGLE_CHOICE", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.25, grades: ["Gr 9", "Gr 10"], isActive: true },
  { id: "NA-0885", prompt: "A train 120m long crosses a pole in 8 seconds. Find its speed in km/h.", section: "Aptitude", subsection: "Numerical Ability", dimension: "Numerical Ability", questionType: "INTEGER", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 10"], isActive: true },
  { id: "VA-0231", prompt: "Choose the word most similar in meaning to \"Ephemeral.\"", section: "Aptitude", subsection: "Verbal Ability", dimension: "Verbal Ability", questionType: "SINGLE_CHOICE", difficulty: "EASY", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 11"], isActive: true },
  { id: "AR-0567", prompt: "Identify the figure that completes the given sequence.", section: "Aptitude", subsection: "Abstract Reasoning", dimension: "Abstract Reasoning", questionType: "IMAGE_SELECTION", difficulty: "HARD", defaultMarks: 2.0, negativeMarks: 0.5, grades: ["Gr 8"], isActive: true },
  { id: "SR-0142", prompt: "Which 3D shape is formed when this net is folded?", section: "Aptitude", subsection: "Spatial Ability", dimension: "Spatial Ability", questionType: "IMAGE_SELECTION", difficulty: "MEDIUM", defaultMarks: 1.5, negativeMarks: 0.25, grades: ["Gr 9"], isActive: true },
  { id: "IN-0210", prompt: "I enjoy figuring out how mechanical things work.", section: "Interest", subsection: "RIASEC", dimension: "Investigative", questionType: "LIKERT_5", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 9", "Gr 10", "Gr 11", "Gr 12"], isActive: true },
  { id: "PE-0087", prompt: "I follow a schedule and like to keep things organized.", section: "Personality", subsection: "Big Five", dimension: "Conscientiousness", questionType: "LIKERT_5", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 11", "Gr 12"], isActive: false },
  { id: "PS-0033", prompt: "You notice a teammate copying answers during a mock test. What do you do?", section: "Psychometric", subsection: "Situational Judgement", dimension: "Situational Judgement", questionType: "SINGLE_CHOICE", difficulty: "MEDIUM", defaultMarks: 2.0, negativeMarks: 0.0, grades: ["Gr 12"], isActive: true },
  { id: "NA-0912", prompt: "If 15 workers finish a task in 12 days, how many days for 20 workers?", section: "Aptitude", subsection: "Numerical Ability", dimension: "Numerical Ability", questionType: "INTEGER", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 10"], isActive: true },
  { id: "VA-0304", prompt: "Rearrange the jumbled letters to form a meaningful word: \"TAINOUC.\"", section: "Aptitude", subsection: "Verbal Ability", dimension: "Verbal Ability", questionType: "SHORT_TEXT", difficulty: "EASY", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 8"], isActive: true },
  { id: "AR-0602", prompt: "Find the odd one out among the given figures.", section: "Aptitude", subsection: "Abstract Reasoning", dimension: "Abstract Reasoning", questionType: "MATCH_THE_FOLLOWING", difficulty: "MEDIUM", defaultMarks: 2.0, negativeMarks: 0.25, grades: ["Gr 11"], isActive: false },
  { id: "SR-0201", prompt: "Rotate the given shape 90° clockwise and select the correct match.", section: "Aptitude", subsection: "Spatial Ability", dimension: "Spatial Ability", questionType: "RANK_ORDER", difficulty: "HARD", defaultMarks: 2.0, negativeMarks: 0.5, grades: ["Gr 10"], isActive: true },
];

const PAGE_SIZE = 4;
const TOTAL_ITEMS = "15,420";

const QA_CHECKLIST = [
  {
    title: "Review 620 Inactive Questions",
    description: "is_active = false, awaiting reactivation or cleanup",
    icon: Pencil,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    title: "Verify question_grade_mapping Coverage",
    description: "9 subsections need alignment",
    icon: Tag,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Push Master Sync to Assessment Engine",
    description: "Scheduled for 18:00 UTC",
    icon: UploadCloud,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    title: "Run Bias & Fairness Audit",
    description: "Psychometric review standard",
    icon: ShieldCheck,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

const CONNECTED_PLATFORMS = [
  { name: "Canvas LMS", meta: "Synced 4 min ago", status: "Active", icon: LayoutGrid, iconBg: "bg-rose-50", iconColor: "text-rose-500", statusColor: "text-emerald-600", dotColor: "bg-emerald-500" },
  { name: "Moodle", meta: "Synced 11 min ago", status: "Active", icon: GraduationCap, iconBg: "bg-slate-100", iconColor: "text-slate-600", statusColor: "text-emerald-600", dotColor: "bg-emerald-500" },
  { name: "Blackboard", meta: "Retry in 2 min", status: "Retrying", icon: Users, iconBg: "bg-amber-50", iconColor: "text-amber-600", statusColor: "text-amber-600", dotColor: "bg-amber-500" },
];

// ---- Assessments tab data (maps to assessments / assessment_versions / campaigns) ----

const ASSESSMENT_STAT_CARDS = [
  {
    label: "Total Assessments",
    value: "24",
    delta: "+2 new",
    icon: ClipboardList,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    sparkColor: "#4338ca",
    sparkline: [4, 5, 5, 6, 6, 7, 7, 8, 8, 9],
  },
  {
    label: "Published Versions",
    value: "18",
    delta: "+1 this week",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    sparkColor: "#059669",
    sparkline: [9, 10, 11, 11, 12, 13, 14, 15, 16, 18],
  },
  {
    label: "Active Campaigns",
    value: "7",
    note: "live now",
    icon: Zap,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    sparkColor: "#4f46e5",
    sparkline: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
  },
  {
    label: "Assignments Pending",
    value: "1,286",
    note: "awaiting start",
    icon: Pencil,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    sparkColor: "#ea580c",
    sparkline: [22, 20, 19, 18, 17, 16, 15, 14, 13, 13],
  },
];

const INITIAL_CAMPAIGNS = [
  { code: "CAMP2026", name: "Career Assessment 2026", organization: "ABC Public School", assessment: "Career Assessment – Grade 10", start: "01 Jul 2026", end: "30 Aug 2026", registrations: 325, capacity: 500, status: "ACTIVE" },
  { code: "CAMP2027", name: "Summer Aptitude Drive", organization: "Delhi Public Sr. Sec.", assessment: "Aptitude Diagnostic – Grade 8", start: "10 Jul 2026", end: "20 Aug 2026", registrations: 188, capacity: 300, status: "ACTIVE" },
  { code: "CAMP2031", name: "Campus Interest Mapping", organization: "St. Xavier's College", assessment: "RIASEC Interest Profiler", start: "01 Jun 2026", end: "15 Jun 2026", registrations: 240, capacity: 240, status: "COMPLETED" },
  { code: "CAMP2038", name: "Grade 11 Personality Pilot", organization: "Ryan International", assessment: "Big Five Personality Screener", start: "05 Aug 2026", end: "31 Aug 2026", registrations: 24, capacity: 200, status: "DRAFT" },
];

// ---- Reports tab data (maps to evaluation_results / dimension_results / report_instances) ----

const REPORT_STAT_CARDS = [
  {
    label: "Reports Generated",
    value: "8,940",
    delta: "+5.6%",
    icon: FileText,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    sparkColor: "#0f766e",
    sparkline: [14, 15, 16, 17, 18, 19, 20, 22, 23, 25],
  },
  {
    label: "Avg. Percentile",
    value: "71.4",
    delta: "+2.1 pts",
    icon: Percent,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    sparkColor: "#059669",
    sparkline: [62, 64, 65, 66, 67, 68, 69, 70, 71, 71.4],
  },
  {
    label: "Pending Evaluation",
    value: "54",
    note: "in queue",
    icon: ClipboardList,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    sparkColor: "#ea580c",
    sparkline: [30, 28, 26, 25, 22, 20, 18, 16, 14, 12],
  },
  {
    label: "Report Downloads",
    value: "6,205",
    note: "last 30 days",
    icon: Download,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    sparkColor: "#4f46e5",
    sparkline: [40, 42, 41, 44, 46, 45, 48, 50, 52, 55],
  },
];

const INITIAL_REPORTS = [
  { id: "RPT-30412", student: "Aarav Sharma", assessment: "Career Assessment – Grade 10", template: "Career Report V2", generated: "30 Jul 2026", rating: "Excellent", percentile: 92, status: "Generated" },
  { id: "RPT-30413", student: "Simran Kaur", assessment: "Aptitude Diagnostic – Grade 8", template: "Aptitude Report V1", generated: "30 Jul 2026", rating: "Good", percentile: 74, status: "Generated" },
  { id: "RPT-30414", student: "Kabir Mehta", assessment: "RIASEC Interest Profiler", template: "Interest Report V1", generated: "29 Jul 2026", rating: "Average", percentile: 58, status: "Generated" },
  { id: "RPT-30415", student: "Ananya Rao", assessment: "Career Assessment – Grade 10", template: "Career Report V2", generated: "29 Jul 2026", rating: "—", percentile: null, status: "Generating" },
  { id: "RPT-30416", student: "Devansh Patel", assessment: "Psychometric Readiness – College", template: "Enterprise Report V1", generated: "28 Jul 2026", rating: "Excellent", percentile: 88, status: "Generated" },
];

const DIMENSION_PERFORMANCE = [
  { name: "Logical Reasoning", value: 82 },
  { name: "Numerical Ability", value: 71 },
  { name: "Verbal Ability", value: 76 },
  { name: "Abstract Reasoning", value: 63 },
  { name: "Spatial Reasoning", value: 59 },
];

// ---- Assessments list config (moved over from the Overview page) ----------

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

// ---- Header action + create-modal config, one entry per tab ----------------

const HEADER_ACTIONS = {
  Repository: { label: "Add Question", shortLabel: "Add", icon: Plus },
  Assessments: { label: "Create Assessment", shortLabel: "Create", icon: Plus },
  Reports: { label: "Generate Report", shortLabel: "Generate", icon: Sparkles },
};

const FORM_FIELDS = {
  Repository: [
    { key: "id", label: "Question Code", placeholder: "e.g. LR-1201" },
    { key: "prompt", label: "Question Text", placeholder: "Type the question text…", textarea: true },
    { key: "subsection", label: "Subsection (Section · Dimension)", placeholder: "e.g. Logical Reasoning" },
    { key: "questionType", label: "Question Type", placeholder: "e.g. SINGLE_CHOICE" },
    { key: "grades", label: "Grade Mapping", placeholder: "e.g. Gr 9, Gr 10" },
  ],
  Assessments: [
    { key: "code", label: "Assessment Code", placeholder: "e.g. ASMT025" },
    { key: "name", label: "Assessment Name", placeholder: "e.g. Career Assessment – Grade 11" },
    { key: "type", label: "Assessment Type", placeholder: "e.g. CAREER" },
    { key: "grades", label: "Grade Mapping", placeholder: "e.g. Gr 11-12" },
  ],
  Reports: [
    { key: "student", label: "Student Name", placeholder: "e.g. Aarav Sharma" },
    { key: "assessment", label: "Assessment", placeholder: "e.g. Career Assessment – Grade 10" },
    { key: "template", label: "Report Template", placeholder: "e.g. Career Report V2" },
  ],
};

// ---- Small building blocks ---------------------------------------------

const Sparkline = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 30 - ((value - min) / range) * 26;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,32 ${points} 100,32`;

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={areaPoints} fill={color} opacity="0.08" stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const StatCard = ({ label, value, delta, note, icon: Icon, iconBg, iconColor, sparkline, sparkColor }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </span>
    </div>
    <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      {delta && (
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="h-3 w-3" />
          {delta}
        </span>
      )}
      {note && <span className="text-xs font-medium text-slate-400">{note}</span>}
    </div>
    <div className="mt-4">
      <Sparkline data={sparkline} color={sparkColor} />
    </div>
  </div>
);

const InitialsAvatar = ({ initials, bg }) => (
  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", bg)}>
    {initials}
  </span>
);

const ActivityItem = ({ item }) => (
  <div className="flex items-start gap-3 py-4 first:pt-0">
    <InitialsAvatar initials={item.initials} bg={item.avatarBg} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm text-slate-700">
        <span className="font-semibold text-slate-900">{item.name}</span> {item.action}{" "}
        <span className="font-semibold text-slate-900">&quot;{item.title}&quot;</span>
        {item.metaSuffix ? ` ${item.metaSuffix}` : ""}
      </p>
      <p className="mt-0.5 truncate text-xs text-slate-400">{item.meta}</p>
    </div>
    <span className={cn("shrink-0 rounded-md px-2 py-1 text-xs font-semibold", STATUS_STYLES[item.status])}>
      {item.status}
    </span>
  </div>
);

const DifficultyDonut = () => (
  <div>
    <p className="text-sm font-semibold text-slate-900">Difficulty Distribution</p>
    <div className="mx-auto h-[200px] max-w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={DIFFICULTY_DATA}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={2}
            stroke="none"
          >
            {DIFFICULTY_DATA.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value}%`, name]}
            contentStyle={{ borderRadius: 8, border: `1px solid ${adminTheme.chart.gridStroke}`, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
      {DIFFICULTY_DATA.map((entry) => (
        <span key={entry.name} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}
        </span>
      ))}
    </div>
  </div>
);

const QuestionTypeBars = () => (
  <div className="mt-6">
    <p className="text-sm font-semibold text-slate-900">Question Type Distribution</p>
    <div className="mt-2 h-[210px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={QUESTION_TYPE_DATA} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={adminTheme.chart.gridStroke} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: adminTheme.chart.axisText }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 11, fill: "#334155" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${adminTheme.chart.gridStroke}`, fontSize: 12 }}
          />
          <Bar dataKey="value" fill={adminTheme.chart.stroke} radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DimensionPerformanceBars = () => (
  <div>
    <p className="text-sm font-semibold text-slate-900">Cohort Dimension Performance</p>
    <p className={cn(adminTheme.card.subtitle, "mt-1")}>Average score by dimension, last 30 days</p>
    <div className="mt-4 h-[230px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={DIMENSION_PERFORMANCE} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={adminTheme.chart.gridStroke} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: adminTheme.chart.axisText }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: "#334155" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
            formatter={(value) => [`${value}%`, "Avg. Score"]}
            contentStyle={{ borderRadius: 8, border: `1px solid ${adminTheme.chart.gridStroke}`, fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ---- Page sections ---------------------------------------------------------

const PageHeader = ({ activeTab, onTabChange, onPrimaryAction }) => {
  const action = HEADER_ACTIONS[activeTab];
  return (
    <header className={cn("border-b bg-white", adminTheme.border.default)}>
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Question Bank Repository</h1>
          <p className="mt-1 text-sm text-slate-400">Last synced with Assessment Engine · 4 minutes ago</p>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4",
                  activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <button type="button" className={adminTheme.button.iconBordered} aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <button type="button" onClick={onPrimaryAction} className={cn(adminTheme.actionButton.primary, "shrink-0")}>
            <action.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">{action.shortLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const StatusBanner = ({ eyebrow, title, description, chips }) => (
  <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 sm:px-10 sm:py-10">
    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-300">{description}</p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {chips.map((chip) => (
          <span key={chip.label} className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
            <span className={cn("h-2 w-2 rounded-full", chip.dot)} />
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const RecentActivityCard = ({ activeFilter, onFilterChange }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-3")}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Recent Activity Feed</h3>
        <p className={cn(adminTheme.card.subtitle, "mt-1")}>Live updates across your repository</p>
      </div>
      <button type="button" className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
        View all →
      </button>
    </div>

    <div className="relative mt-5">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Search questions, authors, tags..."
        className={cn(
          "h-11 w-full pl-9 pr-3 text-sm",
          adminTheme.radius.md,
          adminTheme.border.default,
          "border bg-slate-50 text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        )}
      />
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onFilterChange(filter)}
          className={activeFilter === filter ? adminTheme.actionButton.pillActive : adminTheme.actionButton.pillInactive}
        >
          {filter}
        </button>
      ))}
    </div>

    <div className="mt-2 divide-y divide-slate-100">
      {ACTIVITY_FEED.map((item) => (
        <ActivityItem key={item.title} item={item} />
      ))}
    </div>
  </div>
);

const QuestionAnalyticsCard = () => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-2")}>
    <h3 className="text-base font-semibold text-slate-900">Question Analytics</h3>
    <p className={cn(adminTheme.card.subtitle, "mt-1")}>Distribution across the bank</p>

    <div className="mt-5">
      <DifficultyDonut />
      <QuestionTypeBars />
    </div>
  </div>
);

const MostUsedQuestionsCard = ({ questions, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = questions.slice(start, start + PAGE_SIZE);

  return (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
            <Zap className="h-4 w-4 text-white" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Question Library</h3>
            <p className={adminTheme.card.subtitle}>questions · question_grade_mapping — configuration only, no response data</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={adminTheme.actionButton.secondary}>
            <Plus className="h-4 w-4" />
            Add New Question
          </button>
          <button type="button" className={adminTheme.actionButton.primary}>
            <UploadCloud className="h-4 w-4" />
            Bulk Import (CSV/Excel)
          </button>
        </div>
      </div>

      <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              <th className={cn(adminTheme.table.headerCell, "pl-5 sm:pl-6")}>question_code</th>
              <th className={adminTheme.table.headerCell}>Question Text</th>
              <th className={adminTheme.table.headerCell}>Section · Subsection</th>
              <th className={adminTheme.table.headerCell}>Dimension</th>
              <th className={adminTheme.table.headerCell}>Type · Difficulty</th>
              <th className={adminTheme.table.headerCell}>Marks (default / neg.)</th>
              <th className={adminTheme.table.headerCell}>Grades</th>
              <th className={cn(adminTheme.table.headerCell, "pr-5 sm:pr-6")}>is_active</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((question) => (
              <tr key={question.id} className={adminTheme.table.row}>
                <td className={cn(adminTheme.table.cellMuted, "pl-5 font-medium sm:pl-6")}>{question.id}</td>
                <td className={cn(adminTheme.table.cell, "max-w-xs font-medium text-slate-900")}>
                  <span className="line-clamp-2">{question.prompt}</span>
                </td>
                <td className={adminTheme.table.cell}>
                  {question.section} <span className="text-slate-400">· {question.subsection}</span>
                </td>
                <td className={adminTheme.table.cell}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: DIMENSION_COLORS[question.dimension] || "#94a3b8" }}
                    />
                    {question.dimension}
                  </span>
                </td>
                <td className={adminTheme.table.cell}>
                  <span className="block font-mono text-xs text-slate-700">{question.questionType}</span>
                  <span className="text-xs text-slate-400">{question.difficulty}</span>
                </td>
                <td className={adminTheme.table.cell}>
                  {question.defaultMarks.toFixed(2)}
                  <span className="text-slate-400"> / −{question.negativeMarks.toFixed(2)}</span>
                </td>
                <td className={adminTheme.table.cell}>
                  <div className="flex flex-wrap gap-1">
                    {question.grades.map((g) => (
                      <span key={g} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {g}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={cn(adminTheme.table.cell, "pr-5 sm:pr-6")}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-semibold",
                        STATUS_STYLES[question.isActive ? "Active" : "Inactive"]
                      )}
                    >
                      {question.isActive ? "true" : "false"}
                    </span>
                    <button type="button" className="ml-auto text-slate-300 hover:text-slate-600" aria-label="Row actions">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-slate-700">{pageItems.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{TOTAL_ITEMS}</span> items
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={cn(adminTheme.button.iconBordered, currentPage === 1 && "cursor-not-allowed opacity-50")}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition",
                page === currentPage
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={cn(adminTheme.button.iconBordered, currentPage === totalPages && "cursor-not-allowed opacity-50")}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const QAChecklistCard = () => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <h3 className="text-base font-semibold text-slate-900">QA Checklist</h3>
    <p className={cn(adminTheme.card.subtitle, "mt-1")}>Active workflows before release</p>

    <div className="relative mt-5 space-y-5">
      {QA_CHECKLIST.map((item, index) => (
        <div key={item.title} className="relative flex items-start gap-3">
          {index !== QA_CHECKLIST.length - 1 && (
            <span className="absolute left-5 top-10 h-[calc(100%-8px)] w-px bg-slate-100" />
          )}
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", item.iconBg)}>
            <item.icon className={cn("h-4 w-4", item.iconColor)} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
          </div>
          <button type="button" className="shrink-0 text-slate-300 hover:text-slate-600" aria-label="Task actions">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const ConnectedPlatformsCard = () => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <h3 className="text-base font-semibold text-slate-900">Connected Learning Platforms</h3>
    <p className={cn(adminTheme.card.subtitle, "mt-1")}>Integration health overview</p>

    <div className="mt-5 space-y-3">
      {CONNECTED_PLATFORMS.map((platform) => (
        <div
          key={platform.name}
          className={cn("flex items-center gap-3 border p-4", adminTheme.border.default, adminTheme.radius.lg)}
        >
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", platform.iconBg)}>
            <platform.icon className={cn("h-5 w-5", platform.iconColor)} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{platform.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">{platform.meta}</p>
          </div>
          <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-sm font-medium", platform.statusColor)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", platform.dotColor)} />
            {platform.status}
          </span>
        </div>
      ))}

      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-center gap-1.5 border border-dashed p-4 text-sm font-medium text-slate-400",
          "hover:border-slate-300 hover:text-slate-600",
          adminTheme.border.default,
          adminTheme.radius.lg
        )}
      >
        <Plus className="h-4 w-4" />
        Connect New Platform
      </button>
    </div>
  </div>
);

// ---- Repository tab (default view) -----------------------------------------

const RepositoryView = ({ questions, activeFilter, onFilterChange, currentPage, onPageChange }) => (
  <>
    <StatusBanner
      eyebrow="Institutional Assessment Repository"
      title="All systems operational"
      description="Your aptitude question bank is synchronized across three connected learning management platforms."
      chips={PLATFORMS.map((p) => ({ label: p.name, dot: p.dot }))}
    />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_CARDS.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <RecentActivityCard activeFilter={activeFilter} onFilterChange={onFilterChange} />
      <QuestionAnalyticsCard />
    </div>

    <MostUsedQuestionsCard questions={questions} currentPage={currentPage} onPageChange={onPageChange} />

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <QAChecklistCard />
      <ConnectedPlatformsCard />
    </div>
  </>
);

// ---- Assessments tab ---------------------------------------------------------
// The list below is the full assessments table (moved over from the
// Assessment Overview page): live-fetched via redux, with per-status tabs,
// row selection, bulk publish/archive/delete, and pagination. It replaces
// the page's previous static "Assessment Library" table, which duplicated
// this data with a smaller, non-live feature set.

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
    // TODO: wire up to real publish/archive/delete API calls, then refetch
    // via fetchAssessmentListSlice(). The list here is redux-backed, so it
    // isn't mutated locally.
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
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
            <ClipboardList className="h-4 w-4 text-white" />
          </span>
          <div>
            <p className={adminTheme.card.title}>Assessments</p>
            <p className={adminTheme.card.subtitle}>All assessments, live from the Assessment Engine</p>
          </div>
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

const CampaignsCard = ({ campaigns }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
        <CalendarDays className="h-4 w-4 text-indigo-600" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-slate-900">Active Campaigns</h3>
        <p className={adminTheme.card.subtitle}>Registration progress by campaign</p>
      </div>
    </div>

    <div className="mt-5 space-y-3">
      {campaigns.map((campaign) => {
        const pct = Math.min(100, Math.round((campaign.registrations / campaign.capacity) * 100));
        return (
          <div
            key={campaign.code}
            className={cn("border p-4", adminTheme.border.default, adminTheme.radius.lg)}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="h-3.5 w-3.5" />
                  {campaign.organization} · {campaign.assessment}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-md px-2 py-1 text-xs font-semibold", STATUS_STYLES[campaign.status])}>
                {campaign.status}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-600">
                {campaign.registrations}/{campaign.capacity}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {campaign.start} – {campaign.end}
            </p>
          </div>
        );
      })}
    </div>
  </div>
);

const AssessmentsView = ({ campaigns }) => (
  <>
    <StatusBanner
      eyebrow="Assessment Configuration & Runtime"
      title="Assessments across your organizations"
      description="Assessment versions, grade mappings, and campaign rollouts are synced with the Assessment Runtime engine."
      chips={[
        { label: "Assessment Engine", dot: "bg-emerald-400" },
        { label: "Runtime API", dot: "bg-emerald-400" },
        { label: "Evaluation Queue", dot: "bg-amber-400" },
      ]}
    />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ASSESSMENT_STAT_CARDS.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>

    <AssessmentsListCard />
    <CampaignsCard campaigns={campaigns} />
  </>
);

// ---- Reports tab -------------------------------------------------------------

const ReportInstancesCard = ({ reports }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-3")}>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
        <FileText className="h-4 w-4 text-white" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-slate-900">Report Instances</h3>
        <p className={adminTheme.card.subtitle}>Generated evaluation reports, most recent first</p>
      </div>
    </div>

    <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            <th className={cn(adminTheme.table.headerCell, "pl-5 sm:pl-6")}>Report</th>
            <th className={adminTheme.table.headerCell}>Student</th>
            <th className={adminTheme.table.headerCell}>Assessment</th>
            <th className={adminTheme.table.headerCell}>Rating</th>
            <th className={cn(adminTheme.table.headerCell, "pr-5 sm:pr-6")}>Status</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className={adminTheme.table.row}>
              <td className={cn(adminTheme.table.cellMuted, "pl-5 font-medium sm:pl-6")}>{report.id}</td>
              <td className={cn(adminTheme.table.cell, "font-medium text-slate-900")}>{report.student}</td>
              <td className={adminTheme.table.cell}>
                {report.assessment}
                <span className="block text-xs text-slate-400">{report.template} · {report.generated}</span>
              </td>
              <td className={adminTheme.table.cell}>
                {report.rating}
                {report.percentile != null && (
                  <span className="ml-1 text-xs text-slate-400">({report.percentile}th pct.)</span>
                )}
              </td>
              <td className={cn(adminTheme.table.cell, "pr-5 sm:pr-6")}>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", STATUS_STYLES[report.status])}>
                    {report.status}
                  </span>
                  <button
                    type="button"
                    disabled={report.status !== "Generated"}
                    className={cn(
                      "ml-auto text-slate-300 hover:text-slate-600",
                      report.status !== "Generated" && "cursor-not-allowed opacity-40"
                    )}
                    aria-label="Download report"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DimensionPerformanceCard = () => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-2")}>
    <DimensionPerformanceBars />
  </div>
);

const ReportsView = ({ reports }) => (
  <>
    <StatusBanner
      eyebrow="Evaluation & Report Engine"
      title="8,940 reports generated to date"
      description="Evaluation results are scored dimension-wise, interpreted, and rendered into the assigned report template."
      chips={[
        { label: "Evaluation Engine", dot: "bg-emerald-400" },
        { label: "PDF Renderer", dot: "bg-emerald-400" },
        { label: "S3 Storage", dot: "bg-emerald-400" },
      ]}
    />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {REPORT_STAT_CARDS.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <ReportInstancesCard reports={reports} />
      <DimensionPerformanceCard />
    </div>
  </>
);

// ---- Create modal (contextual per tab) --------------------------------------

const CreateModal = ({ activeTab, onClose, onSubmit }) => {
  const fields = FORM_FIELDS[activeTab];
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, ""]))
  );

  const handleChange = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className={cn("w-full max-w-md bg-white p-6", adminTheme.radius.lg, "shadow-xl")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{HEADER_ACTIONS[activeTab].label}</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {activeTab === "Repository" && "Add a new item to the question repository."}
              {activeTab === "Assessments" && "Register a new assessment in the library."}
              {activeTab === "Reports" && "Queue a new evaluation report for generation."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">{field.label}</label>
              {field.textarea ? (
                <textarea
                  required
                  rows={3}
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={cn(
                    "w-full px-3 py-2 text-sm",
                    adminTheme.radius.md,
                    adminTheme.border.default,
                    "border bg-slate-50 text-slate-900 placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  )}
                />
              ) : (
                <input
                  required
                  type="text"
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={cn(
                    "h-10 w-full px-3 text-sm",
                    adminTheme.radius.md,
                    adminTheme.border.default,
                    "border bg-slate-50 text-slate-900 placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  )}
                />
              )}
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={adminTheme.actionButton.secondary}>
              Cancel
            </button>
            <button type="submit" className={adminTheme.actionButton.primary}>
              {HEADER_ACTIONS[activeTab].label}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Toast = ({ message }) => (
  <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
    <Check className="h-4 w-4 text-emerald-400" />
    {message}
  </div>
);

// ---- Page -------------------------------------------------------------------

const QuestionBankRepository = () => {
  const [activeTab, setActiveTab] = useState("Repository");
  const [activeFilter, setActiveFilter] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);

  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [campaigns] = useState(INITIAL_CAMPAIGNS);
  const [reports, setReports] = useState(INITIAL_REPORTS);

  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleCreate = (values) => {
    if (activeTab === "Repository") {
      setQuestions((prev) => [
        {
          id: values.id || `Q-${Math.floor(Math.random() * 9000 + 1000)}`,
          prompt: values.prompt,
          section: "Aptitude",
          subsection: values.subsection || "Uncategorized",
          dimension: values.subsection || "Uncategorized",
          questionType: (values.questionType || "SINGLE_CHOICE").toUpperCase().replace(/\s+/g, "_"),
          difficulty: "MEDIUM",
          defaultMarks: 1.0,
          negativeMarks: 0.0,
          grades: values.grades ? values.grades.split(",").map((g) => g.trim()).filter(Boolean) : [],
          isActive: true,
        },
        ...prev,
      ]);
      showToast("Question added to the repository");
    } else if (activeTab === "Assessments") {
      // The assessments list is redux-backed (see AssessmentsListCard), so
      // creation should go through a create-assessment API call + refetch
      // rather than local state. Wire this up once that endpoint exists.
      showToast("Assessment submitted for creation");
    } else {
      setReports((prev) => [
        {
          id: `RPT-${Math.floor(Math.random() * 90000 + 10000)}`,
          student: values.student,
          assessment: values.assessment,
          template: values.template || "Default Template",
          generated: "Just now",
          rating: "—",
          percentile: null,
          status: "Generating",
        },
        ...prev,
      ]);
      showToast("Report queued for generation");
    }
    setModalOpen(false);
  };

  return (
    <div className={cn("min-h-screen", adminTheme.surface.page)}>
      <PageHeader activeTab={activeTab} onTabChange={handleTabChange} onPrimaryAction={() => setModalOpen(true)} />

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === "Repository" && (
          <RepositoryView
            questions={questions}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
        {activeTab === "Assessments" && <AssessmentsView campaigns={campaigns} />}
        {activeTab === "Reports" && <ReportsView reports={reports} />}
      </main>

      {modalOpen && (
        <CreateModal activeTab={activeTab} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
};

export default QuestionBankRepository;



// import { useState } from "react";
// import {
//   Search,
//   Bell,
//   Plus,
//   Layers,
//   CheckCircle2,
//   Lock,
//   Pencil,
//   ChevronLeft,
//   ChevronRight,
//   MoreVertical,
//   Zap,
//   UploadCloud,
//   Tag,
//   ShieldCheck,
//   GraduationCap,
//   LayoutGrid,
//   Users,
//   ArrowUpRight,
//   FileText,
//   ClipboardList,
//   CalendarDays,
//   Percent,
//   Download,
//   Sparkles,
//   Building2,
//   X,
//   Check,
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
//  * Admin panel for the assessment platform's back office: the question bank
//  * repository, the assessment library + campaign runtime, and the evaluation
//  * report engine — all driven off the same tab bar in the header.
//  * All visual styling is sourced from `adminTheme` so this page automatically
//  * stays in sync with the rest of the admin panel.
//  */

// // ---- Mock data (aptitude test management domain) --------------------------

// const TABS = ["Repository", "Assessments", "Reports"];

// const FILTERS = ["All Sections", "Aptitude", "Interest", "Personality", "Psychometric"];

// const PLATFORMS = [
//   { name: "Canvas LMS", dot: "bg-emerald-400" },
//   { name: "Moodle", dot: "bg-emerald-400" },
//   { name: "Blackboard", dot: "bg-amber-400" },
// ];

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
//     label: "Multi-Grade Mapped",
//     value: "9,140",
//     note: "via question_grade_mapping",
//     icon: Tag,
//     iconBg: "bg-orange-50",
//     iconColor: "text-orange-500",
//     sparkColor: "#ea580c",
//     sparkline: [6, 7, 6, 8, 9, 8, 10, 9, 11, 12],
//   },
// ];

// const ACTIVITY_FEED = [
//   {
//     name: "Dr. Meera Iyer",
//     action: "updated",
//     title: "Series Completion Q12",
//     meta: "Aptitude · Logical Reasoning · 12 min ago",
//     status: "Active",
//     initials: "MI",
//     avatarBg: "bg-indigo-500",
//   },
//   {
//     name: "Arjun Verma",
//     action: "added",
//     title: "Train Speed Problem",
//     metaSuffix: "to subsection",
//     meta: "Aptitude · Numerical Ability · 48 min ago",
//     status: "Inactive",
//     initials: "AV",
//     avatarBg: "bg-sky-500",
//   },
//   {
//     name: "Priya Nair",
//     action: "deactivated",
//     title: "Synonym Match Set",
//     meta: "Aptitude · Verbal Ability · 2 hours ago",
//     status: "Inactive",
//     initials: "PN",
//     avatarBg: "bg-rose-500",
//   },
//   {
//     name: "Rohan Das",
//     action: "grade-mapped",
//     title: "Pattern Sequence",
//     metaSuffix: "to Gr 8 & Gr 9",
//     meta: "Aptitude · Abstract Reasoning · 5 hours ago",
//     status: "Active",
//     initials: "RD",
//     avatarBg: "bg-amber-500",
//   },
// ];

// const STATUS_STYLES = {
//   Active: "bg-emerald-50 text-emerald-700",
//   ACTIVE: "bg-emerald-50 text-emerald-700",
//   Inactive: "bg-slate-100 text-slate-500",
//   INACTIVE: "bg-slate-100 text-slate-500",
//   Retrying: "bg-amber-50 text-amber-700",
//   DRAFT: "bg-amber-50 text-amber-700",
//   COMPLETED: "bg-slate-100 text-slate-500",
//   Completed: "bg-slate-100 text-slate-500",
//   Generated: "bg-emerald-50 text-emerald-700",
//   Generating: "bg-amber-50 text-amber-700",
// };

// // difficulty_level enum on `questions`: EASY / MEDIUM / HARD
// const DIFFICULTY_DATA = [
//   { name: "Easy", value: 38, color: "#10b981" },
//   { name: "Medium", value: 42, color: "#d97706" },
//   { name: "Hard", value: 20, color: "#dc2626" },
// ];

// // question_type enum on `questions` (subset shown, remaining types rolled into "Other")
// const QUESTION_TYPE_DATA = [
//   { name: "SINGLE_CHOICE", value: 5200 },
//   { name: "LIKERT_5", value: 3400 },
//   { name: "IMAGE_SELECTION", value: 2400 },
//   { name: "INTEGER", value: 1800 },
//   { name: "SHORT_TEXT", value: 1400 },
//   { name: "Other types", value: 1220 },
// ];

// // dimension_id -> dimensions.color_code, used for the badge dot in the table below
// const DIMENSION_COLORS = {
//   "Logical Reasoning": "#4A90E2",
//   "Numerical Ability": "#0891b2",
//   "Verbal Ability": "#7c3aed",
//   "Abstract Reasoning": "#d97706",
//   "Spatial Ability": "#dc2626",
//   Investigative: "#059669",
//   Conscientiousness: "#db2777",
//   "Situational Judgement": "#475569",
// };

// // Mirrors the `questions` table joined to sections / subsections / dimensions
// // and question_grade_mapping. default_marks / negative_marks come straight
// // from the schema; grades[] is the many-to-many grade mapping.
// const INITIAL_QUESTIONS = [
//   { id: "LR-1042", prompt: "If all Bloops are Razzles and all Razzles are Lazzles, are all Bloops Lazzles?", section: "Aptitude", subsection: "Logical Reasoning", dimension: "Logical Reasoning", questionType: "SINGLE_CHOICE", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.25, grades: ["Gr 9", "Gr 10"], isActive: true },
//   { id: "NA-0885", prompt: "A train 120m long crosses a pole in 8 seconds. Find its speed in km/h.", section: "Aptitude", subsection: "Numerical Ability", dimension: "Numerical Ability", questionType: "INTEGER", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 10"], isActive: true },
//   { id: "VA-0231", prompt: "Choose the word most similar in meaning to \"Ephemeral.\"", section: "Aptitude", subsection: "Verbal Ability", dimension: "Verbal Ability", questionType: "SINGLE_CHOICE", difficulty: "EASY", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 11"], isActive: true },
//   { id: "AR-0567", prompt: "Identify the figure that completes the given sequence.", section: "Aptitude", subsection: "Abstract Reasoning", dimension: "Abstract Reasoning", questionType: "IMAGE_SELECTION", difficulty: "HARD", defaultMarks: 2.0, negativeMarks: 0.5, grades: ["Gr 8"], isActive: true },
//   { id: "SR-0142", prompt: "Which 3D shape is formed when this net is folded?", section: "Aptitude", subsection: "Spatial Ability", dimension: "Spatial Ability", questionType: "IMAGE_SELECTION", difficulty: "MEDIUM", defaultMarks: 1.5, negativeMarks: 0.25, grades: ["Gr 9"], isActive: true },
//   { id: "IN-0210", prompt: "I enjoy figuring out how mechanical things work.", section: "Interest", subsection: "RIASEC", dimension: "Investigative", questionType: "LIKERT_5", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 9", "Gr 10", "Gr 11", "Gr 12"], isActive: true },
//   { id: "PE-0087", prompt: "I follow a schedule and like to keep things organized.", section: "Personality", subsection: "Big Five", dimension: "Conscientiousness", questionType: "LIKERT_5", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 11", "Gr 12"], isActive: false },
//   { id: "PS-0033", prompt: "You notice a teammate copying answers during a mock test. What do you do?", section: "Psychometric", subsection: "Situational Judgement", dimension: "Situational Judgement", questionType: "SINGLE_CHOICE", difficulty: "MEDIUM", defaultMarks: 2.0, negativeMarks: 0.0, grades: ["Gr 12"], isActive: true },
//   { id: "NA-0912", prompt: "If 15 workers finish a task in 12 days, how many days for 20 workers?", section: "Aptitude", subsection: "Numerical Ability", dimension: "Numerical Ability", questionType: "INTEGER", difficulty: "MEDIUM", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 10"], isActive: true },
//   { id: "VA-0304", prompt: "Rearrange the jumbled letters to form a meaningful word: \"TAINOUC.\"", section: "Aptitude", subsection: "Verbal Ability", dimension: "Verbal Ability", questionType: "SHORT_TEXT", difficulty: "EASY", defaultMarks: 1.0, negativeMarks: 0.0, grades: ["Gr 8"], isActive: true },
//   { id: "AR-0602", prompt: "Find the odd one out among the given figures.", section: "Aptitude", subsection: "Abstract Reasoning", dimension: "Abstract Reasoning", questionType: "MATCH_THE_FOLLOWING", difficulty: "MEDIUM", defaultMarks: 2.0, negativeMarks: 0.25, grades: ["Gr 11"], isActive: false },
//   { id: "SR-0201", prompt: "Rotate the given shape 90° clockwise and select the correct match.", section: "Aptitude", subsection: "Spatial Ability", dimension: "Spatial Ability", questionType: "RANK_ORDER", difficulty: "HARD", defaultMarks: 2.0, negativeMarks: 0.5, grades: ["Gr 10"], isActive: true },
// ];

// const PAGE_SIZE = 4;
// const TOTAL_ITEMS = "15,420";

// const QA_CHECKLIST = [
//   {
//     title: "Review 620 Inactive Questions",
//     description: "is_active = false, awaiting reactivation or cleanup",
//     icon: Pencil,
//     iconBg: "bg-orange-50",
//     iconColor: "text-orange-500",
//   },
//   {
//     title: "Verify question_grade_mapping Coverage",
//     description: "9 subsections need alignment",
//     icon: Tag,
//     iconBg: "bg-amber-50",
//     iconColor: "text-amber-600",
//   },
//   {
//     title: "Push Master Sync to Assessment Engine",
//     description: "Scheduled for 18:00 UTC",
//     icon: UploadCloud,
//     iconBg: "bg-slate-100",
//     iconColor: "text-slate-600",
//   },
//   {
//     title: "Run Bias & Fairness Audit",
//     description: "Psychometric review standard",
//     icon: ShieldCheck,
//     iconBg: "bg-emerald-50",
//     iconColor: "text-emerald-600",
//   },
// ];

// const CONNECTED_PLATFORMS = [
//   { name: "Canvas LMS", meta: "Synced 4 min ago", status: "Active", icon: LayoutGrid, iconBg: "bg-rose-50", iconColor: "text-rose-500", statusColor: "text-emerald-600", dotColor: "bg-emerald-500" },
//   { name: "Moodle", meta: "Synced 11 min ago", status: "Active", icon: GraduationCap, iconBg: "bg-slate-100", iconColor: "text-slate-600", statusColor: "text-emerald-600", dotColor: "bg-emerald-500" },
//   { name: "Blackboard", meta: "Retry in 2 min", status: "Retrying", icon: Users, iconBg: "bg-amber-50", iconColor: "text-amber-600", statusColor: "text-amber-600", dotColor: "bg-amber-500" },
// ];

// // ---- Assessments tab data (maps to assessments / assessment_versions / campaigns) ----

// const ASSESSMENT_STAT_CARDS = [
//   {
//     label: "Total Assessments",
//     value: "24",
//     delta: "+2 new",
//     icon: ClipboardList,
//     iconBg: "bg-slate-100",
//     iconColor: "text-slate-600",
//     sparkColor: "#4338ca",
//     sparkline: [4, 5, 5, 6, 6, 7, 7, 8, 8, 9],
//   },
//   {
//     label: "Published Versions",
//     value: "18",
//     delta: "+1 this week",
//     icon: CheckCircle2,
//     iconBg: "bg-emerald-50",
//     iconColor: "text-emerald-600",
//     sparkColor: "#059669",
//     sparkline: [9, 10, 11, 11, 12, 13, 14, 15, 16, 18],
//   },
//   {
//     label: "Active Campaigns",
//     value: "7",
//     note: "live now",
//     icon: Zap,
//     iconBg: "bg-indigo-50",
//     iconColor: "text-indigo-600",
//     sparkColor: "#4f46e5",
//     sparkline: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
//   },
//   {
//     label: "Assignments Pending",
//     value: "1,286",
//     note: "awaiting start",
//     icon: Pencil,
//     iconBg: "bg-orange-50",
//     iconColor: "text-orange-500",
//     sparkColor: "#ea580c",
//     sparkline: [22, 20, 19, 18, 17, 16, 15, 14, 13, 13],
//   },
// ];

// const INITIAL_ASSESSMENTS = [
//   { code: "ASMT001", name: "Career Assessment – Grade 10", type: "CAREER", versions: 3, published: "V2.1", grades: "Gr 9-10", questions: 80, status: "ACTIVE" },
//   { code: "ASMT004", name: "Aptitude Diagnostic – Grade 8", type: "APTITUDE", versions: 2, published: "V1.4", grades: "Gr 7-8", questions: 60, status: "ACTIVE" },
//   { code: "ASMT007", name: "RIASEC Interest Profiler", type: "INTEREST", versions: 1, published: "V1.0", grades: "Gr 9-12", questions: 42, status: "ACTIVE" },
//   { code: "ASMT011", name: "Big Five Personality Screener", type: "PERSONALITY", versions: 2, published: "V1.2", grades: "Gr 11-12", questions: 50, status: "DRAFT" },
//   { code: "ASMT015", name: "Psychometric Readiness – College", type: "PSYCHOMETRIC", versions: 1, published: "V1.0", grades: "College", questions: 70, status: "ACTIVE" },
// ];

// const INITIAL_CAMPAIGNS = [
//   { code: "CAMP2026", name: "Career Assessment 2026", organization: "ABC Public School", assessment: "Career Assessment – Grade 10", start: "01 Jul 2026", end: "30 Aug 2026", registrations: 325, capacity: 500, status: "ACTIVE" },
//   { code: "CAMP2027", name: "Summer Aptitude Drive", organization: "Delhi Public Sr. Sec.", assessment: "Aptitude Diagnostic – Grade 8", start: "10 Jul 2026", end: "20 Aug 2026", registrations: 188, capacity: 300, status: "ACTIVE" },
//   { code: "CAMP2031", name: "Campus Interest Mapping", organization: "St. Xavier's College", assessment: "RIASEC Interest Profiler", start: "01 Jun 2026", end: "15 Jun 2026", registrations: 240, capacity: 240, status: "COMPLETED" },
//   { code: "CAMP2038", name: "Grade 11 Personality Pilot", organization: "Ryan International", assessment: "Big Five Personality Screener", start: "05 Aug 2026", end: "31 Aug 2026", registrations: 24, capacity: 200, status: "DRAFT" },
// ];

// // ---- Reports tab data (maps to evaluation_results / dimension_results / report_instances) ----

// const REPORT_STAT_CARDS = [
//   {
//     label: "Reports Generated",
//     value: "8,940",
//     delta: "+5.6%",
//     icon: FileText,
//     iconBg: "bg-slate-100",
//     iconColor: "text-slate-600",
//     sparkColor: "#0f766e",
//     sparkline: [14, 15, 16, 17, 18, 19, 20, 22, 23, 25],
//   },
//   {
//     label: "Avg. Percentile",
//     value: "71.4",
//     delta: "+2.1 pts",
//     icon: Percent,
//     iconBg: "bg-emerald-50",
//     iconColor: "text-emerald-600",
//     sparkColor: "#059669",
//     sparkline: [62, 64, 65, 66, 67, 68, 69, 70, 71, 71.4],
//   },
//   {
//     label: "Pending Evaluation",
//     value: "54",
//     note: "in queue",
//     icon: ClipboardList,
//     iconBg: "bg-orange-50",
//     iconColor: "text-orange-500",
//     sparkColor: "#ea580c",
//     sparkline: [30, 28, 26, 25, 22, 20, 18, 16, 14, 12],
//   },
//   {
//     label: "Report Downloads",
//     value: "6,205",
//     note: "last 30 days",
//     icon: Download,
//     iconBg: "bg-indigo-50",
//     iconColor: "text-indigo-600",
//     sparkColor: "#4f46e5",
//     sparkline: [40, 42, 41, 44, 46, 45, 48, 50, 52, 55],
//   },
// ];

// const INITIAL_REPORTS = [
//   { id: "RPT-30412", student: "Aarav Sharma", assessment: "Career Assessment – Grade 10", template: "Career Report V2", generated: "30 Jul 2026", rating: "Excellent", percentile: 92, status: "Generated" },
//   { id: "RPT-30413", student: "Simran Kaur", assessment: "Aptitude Diagnostic – Grade 8", template: "Aptitude Report V1", generated: "30 Jul 2026", rating: "Good", percentile: 74, status: "Generated" },
//   { id: "RPT-30414", student: "Kabir Mehta", assessment: "RIASEC Interest Profiler", template: "Interest Report V1", generated: "29 Jul 2026", rating: "Average", percentile: 58, status: "Generated" },
//   { id: "RPT-30415", student: "Ananya Rao", assessment: "Career Assessment – Grade 10", template: "Career Report V2", generated: "29 Jul 2026", rating: "—", percentile: null, status: "Generating" },
//   { id: "RPT-30416", student: "Devansh Patel", assessment: "Psychometric Readiness – College", template: "Enterprise Report V1", generated: "28 Jul 2026", rating: "Excellent", percentile: 88, status: "Generated" },
// ];

// const DIMENSION_PERFORMANCE = [
//   { name: "Logical Reasoning", value: 82 },
//   { name: "Numerical Ability", value: 71 },
//   { name: "Verbal Ability", value: 76 },
//   { name: "Abstract Reasoning", value: 63 },
//   { name: "Spatial Reasoning", value: 59 },
// ];

// // ---- Header action + create-modal config, one entry per tab ----------------

// const HEADER_ACTIONS = {
//   Repository: { label: "Add Question", shortLabel: "Add", icon: Plus },
//   Assessments: { label: "Create Assessment", shortLabel: "Create", icon: Plus },
//   Reports: { label: "Generate Report", shortLabel: "Generate", icon: Sparkles },
// };

// const FORM_FIELDS = {
//   Repository: [
//     { key: "id", label: "Question Code", placeholder: "e.g. LR-1201" },
//     { key: "prompt", label: "Question Text", placeholder: "Type the question text…", textarea: true },
//     { key: "subsection", label: "Subsection (Section · Dimension)", placeholder: "e.g. Logical Reasoning" },
//     { key: "questionType", label: "Question Type", placeholder: "e.g. SINGLE_CHOICE" },
//     { key: "grades", label: "Grade Mapping", placeholder: "e.g. Gr 9, Gr 10" },
//   ],
//   Assessments: [
//     { key: "code", label: "Assessment Code", placeholder: "e.g. ASMT025" },
//     { key: "name", label: "Assessment Name", placeholder: "e.g. Career Assessment – Grade 11" },
//     { key: "type", label: "Assessment Type", placeholder: "e.g. CAREER" },
//     { key: "grades", label: "Grade Mapping", placeholder: "e.g. Gr 11-12" },
//   ],
//   Reports: [
//     { key: "student", label: "Student Name", placeholder: "e.g. Aarav Sharma" },
//     { key: "assessment", label: "Assessment", placeholder: "e.g. Career Assessment – Grade 10" },
//     { key: "template", label: "Report Template", placeholder: "e.g. Career Report V2" },
//   ],
// };

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

// const DimensionPerformanceBars = () => (
//   <div>
//     <p className="text-sm font-semibold text-slate-900">Cohort Dimension Performance</p>
//     <p className={cn(adminTheme.card.subtitle, "mt-1")}>Average score by dimension, last 30 days</p>
//     <div className="mt-4 h-[230px]">
//       <ResponsiveContainer width="100%" height="100%">
//         <BarChart data={DIMENSION_PERFORMANCE} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
//           <CartesianGrid horizontal={false} stroke={adminTheme.chart.gridStroke} />
//           <XAxis
//             type="number"
//             domain={[0, 100]}
//             tick={{ fontSize: 11, fill: adminTheme.chart.axisText }}
//             axisLine={false}
//             tickLine={false}
//           />
//           <YAxis
//             type="category"
//             dataKey="name"
//             width={140}
//             tick={{ fontSize: 11, fill: "#334155" }}
//             axisLine={false}
//             tickLine={false}
//           />
//           <Tooltip
//             cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
//             formatter={(value) => [`${value}%`, "Avg. Score"]}
//             contentStyle={{ borderRadius: 8, border: `1px solid ${adminTheme.chart.gridStroke}`, fontSize: 12 }}
//           />
//           <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   </div>
// );

// // ---- Page sections ---------------------------------------------------------

// const PageHeader = ({ activeTab, onTabChange, onPrimaryAction }) => {
//   const action = HEADER_ACTIONS[activeTab];
//   return (
//     <header className={cn("border-b bg-white", adminTheme.border.default)}>
//       <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
//         <div>
//           <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Question Bank Repository</h1>
//           <p className="mt-1 text-sm text-slate-400">Last synced with Assessment Engine · 4 minutes ago</p>
//         </div>

//         <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
//           <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
//             {TABS.map((tab) => (
//               <button
//                 key={tab}
//                 type="button"
//                 onClick={() => onTabChange(tab)}
//                 className={cn(
//                   "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4",
//                   activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
//                 )}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>
//           <button type="button" className={adminTheme.button.iconBordered} aria-label="Notifications">
//             <Bell className="h-4 w-4" />
//           </button>
//           <button type="button" onClick={onPrimaryAction} className={cn(adminTheme.actionButton.primary, "shrink-0")}>
//             <action.icon className="h-4 w-4" />
//             <span className="hidden sm:inline">{action.label}</span>
//             <span className="sm:hidden">{action.shortLabel}</span>
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// };

// const StatusBanner = ({ eyebrow, title, description, chips }) => (
//   <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 sm:px-10 sm:py-10">
//     <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
//       <div>
//         <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{eyebrow}</p>
//         <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
//         <p className="mt-2 max-w-xl text-sm text-slate-300">{description}</p>
//       </div>
//       <div className="flex flex-wrap gap-x-6 gap-y-2">
//         {chips.map((chip) => (
//           <span key={chip.label} className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
//             <span className={cn("h-2 w-2 rounded-full", chip.dot)} />
//             {chip.label}
//           </span>
//         ))}
//       </div>
//     </div>
//   </div>
// );

// const RecentActivityCard = ({ activeFilter, onFilterChange }) => (
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
//         placeholder="Search questions, authors, tags..."
//         className={cn(
//           "h-11 w-full pl-9 pr-3 text-sm",
//           adminTheme.radius.md,
//           adminTheme.border.default,
//           "border bg-slate-50 text-slate-900 placeholder:text-slate-400",
//           "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
//         )}
//       />
//     </div>

//     <div className="mt-4 flex flex-wrap gap-2">
//       {FILTERS.map((filter) => (
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

// const MostUsedQuestionsCard = ({ questions, currentPage, onPageChange }) => {
//   const totalPages = Math.ceil(questions.length / PAGE_SIZE);
//   const start = (currentPage - 1) * PAGE_SIZE;
//   const pageItems = questions.slice(start, start + PAGE_SIZE);

//   return (
//     <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div className="flex items-center gap-3">
//           <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
//             <Zap className="h-4 w-4 text-white" />
//           </span>
//           <div>
//             <h3 className="text-base font-semibold text-slate-900">Question Library</h3>
//             <p className={adminTheme.card.subtitle}>questions · question_grade_mapping — configuration only, no response data</p>
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
//         <table className="w-full min-w-[980px] border-collapse">
//           <thead>
//             <tr>
//               <th className={cn(adminTheme.table.headerCell, "pl-5 sm:pl-6")}>question_code</th>
//               <th className={adminTheme.table.headerCell}>Question Text</th>
//               <th className={adminTheme.table.headerCell}>Section · Subsection</th>
//               <th className={adminTheme.table.headerCell}>Dimension</th>
//               <th className={adminTheme.table.headerCell}>Type · Difficulty</th>
//               <th className={adminTheme.table.headerCell}>Marks (default / neg.)</th>
//               <th className={adminTheme.table.headerCell}>Grades</th>
//               <th className={cn(adminTheme.table.headerCell, "pr-5 sm:pr-6")}>is_active</th>
//             </tr>
//           </thead>
//           <tbody>
//             {pageItems.map((question) => (
//               <tr key={question.id} className={adminTheme.table.row}>
//                 <td className={cn(adminTheme.table.cellMuted, "pl-5 font-medium sm:pl-6")}>{question.id}</td>
//                 <td className={cn(adminTheme.table.cell, "max-w-xs font-medium text-slate-900")}>
//                   <span className="line-clamp-2">{question.prompt}</span>
//                 </td>
//                 <td className={adminTheme.table.cell}>
//                   {question.section} <span className="text-slate-400">· {question.subsection}</span>
//                 </td>
//                 <td className={adminTheme.table.cell}>
//                   <span className="inline-flex items-center gap-1.5">
//                     <span
//                       className="h-2 w-2 shrink-0 rounded-full"
//                       style={{ backgroundColor: DIMENSION_COLORS[question.dimension] || "#94a3b8" }}
//                     />
//                     {question.dimension}
//                   </span>
//                 </td>
//                 <td className={adminTheme.table.cell}>
//                   <span className="block font-mono text-xs text-slate-700">{question.questionType}</span>
//                   <span className="text-xs text-slate-400">{question.difficulty}</span>
//                 </td>
//                 <td className={adminTheme.table.cell}>
//                   {question.defaultMarks.toFixed(2)}
//                   <span className="text-slate-400"> / −{question.negativeMarks.toFixed(2)}</span>
//                 </td>
//                 <td className={adminTheme.table.cell}>
//                   <div className="flex flex-wrap gap-1">
//                     {question.grades.map((g) => (
//                       <span key={g} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
//                         {g}
//                       </span>
//                     ))}
//                   </div>
//                 </td>
//                 <td className={cn(adminTheme.table.cell, "pr-5 sm:pr-6")}>
//                   <div className="flex items-center gap-2">
//                     <span
//                       className={cn(
//                         "rounded-md px-2 py-1 text-xs font-semibold",
//                         STATUS_STYLES[question.isActive ? "Active" : "Inactive"]
//                       )}
//                     >
//                       {question.isActive ? "true" : "false"}
//                     </span>
//                     <button type="button" className="ml-auto text-slate-300 hover:text-slate-600" aria-label="Row actions">
//                       <MoreVertical className="h-4 w-4" />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
//         <p className="text-sm text-slate-400">
//           Showing <span className="font-semibold text-slate-700">{pageItems.length}</span> of{" "}
//           <span className="font-semibold text-slate-700">{TOTAL_ITEMS}</span> items
//         </p>
//         <div className="flex items-center gap-2">
//           <button
//             type="button"
//             onClick={() => onPageChange(Math.max(1, currentPage - 1))}
//             disabled={currentPage === 1}
//             className={cn(adminTheme.button.iconBordered, currentPage === 1 && "cursor-not-allowed opacity-50")}
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
//                 page === currentPage
//                   ? "bg-slate-900 text-white"
//                   : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//               )}
//             >
//               {page}
//             </button>
//           ))}
//           <button
//             type="button"
//             onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
//             disabled={currentPage === totalPages}
//             className={cn(adminTheme.button.iconBordered, currentPage === totalPages && "cursor-not-allowed opacity-50")}
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

// // ---- Repository tab (default view) -----------------------------------------

// const RepositoryView = ({ questions, activeFilter, onFilterChange, currentPage, onPageChange }) => (
//   <>
//     <StatusBanner
//       eyebrow="Institutional Assessment Repository"
//       title="All systems operational"
//       description="Your aptitude question bank is synchronized across three connected learning management platforms."
//       chips={PLATFORMS.map((p) => ({ label: p.name, dot: p.dot }))}
//     />

//     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//       {STAT_CARDS.map((card) => (
//         <StatCard key={card.label} {...card} />
//       ))}
//     </div>

//     <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
//       <RecentActivityCard activeFilter={activeFilter} onFilterChange={onFilterChange} />
//       <QuestionAnalyticsCard />
//     </div>

//     <MostUsedQuestionsCard questions={questions} currentPage={currentPage} onPageChange={onPageChange} />

//     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//       <QAChecklistCard />
//       <ConnectedPlatformsCard />
//     </div>
//   </>
// );

// // ---- Assessments tab --------------------------------------------------------

// const AssessmentLibraryCard = ({ assessments }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <div className="flex flex-wrap items-center justify-between gap-3">
//       <div className="flex items-center gap-3">
//         <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
//           <ClipboardList className="h-4 w-4 text-white" />
//         </span>
//         <div>
//           <h3 className="text-base font-semibold text-slate-900">Assessment Library</h3>
//           <p className={adminTheme.card.subtitle}>Master assessments and their published versions</p>
//         </div>
//       </div>
//       <button type="button" className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
//         View all →
//       </button>
//     </div>

//     <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
//       <table className="w-full min-w-[760px] border-collapse">
//         <thead>
//           <tr>
//             <th className={cn(adminTheme.table.headerCell, "pl-5 sm:pl-6")}>Code</th>
//             <th className={adminTheme.table.headerCell}>Assessment</th>
//             <th className={adminTheme.table.headerCell}>Type</th>
//             <th className={adminTheme.table.headerCell}>Versions</th>
//             <th className={adminTheme.table.headerCell}>Grades</th>
//             <th className={cn(adminTheme.table.headerCell, "pr-5 sm:pr-6")}>Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {assessments.map((item) => (
//             <tr key={item.code} className={adminTheme.table.row}>
//               <td className={cn(adminTheme.table.cellMuted, "pl-5 font-medium sm:pl-6")}>{item.code}</td>
//               <td className={cn(adminTheme.table.cell, "font-medium text-slate-900")}>
//                 {item.name}
//                 <span className="ml-2 text-xs font-normal text-slate-400">{item.questions} questions</span>
//               </td>
//               <td className={adminTheme.table.cell}>{item.type}</td>
//               <td className={adminTheme.table.cell}>
//                 {item.versions} <span className="text-slate-400">· latest {item.published}</span>
//               </td>
//               <td className={adminTheme.table.cell}>{item.grades}</td>
//               <td className={cn(adminTheme.table.cell, "pr-5 sm:pr-6")}>
//                 <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", STATUS_STYLES[item.status])}>
//                   {item.status}
//                 </span>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   </div>
// );

// const CampaignsCard = ({ campaigns }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
//     <div className="flex items-center gap-3">
//       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
//         <CalendarDays className="h-4 w-4 text-indigo-600" />
//       </span>
//       <div>
//         <h3 className="text-base font-semibold text-slate-900">Active Campaigns</h3>
//         <p className={adminTheme.card.subtitle}>Registration progress by campaign</p>
//       </div>
//     </div>

//     <div className="mt-5 space-y-3">
//       {campaigns.map((campaign) => {
//         const pct = Math.min(100, Math.round((campaign.registrations / campaign.capacity) * 100));
//         return (
//           <div
//             key={campaign.code}
//             className={cn("border p-4", adminTheme.border.default, adminTheme.radius.lg)}
//           >
//             <div className="flex flex-wrap items-start justify-between gap-2">
//               <div className="min-w-0">
//                 <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
//                 <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
//                   <Building2 className="h-3.5 w-3.5" />
//                   {campaign.organization} · {campaign.assessment}
//                 </p>
//               </div>
//               <span className={cn("shrink-0 rounded-md px-2 py-1 text-xs font-semibold", STATUS_STYLES[campaign.status])}>
//                 {campaign.status}
//               </span>
//             </div>
//             <div className="mt-3 flex items-center gap-3">
//               <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
//                 <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
//               </div>
//               <span className="shrink-0 text-xs font-semibold text-slate-600">
//                 {campaign.registrations}/{campaign.capacity}
//               </span>
//             </div>
//             <p className="mt-2 text-xs text-slate-400">
//               {campaign.start} – {campaign.end}
//             </p>
//           </div>
//         );
//       })}
//     </div>
//   </div>
// );

// const AssessmentsView = ({ assessments, campaigns }) => (
//   <>
//     <StatusBanner
//       eyebrow="Assessment Configuration & Runtime"
//       title="24 assessments across 5 organizations"
//       description="Assessment versions, grade mappings, and campaign rollouts are synced with the Assessment Runtime engine."
//       chips={[
//         { label: "Assessment Engine", dot: "bg-emerald-400" },
//         { label: "Runtime API", dot: "bg-emerald-400" },
//         { label: "Evaluation Queue", dot: "bg-amber-400" },
//       ]}
//     />

//     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//       {ASSESSMENT_STAT_CARDS.map((card) => (
//         <StatCard key={card.label} {...card} />
//       ))}
//     </div>

//     <AssessmentLibraryCard assessments={assessments} />
//     <CampaignsCard campaigns={campaigns} />
//   </>
// );

// // ---- Reports tab -------------------------------------------------------------

// const ReportInstancesCard = ({ reports }) => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-3")}>
//     <div className="flex items-center gap-3">
//       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
//         <FileText className="h-4 w-4 text-white" />
//       </span>
//       <div>
//         <h3 className="text-base font-semibold text-slate-900">Report Instances</h3>
//         <p className={adminTheme.card.subtitle}>Generated evaluation reports, most recent first</p>
//       </div>
//     </div>

//     <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
//       <table className="w-full min-w-[720px] border-collapse">
//         <thead>
//           <tr>
//             <th className={cn(adminTheme.table.headerCell, "pl-5 sm:pl-6")}>Report</th>
//             <th className={adminTheme.table.headerCell}>Student</th>
//             <th className={adminTheme.table.headerCell}>Assessment</th>
//             <th className={adminTheme.table.headerCell}>Rating</th>
//             <th className={cn(adminTheme.table.headerCell, "pr-5 sm:pr-6")}>Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {reports.map((report) => (
//             <tr key={report.id} className={adminTheme.table.row}>
//               <td className={cn(adminTheme.table.cellMuted, "pl-5 font-medium sm:pl-6")}>{report.id}</td>
//               <td className={cn(adminTheme.table.cell, "font-medium text-slate-900")}>{report.student}</td>
//               <td className={adminTheme.table.cell}>
//                 {report.assessment}
//                 <span className="block text-xs text-slate-400">{report.template} · {report.generated}</span>
//               </td>
//               <td className={adminTheme.table.cell}>
//                 {report.rating}
//                 {report.percentile != null && (
//                   <span className="ml-1 text-xs text-slate-400">({report.percentile}th pct.)</span>
//                 )}
//               </td>
//               <td className={cn(adminTheme.table.cell, "pr-5 sm:pr-6")}>
//                 <div className="flex items-center gap-2">
//                   <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", STATUS_STYLES[report.status])}>
//                     {report.status}
//                   </span>
//                   <button
//                     type="button"
//                     disabled={report.status !== "Generated"}
//                     className={cn(
//                       "ml-auto text-slate-300 hover:text-slate-600",
//                       report.status !== "Generated" && "cursor-not-allowed opacity-40"
//                     )}
//                     aria-label="Download report"
//                   >
//                     <Download className="h-4 w-4" />
//                   </button>
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   </div>
// );

// const DimensionPerformanceCard = () => (
//   <div className={cn(adminTheme.card.base, adminTheme.card.padding, "lg:col-span-2")}>
//     <DimensionPerformanceBars />
//   </div>
// );

// const ReportsView = ({ reports }) => (
//   <>
//     <StatusBanner
//       eyebrow="Evaluation & Report Engine"
//       title="8,940 reports generated to date"
//       description="Evaluation results are scored dimension-wise, interpreted, and rendered into the assigned report template."
//       chips={[
//         { label: "Evaluation Engine", dot: "bg-emerald-400" },
//         { label: "PDF Renderer", dot: "bg-emerald-400" },
//         { label: "S3 Storage", dot: "bg-emerald-400" },
//       ]}
//     />

//     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//       {REPORT_STAT_CARDS.map((card) => (
//         <StatCard key={card.label} {...card} />
//       ))}
//     </div>

//     <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
//       <ReportInstancesCard reports={reports} />
//       <DimensionPerformanceCard />
//     </div>
//   </>
// );

// // ---- Create modal (contextual per tab) --------------------------------------

// const CreateModal = ({ activeTab, onClose, onSubmit }) => {
//   const fields = FORM_FIELDS[activeTab];
//   const [values, setValues] = useState(() =>
//     Object.fromEntries(fields.map((f) => [f.key, ""]))
//   );

//   const handleChange = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSubmit(values);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
//       <div className={cn("w-full max-w-md bg-white p-6", adminTheme.radius.lg, "shadow-xl")}>
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <h3 className="text-base font-semibold text-slate-900">{HEADER_ACTIONS[activeTab].label}</h3>
//             <p className="mt-0.5 text-xs text-slate-400">
//               {activeTab === "Repository" && "Add a new item to the question repository."}
//               {activeTab === "Assessments" && "Register a new assessment in the library."}
//               {activeTab === "Reports" && "Queue a new evaluation report for generation."}
//             </p>
//           </div>
//           <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="mt-5 space-y-4">
//           {fields.map((field) => (
//             <div key={field.key}>
//               <label className="mb-1.5 block text-xs font-semibold text-slate-600">{field.label}</label>
//               {field.textarea ? (
//                 <textarea
//                   required
//                   rows={3}
//                   value={values[field.key]}
//                   onChange={(e) => handleChange(field.key, e.target.value)}
//                   placeholder={field.placeholder}
//                   className={cn(
//                     "w-full px-3 py-2 text-sm",
//                     adminTheme.radius.md,
//                     adminTheme.border.default,
//                     "border bg-slate-50 text-slate-900 placeholder:text-slate-400",
//                     "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
//                   )}
//                 />
//               ) : (
//                 <input
//                   required
//                   type="text"
//                   value={values[field.key]}
//                   onChange={(e) => handleChange(field.key, e.target.value)}
//                   placeholder={field.placeholder}
//                   className={cn(
//                     "h-10 w-full px-3 text-sm",
//                     adminTheme.radius.md,
//                     adminTheme.border.default,
//                     "border bg-slate-50 text-slate-900 placeholder:text-slate-400",
//                     "focus:outline-none focus:ring-2 focus:ring-slate-900/10"
//                   )}
//                 />
//               )}
//             </div>
//           ))}

//           <div className="flex items-center justify-end gap-2 pt-2">
//             <button type="button" onClick={onClose} className={adminTheme.actionButton.secondary}>
//               Cancel
//             </button>
//             <button type="submit" className={adminTheme.actionButton.primary}>
//               {HEADER_ACTIONS[activeTab].label}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// const Toast = ({ message }) => (
//   <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
//     <Check className="h-4 w-4 text-emerald-400" />
//     {message}
//   </div>
// );

// // ---- Page -------------------------------------------------------------------

// const QuestionBankRepository = () => {
//   const [activeTab, setActiveTab] = useState("Repository");
//   const [activeFilter, setActiveFilter] = useState("All Categories");
//   const [currentPage, setCurrentPage] = useState(1);

//   const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
//   const [assessments, setAssessments] = useState(INITIAL_ASSESSMENTS);
//   const [campaigns] = useState(INITIAL_CAMPAIGNS);
//   const [reports, setReports] = useState(INITIAL_REPORTS);

//   const [modalOpen, setModalOpen] = useState(false);
//   const [toast, setToast] = useState(null);

//   const showToast = (message) => {
//     setToast(message);
//     setTimeout(() => setToast(null), 2600);
//   };

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     setCurrentPage(1);
//   };

//   const handleCreate = (values) => {
//     if (activeTab === "Repository") {
//       setQuestions((prev) => [
//         {
//           id: values.id || `Q-${Math.floor(Math.random() * 9000 + 1000)}`,
//           prompt: values.prompt,
//           section: "Aptitude",
//           subsection: values.subsection || "Uncategorized",
//           dimension: values.subsection || "Uncategorized",
//           questionType: (values.questionType || "SINGLE_CHOICE").toUpperCase().replace(/\s+/g, "_"),
//           difficulty: "MEDIUM",
//           defaultMarks: 1.0,
//           negativeMarks: 0.0,
//           grades: values.grades ? values.grades.split(",").map((g) => g.trim()).filter(Boolean) : [],
//           isActive: true,
//         },
//         ...prev,
//       ]);
//       showToast("Question added to the repository");
//     } else if (activeTab === "Assessments") {
//       setAssessments((prev) => [
//         {
//           code: values.code || `ASMT${Math.floor(Math.random() * 900 + 100)}`,
//           name: values.name,
//           type: values.type || "CUSTOM",
//           versions: 1,
//           published: "V1.0 (draft)",
//           grades: values.grades || "—",
//           questions: 0,
//           status: "DRAFT",
//         },
//         ...prev,
//       ]);
//       showToast("Assessment created as draft");
//     } else {
//       setReports((prev) => [
//         {
//           id: `RPT-${Math.floor(Math.random() * 90000 + 10000)}`,
//           student: values.student,
//           assessment: values.assessment,
//           template: values.template || "Default Template",
//           generated: "Just now",
//           rating: "—",
//           percentile: null,
//           status: "Generating",
//         },
//         ...prev,
//       ]);
//       showToast("Report queued for generation");
//     }
//     setModalOpen(false);
//   };

//   return (
//     <div className={cn("min-h-screen", adminTheme.surface.page)}>
//       <PageHeader activeTab={activeTab} onTabChange={handleTabChange} onPrimaryAction={() => setModalOpen(true)} />

//       <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
//         {activeTab === "Repository" && (
//           <RepositoryView
//             questions={questions}
//             activeFilter={activeFilter}
//             onFilterChange={setActiveFilter}
//             currentPage={currentPage}
//             onPageChange={setCurrentPage}
//           />
//         )}
//         {activeTab === "Assessments" && <AssessmentsView assessments={assessments} campaigns={campaigns} />}
//         {activeTab === "Reports" && <ReportsView reports={reports} />}
//       </main>

//       {modalOpen && (
//         <CreateModal activeTab={activeTab} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
//       )}
//       {toast && <Toast message={toast} />}
//     </div>
//   );
// };

// export default QuestionBankRepository;