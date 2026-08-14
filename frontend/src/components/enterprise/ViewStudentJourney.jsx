import React from "react";
import { Button } from "@/components/ui/button";
import theme from "../../theme/enterpriseTheme";
import {
  Mail,
  Download,
  CheckCircle2,
  Printer,
  Share2,
  Sparkles,
  Target,
  BarChart3,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data (swap for your API data)
// ---------------------------------------------------------------------------

const student = {
  name: "Aisha Patel",
  status: "Completed",
  grade: "Grade 12",
  section: "12-A",
  email: "a.patel@westlake.edu",
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
  timeToComplete: "22 min",
  learningStyle: "Visual-Analytical",
  personalityType: "INTJ — Architect",
};

const timeline = [
  {
    title: "Registered",
    description: "Student account created & assessment assigned",
    date: "Aug 12, 2024",
  },
  {
    title: "Assessment Started",
    description: "Student began the career intelligence questionnaire",
    date: null,
  },
  {
    title: "Assessment Completed",
    description: "All 148 questions answered and submitted",
    date: "Sep 3, 2024",
  },
  {
    title: "AI Processing",
    description: "Career profiling algorithm analyzed responses",
    date: null,
  },
  {
    title: "Report Generated",
    description: "PDF career intelligence report compiled",
    date: "Sep 5, 2024",
  },
  {
    title: "Report Downloaded",
    description: "Report accessed by student & guardian",
    date: null,
  },
];

const competencies = [
  { label: "Analytical", value: 88, color: theme.colors.chart.blue },
  { label: "Creative", value: 72, color: theme.colors.chart.purple },
  { label: "Leadership", value: 65, color: theme.colors.chart.purple },
  { label: "Empathy", value: 91, color: theme.colors.chart.blue },
  { label: "Technical", value: 79, color: theme.colors.chart.purple },
];

const careerAreas = [
  "Healthcare & Medicine",
  "Biosciences Research",
  "Public Health Policy",
];

const insightSkeletons = [
  { title: "w-40", lines: ["w-full", "w-3/4"] },
  { title: "w-36", lines: ["w-full", "w-5/6", "w-2/3"] },
  { title: "w-44", lines: ["w-full", "w-4/5"] },
];

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

const InfoStat = ({ label, value }) => (
  <div
    className="rounded-xl p-3.5"
    style={{ backgroundColor: theme.colors.secondaryLight }}
  >
    <p className="text-xs" style={{ color: theme.colors.text.body }}>
      {label}
    </p>
    <p
      className="text-sm font-bold mt-0.5"
      style={{ color: theme.colors.text.heading }}
    >
      {value}
    </p>
  </div>
);

const TimelineStep = ({ step, isLast }) => (
  <div className="relative flex gap-3">
    <div className="flex flex-col items-center">
      <div
        className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <CheckCircle2 className="h-4 w-4" style={{ color: theme.colors.text.white }} />
      </div>
      {!isLast && (
        <div
          className="w-0.5 flex-1 min-h-[28px]"
          style={{ backgroundColor: theme.colors.primaryLight }}
        />
      )}
    </div>
    <div className="pb-6 min-w-0">
      <p className="text-sm font-semibold" style={{ color: theme.colors.text.heading }}>
        {step.title}
      </p>
      <p className="text-xs mt-0.5" style={{ color: theme.colors.text.body }}>
        {step.description}
      </p>
      {step.date && (
        <p className="text-xs font-medium mt-1" style={{ color: theme.colors.primary }}>
          {step.date}
        </p>
      )}
    </div>
  </div>
);

const CompetencyBar = ({ item }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-sm font-medium" style={{ color: theme.colors.text.heading }}>
        {item.label}
      </span>
      <span className="text-sm font-bold" style={{ color: theme.colors.text.heading }}>
        {item.value}
      </span>
    </div>
    <div
      className="h-2 rounded-full w-full overflow-hidden"
      style={{ backgroundColor: theme.colors.border }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${item.value}%`, backgroundColor: item.color }}
      />
    </div>
  </div>
);

const SkeletonBlock = ({ title, lines }) => (
  <div
    className="rounded-xl border p-4"
    style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background.card }}
  >
    <div className={`h-3 rounded-full animate-pulse bg-slate-200 ${title}`} />
    <div className="mt-3 space-y-2">
      {lines.map((w, i) => (
        <div key={i} className={`h-2.5 rounded-full animate-pulse bg-slate-100 ${w}`} />
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ViewStudentJourney = () => {
  return (
    // IMPORTANT: h-full, not h-screen. EnterpriseLayout's <main> already
    // owns the viewport height and hands this component a bounded box
    // (flex-1 min-h-0). h-full just fills whatever height the parent
    // gives it, matching the same contract Students.jsx relies on.
    <div className="h-full flex flex-col">
      {/* ---------------- Fixed top section: breadcrumb + header ---------------- */}
    {/* Header Card */}
<div className={`${theme.card.base} p-5 sm:p-6 mb-5`}>
  <div className="flex items-start justify-between gap-4 flex-wrap">
    <div className="flex items-center gap-3 min-w-0">
      <img
        src={student.avatar}
        alt={student.name}
        className="h-12 w-12 rounded-full object-cover shrink-0"
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1
            className="text-xl sm:text-2xl font-bold truncate"
            style={{ color: theme.colors.text.heading }}
          >
            {student.name}
          </h1>

          <span className={theme.badge.success}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-600 mr-1.5" />
            {student.status}
          </span>
        </div>

        <p
          className="text-sm mt-0.5 truncate"
          style={{ color: theme.colors.text.body }}
        >
          {student.grade} · {student.section} · {student.email}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 flex-wrap">
      <Button className={theme.button.secondary + " gap-2"}>
        <Mail className="h-4 w-4" />
        Notify Student
      </Button>

      <Button className={theme.button.primary + " gap-2"}>
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
    </div>
  </div>
</div>

      {/* ---------------- Row: fixed left sidebar + scrollable report ---------------- */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5">
        {/* -------------------- Left: Journey Timeline (fixed, doesn't scroll with report) -------------------- */}
        <div className="lg:w-[300px] shrink-0 flex flex-col gap-4 min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1">
          <div className={theme.card.base + " p-5"}>
            <h2 className="text-base font-semibold" style={{ color: theme.colors.text.heading }}>
              Journey Timeline
            </h2>
            <p className="text-xs mt-0.5 mb-5" style={{ color: theme.colors.text.body }}>
              Assessment lifecycle progress
            </p>

            <div>
              {timeline.map((step, i) => (
                <TimelineStep key={step.title} step={step} isLast={i === timeline.length - 1} />
              ))}
            </div>
            
          <div className="flex flex-col gap-3">
            <InfoStat label="Time to Complete" value={student.timeToComplete} />
            <InfoStat label="Learning Style" value={student.learningStyle} />
            <InfoStat label="Personality Type" value={student.personalityType} />
          </div>
          </div>

        </div>

        {/* -------------------- Right: Report (the only scrollable area) -------------------- */}
        <div className="flex-1 min-h-0 overflow-y-auto min-w-0">
          <div className="flex flex-col gap-4 pr-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm" style={{ color: theme.colors.text.body }}>
                Career Intelligence Report · Generated Sep 5, 2024
              </p>
              <div className="flex items-center gap-2">
                <Button className={theme.button.secondary + " gap-2 !px-4 !py-2"}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button className={theme.button.secondary + " gap-2 !px-4 !py-2"}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button className={theme.button.primary + " gap-2 !px-4 !py-2"}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Report card */}
            <div className={theme.card.base + " p-5 sm:p-8"}>
              {/* Report header */}
              <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Sparkles className="h-4.5 w-4.5" style={{ color: theme.colors.text.white }} />
                  </div>
                  <span
                    className="text-sm font-bold tracking-wide"
                    style={{ color: theme.colors.primary }}
                  >
                    TRUEMINDPATH
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: theme.colors.text.light }}>
                    Report ID
                  </p>
                  <p className="text-sm font-bold" style={{ color: theme.colors.text.heading }}>
                    TMP-001-2024
                  </p>
                </div>
              </div>

              <h2
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: theme.colors.text.heading }}
              >
                Career Intelligence Report
              </h2>
              <p className="text-sm mt-1" style={{ color: theme.colors.text.body }}>
                Comprehensive Career Pathway Analysis
              </p>

              {/* Student info grid */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl p-4 mt-5"
                style={{ backgroundColor: theme.colors.primaryLight }}
              >
                <div>
                  <p className="text-xs" style={{ color: theme.colors.primary }}>
                    Student
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: theme.colors.text.heading }}>
                    {student.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: theme.colors.primary }}>
                    Grade
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: theme.colors.text.heading }}>
                    {student.grade} · {student.section}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: theme.colors.primary }}>
                    School
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: theme.colors.text.heading }}>
                    Westlake Academy
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: theme.colors.primary }}>
                    Assessment Date
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: theme.colors.text.heading }}>
                    Sep 3, 2024
                  </p>
                </div>
              </div>

              {/* Recommended Career Areas */}
              <div className="mt-7">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4.5 w-4.5" style={{ color: theme.colors.primary }} />
                  <h3 className="text-base font-semibold" style={{ color: theme.colors.text.heading }}>
                    Recommended Career Areas
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {careerAreas.map((area, i) => (
                    <span
                      key={area}
                      className={`text-sm font-medium px-4 py-2 rounded-lg border ${
                        i === 0 ? "text-white" : "bg-white"
                      }`}
                      style={
                        i === 0
                          ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                          : { borderColor: theme.colors.border, color: theme.colors.text.heading }
                      }
                    >
                      {i + 1}. {area}
                    </span>
                  ))}
                </div>

                <p className="text-sm leading-relaxed" style={{ color: theme.colors.text.body }}>
                  Based on your responses,{" "}
                  <span className="font-semibold" style={{ color: theme.colors.text.heading }}>
                    Healthcare &amp; Medicine
                  </span>{" "}
                  emerges as your strongest pathway alignment. This recommendation is informed by your
                  cognitive style profile, values assessment, and interest inventory responses.
                </p>
              </div>

              {/* Competency Profile */}
              <div className="mt-7">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4.5 w-4.5" style={{ color: theme.colors.primary }} />
                  <h3 className="text-base font-semibold" style={{ color: theme.colors.text.heading }}>
                    Competency Profile
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {competencies.map((item) => (
                    <CompetencyBar key={item.label} item={item} />
                  ))}
                </div>
              </div>

              {/* Key Insights & Recommendations (locked / skeleton preview) */}
              <div className="mt-7">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4.5 w-4.5" style={{ color: theme.colors.primary }} />
                  <h3 className="text-base font-semibold" style={{ color: theme.colors.text.heading }}>
                    Key Insights &amp; Recommendations
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {insightSkeletons.map((s, i) => (
                    <SkeletonBlock key={i} title={s.title} lines={s.lines} />
                  ))}
                </div>

                <p
                  className="text-xs italic text-center mt-4"
                  style={{ color: theme.colors.text.light }}
                >
                  Full insights available in the downloaded PDF report
                </p>
              </div>

              {/* CTA banner */}
              <div
                className="mt-6 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <div>
                  <p className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text.white }}>
                    Full 24-page Career Report Available
                  </p>
                  <p className="text-xs mt-0.5 opacity-90" style={{ color: theme.colors.text.white }}>
                    Includes interview prep, university pathways &amp; skill roadmap
                  </p>
                </div>
                <Button className="bg-white hover:bg-slate-50 text-slate-900 rounded-xl px-5 py-2.5 font-medium transition-all gap-2 shrink-0">
                  <Download className="h-4 w-4" />
                  Download Full PDF
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between gap-3 flex-wrap text-xs pb-2"
              style={{ color: theme.colors.text.light }}
            >
              <span>© 2025 TrueMindPath Career Intelligence Platform</span>
              <span>Page 1 of 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentJourney;