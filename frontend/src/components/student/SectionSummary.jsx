import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, Check, BarChart3, ChevronRight, Minus } from "lucide-react";
import theme from "../../theme/theme";
import { TEST_CONFIGS, getTestConfig, getSectionOrder, getSection } from "./testData";
import { markSectionComplete, areAllTestsComplete, getIncompleteTestTypes, getCompletedSections } from "./testProgress";
import Skeleton from "../ui/Skeleton";
import StudentLayout, { TopBar } from "../layouts/StudentLayout";

const LOADING_STEPS = [
  "Scoring response patterns",
  "Calibrating adaptive model",
  "Generating competency profile",
  "Compiling section report",
];

const SectionSummary = () => {
  const { testType = "aptitude", sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const config = getTestConfig(testType);
  const sectionOrder = getSectionOrder(testType);
  const section = getSection(testType, sectionId || sectionOrder[0]);

  const answers = location.state?.answers || {};
  const totalQuestions =
    location.state?.totalQuestions ||
    (section && Array.isArray(section.questions)
      ? section.questions.length
      : typeof section.totalQuestions === "number"
      ? section.totalQuestions
      : Array.isArray(section.groups)
      ? section.groups.reduce((s, g) => s + (Array.isArray(g.items) ? g.items.length : 0), 0)
      : 0);

  const completedSections = getCompletedSections(testType);
  const sectionIndex = Math.max(0, sectionOrder.indexOf(section.id));
  const currentSectionMarkedComplete = completedSections.includes(section.id);
  const effectiveCompletedSections = currentSectionMarkedComplete
    ? completedSections
    : [...completedSections, section.id];

  const nextSectionId = sectionOrder.find((id) => !effectiveCompletedSections.includes(id));
  const nextSection = nextSectionId ? getSection(testType, nextSectionId) : null;
  const nextSectionIndex = nextSection ? sectionOrder.indexOf(nextSectionId) : -1;

  // Page-shell skeleton — shown briefly before the intentional
  // "Analysing Responses" phase kicks in.
  const [pageLoading, setPageLoading] = useState(true);

  const [phase, setPhase] = useState("loading"); // loading | complete
  const [stepIndex, setStepIndex] = useState(-1);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Reset the loading sequence whenever a new section's results come in.
  useEffect(() => {
    setPhase("loading");
    setStepIndex(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType, section.id]);

  // Step through the loading checklist, then reveal the summary
  useEffect(() => {
    if (phase !== "loading") return;
    if (stepIndex >= LOADING_STEPS.length - 1) {
      const t = setTimeout(() => setPhase("complete"), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStepIndex((i) => i + 1), 700);
    return () => clearTimeout(t);
  }, [phase, stepIndex]);

  useEffect(() => {
    if (phase === "complete") {
      markSectionComplete(testType, section.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const responseRows = useMemo(() => {
    return Array.from({ length: totalQuestions }, (_, i) => {
      const isAnswered = answers[i] !== undefined;
      const seconds = isAnswered ? Math.max(1, Math.round(Math.random() * 30)) : 1;
      return {
        index: i,
        answered: isAnswered,
        seconds,
        prompt: `Question ${i + 1} response preview goes here...`,
      };
    });
  }, [answers, totalQuestions]);

  const answeredCount = responseRows.filter((r) => r.answered).length;
  const markedCount = 0;
  const totalSeconds = responseRows.reduce((sum, r) => sum + (r.answered ? r.seconds : 0), 0);
  const avgSeconds = answeredCount ? Math.round(totalSeconds / answeredCount) : 0;
  const maxSeconds = Math.max(...responseRows.map((r) => r.seconds), 1);

  const formatClock = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isLastSectionOfThisTest = !nextSectionId;
  const allTestsDone = isLastSectionOfThisTest ? areAllTestsComplete() : false;
  const remainingTestTypes = isLastSectionOfThisTest
    ? getIncompleteTestTypes().filter((t) => t !== testType)
    : [];
  const nextTestType = remainingTestTypes[0];
  const nextTestConfig = nextTestType ? TEST_CONFIGS[nextTestType] : null;

  const handleContinue = () => {
    if (nextSectionId) {
      navigate(`/test/${testType}/${nextSectionId}/start`);
      return;
    }

    if (allTestsDone) {
      navigate(`/test/reports`, {
        state: {
          testType,
          reportId: `TMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          score: Math.round((answeredCount / totalQuestions) * 100),
          generatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    navigate("/test-selection");
  };

  return (
    <StudentLayout
      topBar={
        <TopBar
          maxWidth="max-w-5xl"
          right={
            pageLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="text-sm sm:text-base" style={{ color: theme.colors.text.light }}>
                {phase === "loading" ? "Processing Results" : section.title}
              </span>
            )
          }
        />
      }
    >
      {pageLoading ? (
        /* ---------------- Page-shell skeleton (pre-phase) ---------------- */
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
          <div className="w-full max-w-md flex flex-col items-center text-center">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-6 sm:mb-8" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-72 mb-7 sm:mb-8" />
            <div className={`w-full ${theme.radius.lg} bg-white border border-slate-100 px-5 sm:px-6 py-5 sm:py-6 flex flex-col gap-4 sm:gap-5`}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            <Skeleton className="h-3 w-40 mt-6 sm:mt-7" />
          </div>
        </main>
      ) : phase === "loading" ? (
        /* ---------------- Phase 1: Analysing Responses ---------------- */
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
          <div className="w-full max-w-md flex flex-col items-center text-center">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 ${theme.radius.full} flex items-center justify-center mb-6 sm:mb-8`}
              style={{ backgroundColor: "#EFF6FF" }}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 ${theme.radius.full} flex items-center justify-center`}
                style={{ backgroundColor: theme.colors.primaryLight }}
              >
                <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" style={{ color: theme.colors.text.white }} />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: theme.colors.text.heading }}>
              Analysing Responses
              <span style={{ color: theme.colors.primary }}>...</span>
            </h1>
            <p className="text-sm sm:text-base mb-7 sm:mb-8" style={{ color: theme.colors.text.body }}>
              Our adaptive engine is processing your {testType === "personality" ? "personality" : "cognitive"} profile.
            </p>

            <div className={`w-full ${theme.radius.lg} bg-white border border-slate-100 px-5 sm:px-6 py-5 sm:py-6 flex flex-col gap-4 sm:gap-5`}>
              {LOADING_STEPS.map((label, i) => {
                const isDone = i <= stepIndex;
                return (
                  <div key={label} className="flex items-center gap-3 text-left">
                    <span
                      className={`shrink-0 w-6 h-6 ${theme.radius.full} flex items-center justify-center transition-colors`}
                      style={{ backgroundColor: isDone ? theme.colors.primary : "#E2E8F0" }}
                    >
                      {isDone && <Check className="w-3.5 h-3.5" style={{ color: theme.colors.text.white }} />}
                    </span>
                    <span
                      className="text-sm sm:text-base transition-colors"
                      style={{ color: isDone ? theme.colors.text.heading : theme.colors.text.light }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs sm:text-sm mt-6 sm:mt-7" style={{ color: theme.colors.text.light }}>
              This usually takes 10–15 seconds.
            </p>
          </div>
        </main>
      ) : (
        /* ---------------- Phase 2: Section Complete ---------------- */
        <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto">

            <div className="text-center mb-7 sm:mb-9 flex flex-col items-center">
              <span
                className={`w-11 h-11 sm:w-12 sm:h-12 ${theme.radius.full} flex items-center justify-center mb-3 sm:mb-4`}
                style={{ backgroundColor: theme.colors.primary }}
              >
                <Check className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.text.white }} strokeWidth={2.5} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2" style={{ color: theme.colors.text.heading }}>
                Section Complete
              </h1>
              <p className="text-sm sm:text-base" style={{ color: theme.colors.text.body }}>
                {section.title} — {section.subtitle}
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[
                { label: "Answered", value: `${answeredCount}/${totalQuestions}`, color: theme.colors.primary },
                { label: "Marked", value: markedCount, color: "#CA8A04" },
                { label: "Avg. Time/Q", value: `${avgSeconds}s`, color: theme.colors.text.heading },
                { label: "Time Used", value: formatClock(totalSeconds), color: theme.colors.text.heading },
              ].map(({ label, value, color }) => (
                <div key={label} className={`${theme.radius.lg} bg-white border border-slate-100 px-4 sm:px-5 py-4 sm:py-5 text-center`}>
                  <div className="text-xl sm:text-2xl font-extrabold" style={{ color }}>
                    {value}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium tracking-wide uppercase mt-1" style={{ color: theme.colors.text.light }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Response summary */}
            <div className={`${theme.radius.lg} bg-white border border-slate-100 overflow-hidden mb-6 sm:mb-8`}>
              <div className="flex items-center gap-2 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: theme.colors.primary }} />
                <h2 className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text.heading }}>
                  Response Summary
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {responseRows.map((row) => (
                  <div key={row.index} className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 sm:py-4">
                    <span className="text-xs sm:text-sm font-semibold w-7 shrink-0" style={{ color: theme.colors.text.light }}>
                      Q{row.index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm truncate mb-1.5" style={{ color: theme.colors.text.heading }}>
                        {row.prompt}
                      </p>
                      <div className="h-1 sm:h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(4, (row.seconds / maxSeconds) * 100)}%`,
                            backgroundColor: theme.colors.primary,
                          }}
                        />
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm shrink-0 w-10 sm:w-12 text-right" style={{ color: theme.colors.text.light }}>
                      {row.seconds}s
                    </span>

                    <span
                      className={`shrink-0 w-5 h-5 ${theme.radius.full} flex items-center justify-center`}
                      style={{ backgroundColor: row.answered ? "#EFF6FF" : "#F1F5F9" }}
                    >
                      {row.answered ? (
                        <Check className="w-3 h-3" style={{ color: theme.colors.primary }} />
                      ) : (
                        <Minus className="w-3 h-3" style={{ color: theme.colors.text.light }} />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next section / next test / report */}
            <div className={`${theme.radius.lg} bg-white border border-slate-100 px-5 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
              <div className="flex items-start gap-3">
                {isLastSectionOfThisTest && (
                  <span
                    className={`shrink-0 w-6 h-6 mt-0.5 ${theme.radius.full} flex items-center justify-center`}
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: theme.colors.text.white }} />
                  </span>
                )}
                <div>
                  <p className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text.heading }}>
                    {nextSection
                      ? `Next: ${nextSection.title}`
                      : allTestsDone
                        ? "All tests complete"
                        : `${config.label} complete`}
                  </p>
                  <p className="text-xs sm:text-sm mt-0.5" style={{ color: theme.colors.text.light }}>
                    {nextSection
                      ? `Section ${nextSectionIndex + 1} of ${sectionOrder.length} · Estimated ${Math.round(nextSection.timeLimitSeconds / 60)} minutes`
                      : allTestsDone
                        ? "You're all done — view your full results."
                        : `Great work! Complete ${nextTestConfig ? nextTestConfig.label : "the remaining test"} to unlock your report.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleContinue}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 py-3 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
              >
                {nextSection
                  ? "Continue Assessment"
                  : allTestsDone
                    ? "View Results"
                    : `Start ${nextTestConfig ? nextTestConfig.label : "Next Test"}`}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      )}
    </StudentLayout>
  );
};

export default SectionSummary;


// import React, { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import { Compass, Loader2, Check, BarChart3, ChevronRight, Minus } from "lucide-react";
// import theme from "../../theme/theme";
// import { TEST_CONFIGS, getTestConfig, getSectionOrder, getSection } from "./testData";
// import { markSectionComplete, areAllTestsComplete, getIncompleteTestTypes } from "./testProgress";

// /**
//  * TrueMindPath - Section Summary (generic)
//  * Phase 1: brief "Analysing Responses" loading state with a step checklist.
//  * Phase 2: "Section Complete" results — stat cards, a per-question response
//  *          summary list, and a "Next section" continue card.
//  *
//  * Reusable across test types: reads `testType` + `sectionId` from the route
//  * and pulls titles/estimates/section order from testData.js. Reads
//  * `answers` / `totalQuestions` passed via navigate(..., { state }) from
//  * AssessmentRunner, same as before.
//  */

// const LOADING_STEPS = [
//     "Scoring response patterns",
//     "Calibrating adaptive model",
//     "Generating competency profile",
//     "Compiling section report",
// ];

// const SectionSummary = () => {
//     const { testType = "aptitude", sectionId } = useParams();
//     const navigate = useNavigate();
//     const location = useLocation();

//     const config = getTestConfig(testType);
//     const sectionOrder = getSectionOrder(testType);
//     const section = getSection(testType, sectionId || sectionOrder[0]);

//     const answers = location.state?.answers || {};
//     const totalQuestions = location.state?.totalQuestions || section.questions.length;

//     const sectionIndex = Math.max(0, sectionOrder.indexOf(section.id));
//     const nextSectionId = sectionOrder[sectionIndex + 1];
//     const nextSection = nextSectionId ? getSection(testType, nextSectionId) : null;

//     const [phase, setPhase] = useState("loading"); // loading | complete
//     const [stepIndex, setStepIndex] = useState(-1);

//     useEffect(() => {
//         const link = document.createElement("link");
//         link.rel = "stylesheet";
//         link.href =
//             "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
//         document.head.appendChild(link);
//         return () => document.head.removeChild(link);
//     }, []);

//     // Reset the loading sequence whenever a new section's results come in.
//     useEffect(() => {
//         setPhase("loading");
//         setStepIndex(-1);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [testType, section.id]);

//     // Step through the loading checklist, then reveal the summary
//     useEffect(() => {
//         if (phase !== "loading") return;
//         if (stepIndex >= LOADING_STEPS.length - 1) {
//             const t = setTimeout(() => setPhase("complete"), 500);
//             return () => clearTimeout(t);
//         }
//         const t = setTimeout(() => setStepIndex((i) => i + 1), 700);
//         return () => clearTimeout(t);
//     }, [phase, stepIndex]);

//     // Persist completion the moment results are revealed, so
//     // TestInstructions / TestSelection can show a tick for this section,
//     // and so the report page knows once every test is fully done.
//     useEffect(() => {
//         if (phase === "complete") {
//             markSectionComplete(testType, section.id);
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [phase]);

//     // Mock per-question response data (replace with real tracked timings/correctness)
//     const responseRows = useMemo(() => {
//         return Array.from({ length: totalQuestions }, (_, i) => {
//             const isAnswered = answers[i] !== undefined;
//             const seconds = isAnswered ? Math.max(1, Math.round(Math.random() * 30)) : 1;
//             return {
//                 index: i,
//                 answered: isAnswered,
//                 seconds,
//                 prompt: `Question ${i + 1} response preview goes here...`,
//             };
//         });
//     }, [answers, totalQuestions]);

//     const answeredCount = responseRows.filter((r) => r.answered).length;
//     const markedCount = 0; // wire up from runner's `marked` set via route state when available
//     const totalSeconds = responseRows.reduce((sum, r) => sum + (r.answered ? r.seconds : 0), 0);
//     const avgSeconds = answeredCount ? Math.round(totalSeconds / answeredCount) : 0;
//     const maxSeconds = Math.max(...responseRows.map((r) => r.seconds), 1);

//     const formatClock = (totalSec) => {
//         const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
//         const s = Math.floor(totalSec % 60).toString().padStart(2, "0");
//         return `${m}:${s}`;
//     };

//     // Once this was the last section of *this* test, the report is only
//     // shown if every other test (e.g. Personality, if this was Aptitude)
//     // has also been fully completed. Otherwise we send the user to pick up
//     // the remaining test instead of straight to the report.
//     const isLastSectionOfThisTest = !nextSectionId;
//     const allTestsDone = isLastSectionOfThisTest ? areAllTestsComplete() : false;
//     const remainingTestTypes = isLastSectionOfThisTest
//         ? getIncompleteTestTypes().filter((t) => t !== testType)
//         : [];
//     const nextTestType = remainingTestTypes[0];
//     const nextTestConfig = nextTestType ? TEST_CONFIGS[nextTestType] : null;

//     const handleContinue = () => {
//         if (nextSectionId) {
//             navigate(`/test/${testType}/${nextSectionId}/start`);
//             return;
//         }

//         if (allTestsDone) {
//             navigate(`/test/reports`, {
//                 state: {
//                     testType,
//                     reportId: `TMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
//                     score: Math.round((answeredCount / totalQuestions) * 100),
//                     generatedAt: new Date().toISOString(),
//                 },
//             });
//             return;
//         }

//         // This test is done, but at least one other test is still pending —
//         // send the user to start it instead of generating the report yet.

//         navigate("/test-selection");
        
//         // if (nextTestConfig) {
//         //     navigate(nextTestConfig.landingPath);
//         // } else {
//         //     navigate("/test");
//         // }
//     };

//     return (
//         <div
//             className="min-h-screen w-full flex flex-col"
//             style={{ fontFamily: theme.font.family, backgroundColor: "#F8FAFC" }}
//         >
//             {/* Top bar */}
//             <header className="w-full border-b border-slate-200 bg-white">
//                 <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
//                     <div className="flex items-center gap-2 sm:gap-3">
//                         <div
//                             className={`w-8 h-8 sm:w-9 sm:h-9 ${theme.radius.full} flex items-center justify-center`}
//                             style={{ backgroundColor: theme.colors.primary }}
//                         >
//                             <Compass className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: theme.colors.text.white }} strokeWidth={2.2} />
//                         </div>
//                         <span className="text-base sm:text-lg font-bold tracking-tight" style={{ color: theme.colors.text.heading }}>
//                             TrueMindPath
//                         </span>
//                     </div>
//                     <span className="text-sm sm:text-base" style={{ color: theme.colors.text.light }}>
//                         {phase === "loading" ? "Processing Results" : section.title}
//                     </span>
//                 </div>
//             </header>

//             {phase === "loading" ? (
//                 /* ---------------- Phase 1: Analysing Responses ---------------- */
//                 <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
//                     <div className="w-full max-w-md flex flex-col items-center text-center">
//                         <div
//                             className={`w-20 h-20 sm:w-24 sm:h-24 ${theme.radius.full} flex items-center justify-center mb-6 sm:mb-8`}
//                             style={{ backgroundColor: "#EFF6FF" }}
//                         >
//                             <div
//                                 className={`w-12 h-12 sm:w-14 sm:h-14 ${theme.radius.full} flex items-center justify-center`}
//                                 style={{ backgroundColor: theme.colors.primaryLight }}
//                             >
//                                 <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" style={{ color: theme.colors.text.white }} />
//                             </div>
//                         </div>

//                         <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: theme.colors.text.heading }}>
//                             Analysing Responses
//                             <span style={{ color: theme.colors.primary }}>...</span>
//                         </h1>
//                         <p className="text-sm sm:text-base mb-7 sm:mb-8" style={{ color: theme.colors.text.body }}>
//                             Our adaptive engine is processing your {testType === "personality" ? "personality" : "cognitive"} profile.
//                         </p>

//                         <div className={`w-full ${theme.radius.lg} bg-white border border-slate-100 px-5 sm:px-6 py-5 sm:py-6 flex flex-col gap-4 sm:gap-5`}>
//                             {LOADING_STEPS.map((label, i) => {
//                                 const isDone = i <= stepIndex;
//                                 return (
//                                     <div key={label} className="flex items-center gap-3 text-left">
//                                         <span
//                                             className={`shrink-0 w-6 h-6 ${theme.radius.full} flex items-center justify-center transition-colors`}
//                                             style={{ backgroundColor: isDone ? theme.colors.primary : "#E2E8F0" }}
//                                         >
//                                             {isDone && <Check className="w-3.5 h-3.5" style={{ color: theme.colors.text.white }} />}
//                                         </span>
//                                         <span
//                                             className="text-sm sm:text-base transition-colors"
//                                             style={{ color: isDone ? theme.colors.text.heading : theme.colors.text.light }}
//                                         >
//                                             {label}
//                                         </span>
//                                     </div>
//                                 );
//                             })}
//                         </div>

//                         <p className="text-xs sm:text-sm mt-6 sm:mt-7" style={{ color: theme.colors.text.light }}>
//                             This usually takes 10–15 seconds.
//                         </p>
//                     </div>
//                 </main>
//             ) : (
//                 /* ---------------- Phase 2: Section Complete ---------------- */
//                 <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
//                     <div className="max-w-3xl mx-auto">

//                         <div className="text-center mb-7 sm:mb-9 flex flex-col items-center">
//                             <span
//                                 className={`w-11 h-11 sm:w-12 sm:h-12 ${theme.radius.full} flex items-center justify-center mb-3 sm:mb-4`}
//                                 style={{ backgroundColor: theme.colors.primary }}
//                             >
//                                 <Check className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.text.white }} strokeWidth={2.5} />
//                             </span>
//                             <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2" style={{ color: theme.colors.text.heading }}>
//                                 Section Complete
//                             </h1>
//                             <p className="text-sm sm:text-base" style={{ color: theme.colors.text.body }}>
//                                 {section.title} — {section.subtitle}
//                             </p>
//                         </div>

//                         {/* Stat cards */}
//                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
//                             {[
//                                 { label: "Answered", value: `${answeredCount}/${totalQuestions}`, color: theme.colors.primary },
//                                 { label: "Marked", value: markedCount, color: "#CA8A04" },
//                                 { label: "Avg. Time/Q", value: `${avgSeconds}s`, color: theme.colors.text.heading },
//                                 { label: "Time Used", value: formatClock(totalSeconds), color: theme.colors.text.heading },
//                             ].map(({ label, value, color }) => (
//                                 <div key={label} className={`${theme.radius.lg} bg-white border border-slate-100 px-4 sm:px-5 py-4 sm:py-5 text-center`}>
//                                     <div className="text-xl sm:text-2xl font-extrabold" style={{ color }}>
//                                         {value}
//                                     </div>
//                                     <div className="text-[10px] sm:text-xs font-medium tracking-wide uppercase mt-1" style={{ color: theme.colors.text.light }}>
//                                         {label}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         {/* Response summary */}
//                         <div className={`${theme.radius.lg} bg-white border border-slate-100 overflow-hidden mb-6 sm:mb-8`}>
//                             <div className="flex items-center gap-2 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
//                                 <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: theme.colors.primary }} />
//                                 <h2 className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text.heading }}>
//                                     Response Summary
//                                 </h2>
//                             </div>

//                             <div className="divide-y divide-slate-100">
//                                 {responseRows.map((row) => (
//                                     <div key={row.index} className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 sm:py-4">
//                                         <span className="text-xs sm:text-sm font-semibold w-7 shrink-0" style={{ color: theme.colors.text.light }}>
//                                             Q{row.index + 1}
//                                         </span>

//                                         <div className="flex-1 min-w-0">
//                                             <p className="text-xs sm:text-sm truncate mb-1.5" style={{ color: theme.colors.text.heading }}>
//                                                 {row.prompt}
//                                             </p>
//                                             <div className="h-1 sm:h-1.5 rounded-full bg-slate-100 overflow-hidden">
//                                                 <div
//                                                     className="h-full rounded-full"
//                                                     style={{
//                                                         width: `${Math.max(4, (row.seconds / maxSeconds) * 100)}%`,
//                                                         backgroundColor: theme.colors.primary,
//                                                     }}
//                                                 />
//                                             </div>
//                                         </div>

//                                         <span className="text-xs sm:text-sm shrink-0 w-10 sm:w-12 text-right" style={{ color: theme.colors.text.light }}>
//                                             {row.seconds}s
//                                         </span>

//                                         <span
//                                             className={`shrink-0 w-5 h-5 ${theme.radius.full} flex items-center justify-center`}
//                                             style={{ backgroundColor: row.answered ? "#EFF6FF" : "#F1F5F9" }}
//                                         >
//                                             {row.answered ? (
//                                                 <Check className="w-3 h-3" style={{ color: theme.colors.primary }} />
//                                             ) : (
//                                                 <Minus className="w-3 h-3" style={{ color: theme.colors.text.light }} />
//                                             )}
//                                         </span>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>

//                         {/* Next section / next test / report — three possible states */}
//                         <div className={`${theme.radius.lg} bg-white border border-slate-100 px-5 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
//                             <div className="flex items-start gap-3">
//                                 {isLastSectionOfThisTest && (
//                                     <span
//                                         className={`shrink-0 w-6 h-6 mt-0.5 ${theme.radius.full} flex items-center justify-center`}
//                                         style={{ backgroundColor: theme.colors.primary }}
//                                     >
//                                         <Check className="w-3.5 h-3.5" style={{ color: theme.colors.text.white }} />
//                                     </span>
//                                 )}
//                                 <div>
//                                     <p className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text.heading }}>
//                                         {nextSection
//                                             ? `Next: ${nextSection.title}`
//                                             : allTestsDone
//                                                 ? "All tests complete"
//                                                 : `${config.label} complete`}
//                                     </p>
//                                     <p className="text-xs sm:text-sm mt-0.5" style={{ color: theme.colors.text.light }}>
//                                         {nextSection
//                                             ? `Section ${sectionIndex + 2} of ${sectionOrder.length} · Estimated ${Math.round(nextSection.timeLimitSeconds / 60)} minutes`
//                                             : allTestsDone
//                                                 ? "You're all done — view your full results."
//                                                 : `Great work! Complete ${nextTestConfig ? nextTestConfig.label : "the remaining test"} to unlock your report.`}
//                                     </p>
//                                 </div>
//                             </div>
//                             <button
//                                 type="button"
//                                 onClick={handleContinue}
//                                 className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 py-3 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
//                             >
//                                 {nextSection
//                                     ? "Continue Assessment"
//                                     : allTestsDone
//                                         ? "View Results"
//                                         : `Start ${nextTestConfig ? nextTestConfig.label : "Next Test"}`}
//                                 <ChevronRight className="w-4 h-4" />
//                             </button>
//                         </div>
//                     </div>
//                 </main>
//             )}
//         </div>
//     );
// };

// export default SectionSummary;