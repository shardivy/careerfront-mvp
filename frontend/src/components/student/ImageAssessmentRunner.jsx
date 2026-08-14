import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Flag, ChevronLeft, ChevronRight, Check } from "lucide-react";
import theme from "../../theme/theme";
import { useTestSubsection } from "../hooks/UseTestSubsections";
import { saveAutosave, loadAutosave, clearAutosave } from "../hooks/testAutosave";
import Skeleton from "../ui/Skeleton";
import OfflineBanner from "../ui/OfflineBanner";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { toast as toastManager, useToastManager } from "@/components/ui/toast";
import StudentLayout, { TopBar, SectionTimer } from "../layouts/StudentLayout";
import { useStudentQuestions } from "../hooks/useStudentQuestions";

const QUESTIONS_PER_PAGE = 10;

const ImageAssessmentRunner = () => {
  const { testType = "aptitude", sectionId } = useParams();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const isFirstOnlineCheck = useRef(true);
  const managerFromHook = useToastManager && useToastManager();

  const { section, loading: sectionLoading, error: sectionError } = useTestSubsection(testType, sectionId);
  const { questions: apiQuestions, loading: apiQuestionsLoading } = useStudentQuestions(section?.dbId);
  const questions = apiQuestions.length > 0 ? apiQuestions : (section?.questions || []);
  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));

  const [pageIndex, setPageIndex] = useState(
    () => loadAutosave(testType, sectionId)?.pageIndex ?? 0
  );
  const [answers, setAnswers] = useState(
    () => loadAutosave(testType, sectionId)?.answers ?? {}
  );
  const [marked, setMarked] = useState(
    () => new Set(loadAutosave(testType, sectionId)?.marked ?? [])
  );
  // NEW: absolute epoch-ms timestamp the timer counts down to. Restored
  // from autosave so a refresh doesn't reset the clock.
  const [timeEndsAt, setTimeEndsAt] = useState(
    () => loadAutosave(testType, sectionId)?.timeEndsAt ?? null
  );
  const [loading, setLoading] = useState(true);
  const submittedRef = useRef(false);

  // How many ms were left on the clock at the moment we went offline.
  // Non-null only while we're in a "paused" (offline) state.
  const pausedRemainingRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // If the subsection changes, restore whatever was saved for the new one.
  useEffect(() => {
    const saved = loadAutosave(testType, sectionId);
    setPageIndex(saved?.pageIndex ?? 0);
    setAnswers(saved?.answers ?? {});
    setMarked(new Set(saved?.marked ?? []));
    setTimeEndsAt(saved?.timeEndsAt ?? null);
    submittedRef.current = false;
    pausedRemainingRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType, sectionId]);

  const isLoading = loading || sectionLoading || apiQuestionsLoading || !section;

  // Once we know the section's time limit, establish timeEndsAt exactly
  // ONCE — either from what was restored above, or freshly computed as
  // Date.now() + limit if this section has never been started before.
  useEffect(() => {
    if (isLoading) return;
    if (!Number.isFinite(section?.timeLimitSeconds)) return;
    if (timeEndsAt) return;
    setTimeEndsAt(Date.now() + section.timeLimitSeconds * 1000);
  }, [isLoading, section?.timeLimitSeconds, timeEndsAt]);

  // Toast whenever connectivity flips — skip the very first check on
  // mount so we don't fire a spurious "Back online" toast immediately.
  useEffect(() => {
    if (isFirstOnlineCheck.current) {
      isFirstOnlineCheck.current = false;
      return;
    }

    const manager = managerFromHook || toastManager;
    const send = (payload) => {
      if (!manager) return;
      if (typeof manager.create === "function") return manager.create(payload);
      if (typeof manager.add === "function") return manager.add(payload);
      if (typeof manager.push === "function") return manager.push(payload);
      return undefined;
    };

    if (isOnline) {
      send({ title: "Back online", description: "Your connection has been restored.", type: "success" });
    } else {
      send({ title: "No internet connection", description: "Please reconnect to continue your assessment.", type: "error" });
    }
  }, [isOnline]);

  // Pause the countdown while offline. `timeEndsAt` is an absolute
  // timestamp, so simply leaving it untouched wouldn't pause anything —
  // the clock would keep ticking down against real time. Instead, while
  // offline we repeatedly nudge `timeEndsAt` forward so the *remaining*
  // time stays frozen at whatever it was the moment we lost connection.
  // Once back online, we resume counting down from that frozen remainder.
  useEffect(() => {
    if (isLoading || !timeEndsAt) return undefined;

    if (!isOnline) {
      if (pausedRemainingRef.current == null) {
        pausedRemainingRef.current = Math.max(0, timeEndsAt - Date.now());
      }
      const interval = setInterval(() => {
        setTimeEndsAt(Date.now() + pausedRemainingRef.current);
      }, 1000);
      return () => clearInterval(interval);
    }

    if (pausedRemainingRef.current != null) {
      setTimeEndsAt(Date.now() + pausedRemainingRef.current);
      pausedRemainingRef.current = null;
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, isLoading]);

  // Persist progress on every change — including timeEndsAt.
  useEffect(() => {
    saveAutosave(testType, sectionId, {
      pageIndex,
      answers,
      marked: Array.from(marked),
      timeEndsAt,
    });
  }, [testType, sectionId, pageIndex, answers, marked, timeEndsAt]);

  const handleSelect = (qIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const toggleMark = (qIndex) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(qIndex)) next.delete(qIndex);
      else next.add(qIndex);
      return next;
    });
  };

  const handleSubmit = (autoSubmitted = false) => {
    if (submittedRef.current && !autoSubmitted) return;
    submittedRef.current = true;
    clearAutosave(testType, sectionId);
    navigate(`/test/${testType}/${sectionId}/summary`, {
      state: { answers, totalQuestions: questions.length, autoSubmitted },
    });
  };

  // Fired once by SectionTimer when the countdown hits zero.
  const handleTimeExpire = () => {
    handleSubmit(true);
  };

  const goToPage = (p) => {
    if (p < 0 || p >= totalPages) return;
    setPageIndex(p);
    scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    if (pageIndex === totalPages - 1) {
      handleSubmit(false);
      return;
    }
    goToPage(pageIndex + 1);
  };

  const jumpToQuestion = (qIndex) => {
    const targetPage = Math.floor(qIndex / QUESTIONS_PER_PAGE);
    const scrollToCard = () =>
      document
        .getElementById(`iq-question-${qIndex}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (targetPage !== pageIndex) {
      setPageIndex(targetPage);
      requestAnimationFrame(() => requestAnimationFrame(scrollToCard));
    } else {
      scrollToCard();
    }
  };

  const getNavState = (qIndex) => {
    if (marked.has(qIndex)) return "marked";
    if (answers[qIndex] !== undefined) return "answered";
    return "unvisited";
  };

  const navColors = {
    answered: { bg: "#ECFDF5", color: "#047857", border: "#34D399" },
    marked: { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
    unvisited: { bg: "#FFFFFF", color: theme.colors.text.light, border: theme.colors.border },
  };

  const answeredCount = Object.keys(answers).length;
  const pageStart = pageIndex * QUESTIONS_PER_PAGE;
  const pageQuestions = questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE);

  return (
    <StudentLayout
      topBar={
        <TopBar
          maxWidth="max-w-6xl"
          sticky
          center={
            <span className="text-base sm:text-lg font-medium">
              {section?.title}
            </span>
          }
          right={
            <SectionTimer
              endsAt={timeEndsAt}
              loading={isLoading}
              onExpire={handleTimeExpire}
            />
          }
        />
      }
    >
      {!isOnline && <OfflineBanner />}

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        {sectionError && !isLoading && (
          <p className="max-w-6xl mx-auto text-sm mb-4" style={{ color: "#B91C1C" }}>
            Couldn't load this section right now. Please refresh the page.
          </p>
        )}

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          <div className="w-full lg:flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              {isLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : (
                <span className="text-sm sm:text-base font-semibold tracking-wide uppercase" style={{ color: theme.colors.text.light }}>
                  Page {pageIndex + 1} of {totalPages} · Q{pageStart + 1}–{pageStart + pageQuestions.length} of {questions.length}
                </span>
              )}
              {isLoading ? (
                <Skeleton className="h-4 w-28 hidden sm:block" />
              ) : (
                <span className="text-sm sm:text-base hidden sm:block" style={{ color: theme.colors.text.light }}>
                  {answeredCount} of {questions.length} answered
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`w-full ${theme.radius.lg} bg-white border px-6 py-6`} style={{ borderColor: theme.colors.border }}>
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-40 w-full max-w-xs mx-auto mb-4 rounded-lg" />
                    <div className="grid grid-cols-2 gap-2.5">
                      {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-11 rounded-md" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {pageQuestions.map((q, i) => {
                  const qIndex = pageStart + i;
                  const isMarked = marked.has(qIndex);
                  const isAnswered = answers[qIndex] !== undefined;
                  return (
                    <div
                      id={`iq-question-${qIndex}`}
                      key={qIndex}
                      className={`w-full ${theme.radius.lg} bg-white border px-5 sm:px-7 py-5 sm:py-6 scroll-mt-28`}
                      style={{ borderColor: isAnswered ? theme.colors.border : theme.colors.border }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <span
                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{
                              backgroundColor: isAnswered ? "#EFF6FF" : "#F1F5F9",
                              color: isAnswered ? theme.colors.primary : theme.colors.text.light,
                            }}
                          >
                            {isAnswered ? <Check className="w-4 h-4" /> : qIndex + 1}
                          </span>
                          <p className="text-base sm:text-lg leading-relaxed pt-0.5" style={{ color: theme.colors.text.heading }}>
                            {q.prompt}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleMark(qIndex)}
                          className="shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md border transition-colors"
                          style={{
                            borderColor: isMarked ? "#FCD34D" : theme.colors.border,
                            backgroundColor: isMarked ? "#FEF3C7" : "#FFFFFF",
                            color: isMarked ? "#92400E" : theme.colors.text.body,
                          }}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isMarked ? "Marked" : "Mark"}</span>
                        </button>
                      </div>

                      <div className="flex justify-center mb-5">
                        <div className="w-full max-w-xs border-2 rounded-lg p-3 flex items-center justify-center bg-white" style={{ borderColor: theme.colors.border }}>
                          <img
                            src={q.questionImage}
                            alt={`Question ${qIndex + 1} figure`}
                            className="max-w-full h-auto object-contain"
                            draggable={false}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement.insertAdjacentHTML(
                                "beforeend",
                                '<span style="color:#DC2626;font-size:13px;">Image failed to load — check the file path</span>'
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {q.options.map((option, oi) => {
                          const isSelected = answers[qIndex] === oi;
                          const letter = String.fromCharCode(65 + oi);
                          return (
                            <button
                              key={oi}
                              type="button"
                              onClick={() => handleSelect(qIndex, oi)}
                              className="flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-3 font-semibold transition-all"
                              style={{
                                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                                color: isSelected ? theme.colors.primary : theme.colors.text.heading,
                              }}
                            >
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{
                                  backgroundColor: isSelected ? theme.colors.primary : "#F1F5F9",
                                  color: isSelected ? "#FFFFFF" : theme.colors.text.light,
                                }}
                              >
                                {letter}
                              </span>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`w-full lg:w-64 shrink-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto ${theme.radius.lg} bg-white border border-slate-200 px-5 py-5 sm:py-6`}>
            {isLoading ? (
              <Skeleton className="h-4 w-24 mb-4" />
            ) : (
              <h3 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: theme.colors.text.light }}>
                Navigator
              </h3>
            )}

            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2.5 mb-5">
              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
                : questions.map((_, i) => {
                    const state = getNavState(i);
                    const c = navColors[state];
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => jumpToQuestion(i)}
                        className="aspect-square rounded-lg border text-base font-medium flex items-center justify-center transition-colors"
                        style={{ backgroundColor: c.bg, color: c.color, borderColor: c.border }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
            </div>

            <div className="flex flex-col gap-3">
              {isLoading
                ? [1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <Skeleton className="w-3.5 h-3.5 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))
                : [
                    { label: "Answered", color: "#ECFDF5", border: "#34D399" },
                    { label: "Marked", color: "#FEF3C7", border: "#FCD34D" },
                    { label: "Unvisited", color: "#FFFFFF", border: theme.colors.border },
                  ].map(({ label, color, border }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color, borderColor: border }} />
                      <span className="text-sm" style={{ color: theme.colors.text.body }}>
                        {label}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 flex items-center justify-between gap-3">
          {isLoading ? (
            <Skeleton className="h-12 w-32 rounded-lg" />
          ) : (
            <button
              type="button"
              onClick={() => goToPage(pageIndex - 1)}
              disabled={pageIndex === 0}
              className={`flex items-center gap-2 text-base font-medium px-5 py-3 ${theme.radius.md} border transition-colors`}
              style={{
                borderColor: theme.colors.border,
                color: pageIndex === 0 ? theme.colors.text.light : theme.colors.text.body,
                backgroundColor: "#FFFFFF",
                opacity: pageIndex === 0 ? 0.6 : 1,
                cursor: pageIndex === 0 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous 10
            </button>
          )}

          {!isLoading && (
            <span className="text-sm sm:text-base hidden sm:block" style={{ color: theme.colors.text.light }}>
              {answeredCount} of {questions.length} answered
            </span>
          )}

          {isLoading ? (
            <Skeleton className="h-12 w-32 rounded-lg" />
          ) : (
            <button
              type="button"
              onClick={handleNextPage}
              className={`flex items-center gap-2 text-base font-semibold px-6 py-3 ${theme.radius.md} transition-colors ${theme.button.primary} ${theme.shadow.button}`}
            >
              {pageIndex === totalPages - 1 ? "Submit" : "Next"}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {!isLoading && (
          <p className="max-w-6xl mx-auto text-sm text-center mt-4 sm:hidden" style={{ color: theme.colors.text.light }}>
            {answeredCount} of {questions.length} answered
          </p>
        )}
      </main>
    </StudentLayout>
  );
};

export default ImageAssessmentRunner;