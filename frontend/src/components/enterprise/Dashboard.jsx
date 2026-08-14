import React, { useState } from "react";
import { Download, Clock, Award, ClipboardCheck, TrendingUp, Users, Menu } from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import theme from "../../theme/enterpriseTheme";
import EnterpriseLayout from "../layouts/EnterpriseLayout";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const velocityData = [
    { month: "Aug", value: 20 },
    { month: "Sep", value: 35 },
    { month: "Oct", value: 45 },
    { month: "Nov", value: 78 },
    { month: "Dec", value: 55 },
    { month: "Jan", value: 88 },
    { month: "Feb", value: 105 },
    { month: "Mar", value: 148 },
    { month: "Apr", value: 172 },
    { month: "May", value: 205 },
    { month: "Jun", value: 232 },
    { month: "Jul", value: 253 },
];

// tone -> { icon bg/color, badge class }
const toneMap = {
    primary: { iconBg: theme.colors.primaryLight, iconColor: theme.colors.primary, badge: theme.badge.primary },
    success: { iconBg: theme.colors.successLight, iconColor: theme.colors.success, badge: theme.badge.success },
    info: { iconBg: theme.colors.infoLight, iconColor: theme.colors.info, badge: theme.badge.primary },
    warning: { iconBg: theme.colors.warningLight, iconColor: theme.colors.warning, badge: theme.badge.warning },
    danger: { iconBg: theme.colors.dangerLight, iconColor: theme.colors.danger, badge: theme.badge.danger },
};

const statCards = [
    {
        label: "Total Students",
        value: "767",
        icon: Users,
        tone: "primary",
        delta: "↑ 12% this term",
        deltaTone: "success",
        note: "vs last term",
    },
    {
        label: "Assessments Done",
        value: "599",
        icon: ClipboardCheck,
        tone: "success",
        delta: "↑ 8.4%",
        deltaTone: "success",
        note: "completion rate",
    },
    {
        label: "Completion Rate",
        value: "78.1%",
        icon: TrendingUp,
        tone: "info",
        delta: "↑ 5.2%",
        deltaTone: "success",
        note: "vs last month",
    },
    {
        label: "Avg. Time to Complete",
        value: "24 min",
        icon: Clock,
        tone: "warning",
        delta: "↓ 3 min",
        deltaTone: "danger",
        note: "vs baseline",
    },
    {
        label: "Reports Generated",
        value: "524",
        icon: Award,
        tone: "danger",
        delta: "↑ 18%",
        deltaTone: "success",
        note: "this month",
    },
];

const cohorts = [
    { grade: "Grade 9", done: 148, total: 210, pct: 70, tone: "primary" },
    { grade: "Grade 10", done: 112, total: 198, pct: 57, tone: "primary" },
    { grade: "Grade 11", done: 165, total: 185, pct: 89, tone: "primary" },
    { grade: "Grade 12", done: 174, total: 174, pct: 100, tone: "success" },
];

const recentActivity = [
    { name: "Aisha Patel", action: "Report downloaded", time: "2 min ago", avatarColor: "#F5C6CB" },
    { name: "Marcus Chen", action: "Assessment completed", time: "14 min ago", avatarColor: "#93C5FD" },
    { name: "Sofia Rodriguez", action: "Registered for assessment", time: "31 min ago", avatarColor: "#F9A8D4" },
    { name: "James Okonkwo", action: "Assessment started", time: "1 hr ago", avatarColor: "#CBD5E1" },
    { name: "Lena Fischer", action: "Report downloaded", time: "2 hrs ago", avatarColor: "#FDE68A" },
    { name: "Arjun Sharma", action: "Assessment completed", time: "3 hrs ago", avatarColor: "#1E293B" },
];

const StatCard = ({ card }) => {
    const Icon = card.icon;
    const tone = toneMap[card.tone];
    const deltaBadge = toneMap[card.deltaTone].badge;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase">{card.label}</span>
                <div
                    className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: tone.iconBg }}
                >
                    <Icon className="h-4 w-4" style={{ color: tone.iconColor }} />
                </div>
            </div>
            <div
                className="text-xl sm:text-2xl font-bold mt-2"
                style={{ color: theme.colors.text.heading }}
            >
                {card.value}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className={deltaBadge}>{card.delta}</span>
                <span className="text-xs" style={{ color: theme.colors.text.light }}>
                    {card.note}
                </span>
            </div>
        </div>
    );
};

