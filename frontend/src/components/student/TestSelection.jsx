import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Compass, BookOpen, ArrowRight, Check, FileText ,ListChecks} from "lucide-react";
import theme from "../../theme/theme";
import { TEST_CONFIGS } from "./testData";
import { isTestComplete, areAllTestsComplete } from "./testProgress";
import Skeleton from "../ui/Skeleton";
import StudentLayout, { TopBar } from "../layouts/StudentLayout";

// Keyed by the id used in TEST_CONFIGS. Add an entry here for every test
// you introduce — anything without a match falls back to a generic icon
// and its config label as the description, so the grid never breaks even
// if a new test is added to TEST_CONFIGS before this map is updated.
const CARD_ICONS = {
  aptitude: Brain,
  interest: Compass,
  // personality: BookOpen,
  studyHabits: ListChecks,
};

const CARD_DESCRIPTIONS = {
  aptitude: "Measure your reasoning, problem-solving, and analytical strengths.",
  interest: "Explore the careers and fields that naturally draw you in.",
  // personality: "See how you learn best and where your study habits can improve.",
  studyHabits: "See how you plan, learn, and handle exam pressure.",
};

// Grid columns scale with how many tests are configured, instead of being
// hardcoded for 2 — 1 test stays single-column, 2 gets a 2-up grid, 3+
// gets a 3-up grid on larger screens.
const gridColsClass = (count) => {
  if (count <= 1) return "grid-cols-1 max-w-md";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-3xl";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl";
};

const TestSelection = ({ userName = "" }) => {
  const navigate = useNavigate();
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

  useEffect(() => {
    const onFocus = () => setProgressVersion((v) => v + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const tests = Object.entries(TEST_CONFIGS).map(([id, config]) => ({
    id,
    title: config.label,
    description: CARD_DESCRIPTIONS[id] || config.label,
    icon: CARD_ICONS[id] || Brain,
    path: config.landingPath,
    completed: isTestComplete(id, config.sections.map((s) => s.id)),
  }));

  const testCount = tests.length;
  const allDone = areAllTestsComplete();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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

          {loading ? (
            <Skeleton className="h-6 w-24 rounded-full mb-6" />
          ) : (
            <div className={`w-fit ${theme.badge.blue} mb-6`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
              Verified
            </div>
          )}

          {loading ? (
            <Skeleton className="h-10 sm:h-12 w-2/3 mb-3" />
          ) : (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ color: theme.colors.text.heading }}>
              {userName ? `All the best, ${userName}!` : "All the best, for the test!"}
            </h1>
          )}

          {loading ? (
            <Skeleton className="h-5 w-1/2 mb-8 sm:mb-10" />
          ) : (
            <p className="text-base sm:text-lg mb-8 sm:mb-10 max-w-xl" style={{ color: theme.colors.text.body }}>
              Pick a test below to get started. You can take them in any order.
            </p>
          )}

          {/* Report-ready banner */}
          {!loading && allDone && (
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

          {loading ? (
            <Skeleton className="h-6 w-48 mb-6 sm:mb-8" />
          ) : (
            <h2 className="text-lg sm:text-xl font-semibold mb-6 sm:mb-8" style={{ color: theme.colors.primary }}>
              Start with any test
            </h2>
          )}

          {/* Test cards — column count scales with how many tests exist */}
          <div className={`w-full grid gap-4 sm:gap-6 ${gridColsClass(loading ? testCount || 2 : testCount)}`}>
            {loading
              ? Array.from({ length: testCount || 2 }).map((_, i) => (
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
              : tests.map(({ id, title, description, icon: Icon, path, completed }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => !completed && navigate(path)}
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
                ))}
          </div>

          {loading ? (
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