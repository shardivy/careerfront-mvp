import React from "react";
import {
    ChevronRight,
    Lightbulb,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
} from "recharts";
import enterpriseTheme from "@/theme/enterpriseTheme";

const theme = enterpriseTheme;

/* ---------------------------------- data ---------------------------------- */

const FUNNEL_DATA = [
    { grade: "Gr 9", Registered: 215, Started: 118, Completed: 148 },
    { grade: "Gr 10", Registered: 200, Started: 135, Completed: 110 },
    { grade: "Gr 11", Registered: 185, Started: 160, Completed: 150 },
    { grade: "Gr 12", Registered: 178, Started: 180, Completed: 182 },
];

const FUNNEL_SERIES = [
    { key: "Registered", color: "#CBD5E1" },
    { key: "Started", color: "#93C5FD" },
    { key: "Completed", color: theme.colors.primary },
];

const CAREER_INTEREST = [
    { label: "STEM", value: 32, color: theme.colors.chart.blue },
    { label: "Healthcare", value: 22, color: theme.colors.chart.green },
    { label: "Arts & Design", value: 16, color: theme.colors.chart.purple },
    { label: "Business", value: 18, color: theme.colors.chart.orange },
    { label: "Education", value: 12, color: theme.colors.chart.red },
];

const COMPETENCY_DATA = [
    { skill: "Analytical", value: 88 },
    { skill: "Creative", value: 78 },
    { skill: "Leadership", value: 80 },
    { skill: "Empathy", value: 92 },
    { skill: "Technical", value: 75 },
    { skill: "Comm.", value: 82 },
];

const COMPLETION_METRICS = [
    { value: "24 min", label: "Avg. Completion Time", badge: "Within target", tone: "success" },
    { value: "8 min", label: "Fastest Completion", badge: "Grade 12 student", tone: "primary" },
    { value: "67 min", label: "Longest Session", badge: "Grade 9 student", tone: "warning" },
    { value: "4.2%", label: "Drop-off Rate", badge: "Below 5% target", tone: "success" },
    { value: "1.8%", label: "Re-attempt Rate", badge: "Normal range", tone: "primary" },
    { value: "4.6/5", label: "Satisfaction Score", badge: "From 524 ratings", tone: "success" },
];

/* --------------------------------- pieces --------------------------------- */


const PanelHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
    </div>
);

const FunnelLegend = () => (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
        {FUNNEL_SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
                <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                />
                <span className="text-xs text-slate-500">{s.key}</span>
            </div>
        ))}
    </div>
);

const AssessmentFunnelCard = () => (
    <div className={`${theme.card.base} p-5 sm:p-6`}>
        <PanelHeader
            title="Grade-wise Assessment Funnel"
            subtitle="Registered → Started → Completed"
        />
        <div className="h-64 sm:h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FUNNEL_DATA} barGap={4} barCategoryGap="28%">
                    <CartesianGrid vertical={false} stroke={theme.colors.border} strokeDasharray="4 4" />
                    <XAxis
                        dataKey="grade"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: theme.colors.text.light, fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: theme.colors.text.light, fontSize: 12 }}
                        width={36}
                    />
                    <Tooltip
                        cursor={{ fill: theme.colors.background.page }}
                        contentStyle={{
                            borderRadius: 12,
                            border: `1px solid ${theme.colors.border}`,
                            fontSize: 13,
                        }}
                    />
                    {FUNNEL_SERIES.map((s) => (
                        <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
        <FunnelLegend />
    </div>
);

const CareerInterestCard = () => (
    <div className={`${theme.card.base} p-5 sm:p-6`}>
        <PanelHeader
            title="Career Interest Distribution"
            subtitle="Top career pathways across completed assessments"
        />
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-44 h-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={CAREER_INTEREST}
                            dataKey="value"
                            nameKey="label"
                            innerRadius="62%"
                            outerRadius="100%"
                            paddingAngle={2}
                            stroke="none"
                        >
                            {CAREER_INTEREST.map((entry) => (
                                <Cell key={entry.label} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: 12,
                                border: `1px solid ${theme.colors.border}`,
                                fontSize: 13,
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="w-full space-y-3">
                {CAREER_INTEREST.map((c) => (
                    <div key={c.label} className="flex items-center gap-3">
                        <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: c.color }}
                        />
                        <span className="text-sm text-slate-600 w-28 flex-shrink-0">
                            {c.label}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${c.value}%`, backgroundColor: c.color }}
                            />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 w-9 text-right">
                            {c.value}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CompetencyProfileCard = () => (
    <div className={`${theme.card.base} p-5 sm:p-6 h-full`}>
        <PanelHeader title="Average Competency Profile" subtitle="School-wide mean scores" />
        <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={COMPETENCY_DATA} outerRadius="70%">
                    <PolarGrid stroke={theme.colors.border} />
                    <PolarAngleAxis
                        dataKey="skill"
                        tick={{ fill: theme.colors.text.body, fontSize: 12 }}
                    />
                    <Radar
                        dataKey="value"
                        stroke={theme.colors.primary}
                        fill={theme.colors.primary}
                        fillOpacity={0.15}
                        strokeWidth={2}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const MetricTile = ({ value, label, badge, tone }) => (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500 mt-1 mb-3">{label}</div>
        <span className={theme.badge[tone]}>{badge}</span>
    </div>
);

const AiInsightBanner = () => (
    <div className="rounded-xl bg-[#EEF4FF] border border-blue-100 p-4 flex gap-3 mt-4">
        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-[#4F7DF3]" />
        </div>
        <div>
            <h3 className="text-sm font-semibold text-[#3B6AF0]">AI Insight</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Grade 11 shows the highest completion velocity this month. Consider
                extending the same engagement strategy used in 11-A to
                lower-performing cohorts. Estimated impact:{" "}
                <span className="font-semibold text-slate-800">
                    +15% completion rate.
                </span>
            </p>
        </div>
    </div>
);

const CompletionMetricsCard = () => (
    <div className={`${theme.card.base} p-5 sm:p-6 h-full`}>
        <PanelHeader title="Completion Metrics" subtitle="Assessment performance benchmarks" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COMPLETION_METRICS.map((m) => (
                <MetricTile key={m.label} {...m} />
            ))}
        </div>
        <AiInsightBanner />
    </div>
);

/* ---------------------------------- page ---------------------------------- */

const Analytics = () => {
    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="mb-6">
                <h1 className={`${theme.typography.h3} text-slate-900`}>
                    Analytics &amp; Insights
                </h1>
                <p className="text-slate-500 mt-1">
                    School-wide performance intelligence &middot; 2024&ndash;25
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <AssessmentFunnelCard />
                <CareerInterestCard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5">
                <CompetencyProfileCard />
                <CompletionMetricsCard />
            </div>
        </div>
    );
};

export default Analytics;