const CohortRow = ({ cohort }) => {
    const barColor = cohort.tone === "success" ? theme.colors.chart.green : theme.colors.chart.blue;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium" style={{ color: theme.colors.text.heading }}>
                    {cohort.grade}
                </span>
                <span style={{ color: theme.colors.text.body }}>
                    {cohort.done}/{cohort.total}{" "}
                    <span className="font-semibold" style={{ color: theme.colors.text.heading }}>
                        {cohort.pct}%
                    </span>
                </span>
            </div>
            <div
                className="h-2 rounded-full w-full overflow-hidden"
                style={{ backgroundColor: theme.colors.border }}
            >
                <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${cohort.pct}%`, backgroundColor: barColor }}
                />
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-lg border bg-white px-2.5 py-1.5 text-xs"
            style={{ borderColor: theme.colors.border }}
        >
            <div className="font-semibold" style={{ color: theme.colors.text.heading }}>
                {label}
            </div>
            <div className="text-xs" style={{ color: theme.colors.chart.blue }}>{payload[0].value} completions</div>
        </div>
    );
};

const Dashboard = () => {
    const [range, setRange] = useState("Monthly");


    const handleExport = () => {
        const data = [
            {
                Students: 767,
                Assessments: 599,
                CompletionRate: "78.1%",
                Reports: 524,
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(data);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Dashboard"
        );

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        saveAs(
            new Blob([excelBuffer]),
            "DashboardReport.xlsx"
        );
    };

    return (

        <>
            <div className="flex-1 min-h-0 overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div className="min-w-0">

                        <h1
                            className="text-2xl sm:text-3xl font-bold truncate"
                            style={{ color: theme.colors.text.heading }}
                        >
                            School Overview
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: theme.colors.text.body }}>
                            Westlake Academy · Academic Year 2024–25
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className="text-xs px-2.5 py-1.5 rounded-lg border font-medium whitespace-nowrap"
                            style={{ borderColor: theme.colors.border, color: theme.colors.text.body, backgroundColor: theme.colors.background.card }}
                        >
                            Last synced: Today, 09:42 AM
                        </span>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
                    {statCards.map((card) => (
                        <StatCard key={card.label} card={card} />
                    ))}
                </div>

                {/* Chart + Cohort */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 mb-4">
                    {/* Completion Velocity */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                            <div>
                                <h2 className="text-lg font-semibold" style={{ color: theme.colors.text.heading }}>
                                    Completion Velocity
                                </h2>
                                <p className="text-xs mt-0.5" style={{ color: theme.colors.text.body }}>
                                    Monthly assessment completions · Aug 2024 – Jul 2025
                                </p>
                            </div>
                            <div className="flex items-center gap-0.5 rounded-lg border p-0.5" style={{ borderColor: theme.colors.border }}>
                                {["Monthly", "Quarterly"].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRange(r)}
                                        className="text-xs font-medium px-2.5 py-1 rounded-md transition-all"
                                        style={{
                                            backgroundColor: range === r ? theme.colors.primaryLight : "transparent",
                                            color: range === r ? theme.colors.primary : theme.colors.text.body,
                                        }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-56 sm:h-64 mt-2 -ml-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={theme.colors.chart.blue} stopOpacity={0.18} />
                                            <stop offset="100%" stopColor={theme.colors.chart.blue} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="4 6" stroke={theme.colors.border} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: theme.colors.text.body }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: theme.colors.text.body }}
                                        width={32}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={theme.colors.chart.blue}
                                        strokeWidth={2.5}
                                        fill="url(#velocityFill)"
                                        dot={{ r: 3.5, fill: theme.colors.chart.blue, strokeWidth: 0 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Cohort Breakdown */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-4 min-w-0">
                        <h2 className="text-lg font-semibold" style={{ color: theme.colors.text.heading }}>
                            Cohort Breakdown
                        </h2>

                        <div className="flex flex-col gap-4">
                            {cohorts.map((c) => (
                                <CohortRow key={c.grade} cohort={c} />
                            ))}
                        </div>

                        <div>
                            <p className="text-xs font-medium mb-2" style={{ color: theme.colors.text.body }}>
                                Quick Stats
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: theme.colors.primaryLight }}>
                                    <div className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                                        4
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: theme.colors.text.body }}>
                                        Grades
                                    </div>
                                </div>
                                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: theme.colors.successLight }}>
                                    <div className="text-xl font-bold" style={{ color: theme.colors.success }}>
                                        1
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: theme.colors.text.body }}>
                                        100%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold" style={{ color: theme.colors.text.heading }}>
                            Recent Activity
                        </h2>
                        <button className="text-xs font-medium" style={{ color: theme.colors.primary }}>
                            View all
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
                        {recentActivity.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 min-w-0">
                                <div
                                    className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 flex-shrink-0"
                                    style={{ backgroundColor: item.avatarColor, color: theme.colors.text.white }}
                                >
                                    {item.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate" style={{ color: theme.colors.text.heading }}>
                                        {item.name}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: theme.colors.text.body }}>
                                        {item.action}
                                    </p>
                                </div>
                                <span className="text-xs shrink-0" style={{ color: theme.colors.text.light }}>
                                    {item.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>

    );
};

export default Dashboard;