import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, FileText } from "lucide-react";
import theme from "../../theme/theme";
import { SECTION_META, DEFAULT_SECTION_ICON, SUBSECTION_TO_SECTION } from "./Testdata";
import { isTestComplete } from "./Testprogress";
import { UseTestSections } from "../hooks/UseTestSubsections";
import Skeleton from "../ui/skeleton";
import StudentLayout, { TopBar } from "../layouts/StudentLayout";

// Grid columns scale with how many tests exist, instead of being
// hardcoded for 2 — 1 test stays single-column, 2 gets a 2-up grid, 3+
// gets a 3-up grid on larger screens.
const gridColsClass = (count) => {
  if (count <= 1) return "grid-cols-1 max-w-md";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-3xl";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl";
};

// Reverse of SUBSECTION_TO_SECTION: section code -> every subsection
// code that belongs to it. Built once, not per-render — SUBSECTION_TO_SECTION
// is a static import, not derived from props/state.
const SECTION_TO_SUBSECTIONS = Object.entries(SUBSECTION_TO_SECTION).reduce(
  (acc, [subsectionCode, sectionCode]) => {
    (acc[sectionCode] ||= []).push(subsectionCode);
    return acc;
  },
  {}
);

const TestSelection = ({ userName = "" }) => {
  const navigate = useNavigate();

  // There is no "get sections" API anymore — this derives section cards
  // from the same flat subsections fetch every other page uses, grouped
  // locally via SUBSECTION_TO_SECTION in testData.js.
  const {
    sections,
    loading: sectionsLoading,
    error: sectionsError,
  } = UseTestSections();

  const [loading, setLoading] = useState(true);
  const [progressVersion, setProgressVersion] = useState(0);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Re-derive completion whenever the tab regains focus — e.g. the
  // student finishes a section, the summary page navigates them back
  // here, or they switch tabs and come back. `isTestComplete` reads
  // straight from autosave/local progress storage, so this just needs
  // to force a re-render; `progressVersion` (used as StudentLayout's
  // key below) does that.
  useEffect(() => {
    const onFocus = () => setProgressVersion((v) => v + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Overall loading = the fake initial-paint delay AND the real API call.
  const isLoading = loading || sectionsLoading;

  // Build the card list from the derived section list. Name/icon/
  // description all come from the local SECTION_META (keyed by our own
  // local section code) — nothing here comes from the backend anymore
  // except which subsections exist at all.
  //
  // `completed` is derived locally: a section counts as done once every
  // one of its subsections has been submitted, per isTestComplete's own
  // progress-tracking storage (the same check AssessmentRunner uses to
  // decide whether to bounce a student out of an already-finished
  // section). Recomputed every render — including on the focus-driven
  // re-render above — so it stays in sync as the student progresses.
  const tests = useMemo(
    () =>
      sections.map(({ code, name }) => {
        const meta = SECTION_META[code] || {};
        const subsectionCodes = SECTION_TO_SUBSECTIONS[code] || [];
        const completed =
          subsectionCodes.length > 0 && isTestComplete(code, subsectionCodes);
        return {
          code,
          title: meta.name || name || code, // ✅ static name wins
          description: meta.description || "Complete this assessment to continue.",
          icon: meta.icon || DEFAULT_SECTION_ICON,
          path: `/test/${code}`,
          completed,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, progressVersion]
  );

  const testCount = tests.length;
  const allDone = tests.length > 0 && tests.every((t) => t.completed);

  return (
    <StudentLayout
      key={progressVersion}
      className={`bg-gradient-to-br ${theme.colors.background.page}`}
      style={{ backgroundColor: "transparent" }}
      topBar={<TopBar maxWidth="max-w-7xl" />}
      footer={
        <footer className="w-full py-5 sm:py-6">
          <p className="text-xs sm:text-sm text-center" style={{ color: theme.colors.text.light }}>
            © 2026 TrueMindPath. All rights reserved.
          </p>
        </footer>
      }
    >
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <div className="w-full max-w-5xl flex flex-col items-center text-center">

          {isLoading ? (
            <Skeleton className="h-6 w-24 rounded-full mb-6" />
          ) : (
            <div className={`w-fit ${theme.badge.blue} mb-6`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
              Verified
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-10 sm:h-12 w-2/3 mb-3" />
          ) : (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ color: theme.colors.text.heading }}>
              {userName ? `All the best, ${userName}!` : "All the best, for the test!"}
            </h1>
          )}

          {isLoading ? (
            <Skeleton className="h-5 w-1/2 mb-8 sm:mb-10" />
          ) : (
            <p className="text-base sm:text-lg mb-8 sm:mb-10 max-w-xl" style={{ color: theme.colors.text.body }}>
              Pick a test below to get started. You can take them in any order.
            </p>
          )}

          {/* Report-ready banner */}
          {!isLoading && allDone && (
            <button
              type="button"
              onClick={() => navigate("/test/reports")}
              className={`w-full max-w-3xl flex items-center justify-between gap-3 ${theme.radius.lg} px-5 sm:px-6 py-4 sm:py-5 mb-8 sm:mb-10 border transition-colors hover:-translate-y-0.5`}
              style={{ backgroundColor: "#EFF6FF", borderColor: theme.colors.primary }}
            >
              <span className="flex items-center gap-3 text-left">
                <span
                  className={`shrink-0 w-9 h-9 ${theme.radius.full} flex items-center justify-center`}
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <FileText className="w-4 h-4" style={{ color: theme.colors.text.white }} />
                </span>
                <span>
                  <span className="block text-sm sm:text-base font-bold" style={{ color: theme.colors.text.heading }}>
                    All tests complete
                  </span>
                  <span className="block text-xs sm:text-sm" style={{ color: theme.colors.text.light }}>
                    Your career intelligence report is ready to view.
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold shrink-0" style={{ color: theme.colors.primary }}>
                View Report
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          )}

          {isLoading ? (
            <Skeleton className="h-6 w-48 mb-6 sm:mb-8" />
          ) : (
            <h2 className="text-lg sm:text-xl font-semibold mb-6 sm:mb-8" style={{ color: theme.colors.primary }}>
              Start with any test
            </h2>
          )}

          {/* Test cards — column count scales with how many tests exist */}
          <div className={`w-full grid gap-4 sm:gap-6 ${gridColsClass(isLoading ? testCount || 2 : testCount)}`}>
            {isLoading ? (
              Array.from({ length: testCount || 2 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-full flex flex-col items-center text-center gap-3 sm:gap-4 ${theme.radius.xl} bg-white border px-6 sm:px-8 py-8 sm:py-10`}
                  style={{ borderColor: theme.colors.border }}
                >
                  <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-20 mt-1" />
                </div>
              ))
            ) : sectionsError ? (
              <p className="col-span-full text-sm" style={{ color: theme.colors.text.light }}>
                Couldn't load your tests right now. Please refresh the page.
              </p>
            ) : testCount === 0 ? (
              <p className="col-span-full text-sm" style={{ color: theme.colors.text.light }}>
                No tests are available yet.
              </p>
            ) : (
              tests.map(({ code, title, description, icon: Icon, path, completed }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    if (completed) return;

                    // No numeric section_id from the backend anymore —
                    // only the local code + display name are stored.
                    localStorage.setItem(
                      "selectedSection",
                      JSON.stringify({ code, name: title })
                    );

                    navigate(path);
                  }}
                  disabled={completed}
                  aria-disabled={completed}
                  className={`group relative w-full flex flex-col items-center text-center gap-3 sm:gap-4 ${theme.radius.xl} bg-white border px-6 sm:px-8 py-8 sm:py-10 transition-all ${completed ? "" : "hover:border-transparent hover:-translate-y-0.5"} ${theme.shadow.card}`}
                  style={{
                    "--tw-shadow-color": theme.colors.shadow,
                    borderColor: completed ? "#86EFAC" : theme.colors.border,
                    cursor: completed ? "default" : "pointer",
                    opacity: completed ? 0.9 : 1,
                  }}
                >
                  {completed && (
                    <span
                      className={`absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-7 sm:h-7 ${theme.radius.full} flex items-center justify-center`}
                      style={{ backgroundColor: "#16A34A" }}
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "#FFFFFF" }} strokeWidth={3} />
                    </span>
                  )}

                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 ${theme.radius.lg} flex items-center justify-center transition-colors`}
                    style={{ backgroundColor: theme.colors.secondary }}
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: theme.colors.primary }} />
                  </div>

                  <span className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: theme.colors.text.heading }}>
                    {title}
                  </span>

                  <span className="text-sm leading-relaxed" style={{ color: theme.colors.text.light }}>
                    {description}
                  </span>

                  <span
                    className={`flex items-center gap-1.5 text-sm font-semibold mt-1 ${completed ? "" : "transition-transform group-hover:translate-x-1"}`}
                    style={{ color: completed ? "#16A34A" : theme.colors.primary }}
                  >
                    {completed ? "Completed" : "Start test"}
                    {!completed && <ArrowRight className="w-4 h-4" />}
                  </span>
                </button>
              ))
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-3 w-64 mt-10 sm:mt-12" />
          ) : (
            <p className="text-xs sm:text-sm mt-10 sm:mt-12" style={{ color: theme.colors.text.light }}>
              Note: Use Mozilla or Chrome for a smooth experience.
            </p>
          )}
        </div>
      </main>
    </StudentLayout>
  );
};

export default TestSelection;