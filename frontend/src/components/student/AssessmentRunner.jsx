import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
  import { useParams, useNavigate } from "react-router-dom";
  import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
  import theme from "../../theme/theme";
  import { getTestConfig, getSectionOrder, getSection } from "./testData";
  import { isTestComplete, isSectionComplete } from "./testProgress";
  import { saveAutosave, loadAutosave, clearAutosave } from "../hooks/testAutosave";
  import Skeleton from "../ui/Skeleton";
  import OfflineBanner from "../ui/OfflineBanner";
  import useOnlineStatus from "../hooks/useOnlineStatus";
  import { toast as toastManager, useToastManager } from "@/components/ui/toast";
  import RapidAssessmentRunner from "./RapidAssessmentRunner";
  import ImageAssessmentRunner from "./ImageAssessmentRunner";
  import InterestAssessmentRunner from "./InterestAssessmentRunner";
  import StudentLayout, {
    TopBar,
    SectionTimer,
    SectionProgressLabel,
    SectionProgressDots,
  } from "../layouts/StudentLayout";

  // Sections that use the "many questions per page, options in one row" layout
  const MULTI_QUESTION_SECTIONS = ["quantitative", "verbal", "reasoning"];
  const QUESTIONS_PER_PAGE = 10;

  const AssessmentRunner = () => {
    const { testType = "aptitude", sectionId } = useParams();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const isFirstOnlineCheck = useRef(true);
    const managerFromHook = useToastManager && useToastManager();

    const config = getTestConfig(testType);
    const sectionOrder = getSectionOrder(testType);
    const section = getSection(testType, sectionId || sectionOrder[0]);

    const questions = section.questions || [];

    const sectionsTotal = sectionOrder.length;
    const sectionIndex = Math.max(0, sectionOrder.indexOf(section.id));
    const sectionNumber = sectionIndex + 1;

    // "single-page" = Rapid Assessment's grouped comparison layout.
    // "single-page-image" = image-based questions (Visual Reasoning,
    // Mental Agility) shown all at once instead of one-per-page.
    const singlePageLayout = section.layout === "single-page";
    const singlePageImageLayout = section.layout === "single-page-image";
    const singlePageInterestLayout = section.layout === "single-page-interest";
    const multiQuestionLayout = MULTI_QUESTION_SECTIONS.includes(section.id);
    const totalPages = multiQuestionLayout
      ? Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE))
      : 1;

    // Restore any autosaved progress for this section (survives refresh /
    // network drop / tab close). Falls back to blank state if nothing saved.
    const [currentIndex, setCurrentIndex] = useState(
      () => loadAutosave(testType, section.id)?.currentIndex ?? 0
    );
    const [pageIndex, setPageIndex] = useState(
      () => loadAutosave(testType, section.id)?.pageIndex ?? 0
    );
    const [answers, setAnswers] = useState(
      () => loadAutosave(testType, section.id)?.answers ?? {}
    );
    const [marked, setMarked] = useState(
      () => new Set(loadAutosave(testType, section.id)?.marked ?? [])
    );
    const [visited, setVisited] = useState(
      () => new Set(loadAutosave(testType, section.id)?.visited ?? [0])
    );
    const submittedRef = useRef(false);
    const [loading, setLoading] = useState(true);

    // --- option-wrap detection (multi-question layout only) -----------------
    // Each question's options normally render as a single horizontal row.
    // If a question's options are too long to fit on one line, we fall back
    // to the vertical, one-option-per-line style used in the single-question
    // layout, but only for that specific question.
    const optionsRowRefs = useRef({});
    const [wrappedQuestions, setWrappedQuestions] = useState({});

    useEffect(() => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    }, []);

    useEffect(() => {
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    }, []);

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

    // Whenever the section changes, restore whatever was autosaved for the
    // NEW section (instead of always blanking to defaults). If nothing was
    // saved for that section yet, this naturally falls back to a fresh start.
    useEffect(() => {
      const saved = loadAutosave(testType, section.id);
      setCurrentIndex(saved?.currentIndex ?? 0);
      setPageIndex(saved?.pageIndex ?? 0);
      setAnswers(saved?.answers ?? {});
      setMarked(new Set(saved?.marked ?? []));
      setVisited(new Set(saved?.visited ?? [0]));
      submittedRef.current = false;
      optionsRowRefs.current = {};
      setWrappedQuestions({});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testType, section.id]);

    useEffect(() => {
      const testDone = isTestComplete(testType, sectionOrder);
      const sectionDone = isSectionComplete(testType, section.id);
      if (testDone || sectionDone) {
        navigate("/test", { replace: true });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testType, section.id]);

    // Persist progress to localStorage on every change so a dropped
    // connection or refresh doesn't lose answers.
    useEffect(() => {
      saveAutosave(testType, section.id, {
        currentIndex,
        pageIndex,
        answers,
        marked: Array.from(marked),
        visited: Array.from(visited),
      });
    }, [testType, section.id, currentIndex, pageIndex, answers, marked, visited]);

    const answeredCount = Object.keys(answers).length;
    const progressPct = multiQuestionLayout
      ? ((pageIndex + 1) / totalPages) * 100
      : ((currentIndex + 1) / questions.length) * 100;
    const currentQuestion = questions[currentIndex];
    const useImageOptionUI =
      section.id === "spatial" ||
      section.id === "mental-agility";

    const pageStart = pageIndex * QUESTIONS_PER_PAGE;
    const pageQuestions = multiQuestionLayout
      ? questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE)
      : [];

    // Measure each question's (hidden) single-row option clone. If its
    // buttons land on more than one visual row, that question is flagged as
    // "wrapped" and rendered with the vertical, one-per-line option style
    // instead. Re-measures on resize so rotating a device / resizing a
    // window re-evaluates the layout.
    useLayoutEffect(() => {
      if (!multiQuestionLayout || loading) return undefined;

      const measure = () => {
        setWrappedQuestions((prev) => {
          let changed = false;
          const next = { ...prev };
          pageQuestions.forEach((_, i) => {
            const qIndex = pageStart + i;
            const container = optionsRowRefs.current[qIndex];
            if (!container) return;
            const buttons = Array.from(container.children);
            if (buttons.length < 2) return;
            const firstTop = buttons[0].offsetTop;
            const wraps = buttons.some((b) => b.offsetTop !== firstTop);
            if (next[qIndex] !== wraps) {
              next[qIndex] = wraps;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      };

      const raf = requestAnimationFrame(measure);
      window.addEventListener("resize", measure);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", measure);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiQuestionLayout, loading, pageIndex, questions.length]);

    const getSectionBarState = (id) => {
      if (id === section.id) return "current";
      if (isSectionComplete(testType, id)) return "completed";
      return "upcoming";
    };

    const goTo = (index) => {
      if (index < 0 || index >= questions.length) return;
      setCurrentIndex(index);
      setVisited((prev) => new Set(prev).add(index));
    };

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

    const submitSection = (autoSubmitted = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      clearAutosave(testType, section.id);
      navigate(`/test/${testType}/${section.id}/summary`, {
        state: { answers, totalQuestions: questions.length, autoSubmitted },
      });
    };

    const handleNext = () => {
      if (currentIndex === questions.length - 1) {
        submitSection(false);
        return;
      }
      goTo(currentIndex + 1);
    };

    // Fired once by SectionTimer when the countdown hits zero.
    const handleTimeExpire = () => {
      submitSection(true);
    };

    const goToPage = (p) => {
      if (p < 0 || p >= totalPages) return;
      setPageIndex(p);
      scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleNextPage = () => {
      if (pageIndex === totalPages - 1) {
        submitSection(false);
        return;
      }
      goToPage(pageIndex + 1);
    };

    const jumpToQuestion = (qIndex) => {
      const targetPage = Math.floor(qIndex / QUESTIONS_PER_PAGE);
      const scrollToCard = () =>
        document
          .getElementById(`mq-question-${qIndex}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });

      if (targetPage !== pageIndex) {
        setPageIndex(targetPage);
        requestAnimationFrame(() => requestAnimationFrame(scrollToCard));
      } else {
        scrollToCard();
      }
    };

    if (singlePageLayout) {
      return <RapidAssessmentRunner />;
    }

    if (singlePageImageLayout) {
      return <ImageAssessmentRunner />;
    }

      if (singlePageInterestLayout) {          // ← add
      return <InterestAssessmentRunner />;
    }

    const getNavState = (index) => {
      if (!multiQuestionLayout && index === currentIndex) return "current";
      if (marked.has(index)) return "marked";
      if (answers[index] !== undefined) return "answered";
      if (visited.has(index)) return "visited";
      return "unvisited";
    };

    const navColors = {
      current: { bg: theme.colors.primary, color: theme.colors.text.white, border: theme.colors.primary },
      answered: { bg: "#ECFDF5", color: "#047857", border: "#34D399" },
      marked: { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
      unvisited: { bg: "#FFFFFF", color: theme.colors.text.light, border: theme.colors.border },
      visited: { bg: "#FFFFFF", color: theme.colors.text.body, border: theme.colors.border },
    };

    const sharedTopBar = (
      <TopBar
        maxWidth="max-w-6xl"
        progressBar={
          loading ? (
            <div className="px-5 sm:px-6">
              <Skeleton className="h-1 w-1/4 rounded-none" />
            </div>
          ) : (
            <div className="px-5 sm:px-6">
              <div
                className="h-1 transition-all duration-300"
                style={{ width: `${progressPct}%`, backgroundColor: theme.colors.primary }}
              />
            </div>
          )
        }
        center={
          <SectionProgressLabel
            sectionNumber={sectionNumber}
            sectionsTotal={sectionsTotal}
            sectionTitle={section.title}
            loading={loading}
          />
        }
        right={
          <SectionTimer
            timeLimitSeconds={section.timeLimitSeconds}
            resetKey={section.id}
            loading={loading}
            onExpire={handleTimeExpire}
          />
        }
        below={
          <>
            <SectionProgressLabel
              sectionNumber={sectionNumber}
              sectionsTotal={sectionsTotal}
              sectionTitle={section.title}
              loading={loading}
              mobile
            />
            <SectionProgressDots
              sectionOrder={sectionOrder}
              getSectionState={getSectionBarState}
              sectionNumber={sectionNumber}
              sectionsTotal={sectionsTotal}
              loading={loading}
              maxWidth="max-w-6xl"
            />
          </>
        }
      />
    );

    // ------------------------------------------------------------------
    // MULTI-QUESTION LAYOUT (quantitative / verbal / reasoning)
    // 10 questions per page, scrollable list. Options render in one row by
    // default; any question whose options don't fit on one line falls back
    // to the vertical, one-option-per-line style automatically.
    // ------------------------------------------------------------------
    if (multiQuestionLayout) {
      return (
        <StudentLayout topBar={sharedTopBar}>
          {!isOnline && <OfflineBanner />}

          <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

              {/* Scrollable question list */}
              <div className="w-full lg:flex-1 min-w-0">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  {loading ? (
                    <Skeleton className="h-4 w-48" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold tracking-wide uppercase" style={{ color: theme.colors.text.light }}>
                      Page {pageIndex + 1} of {totalPages} · Q{pageStart + 1}–{pageStart + pageQuestions.length} of {questions.length}
                    </span>
                  )}
                  {loading ? (
                    <Skeleton className="h-4 w-28 hidden sm:block" />
                  ) : (
                    <span className="text-sm sm:text-base hidden sm:block" style={{ color: theme.colors.text.light }}>
                      {answeredCount} of {questions.length} answered
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-5">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`w-full ${theme.radius.lg} bg-white border px-6 py-6`} style={{ borderColor: theme.colors.border }}>
                          <Skeleton className="h-5 w-11/12 mb-4" />
                          <div className="flex flex-wrap gap-2.5">
                            {[1, 2, 3, 4].map((j) => (
                              <Skeleton key={j} className="h-10 w-28 rounded-md" />
                            ))}
                          </div>
                        </div>
                      ))
                    : pageQuestions.map((q, i) => {
                        const qIndex = pageStart + i;
                        const isMarked = marked.has(qIndex);
                        const isWrapped = !!wrappedQuestions[qIndex];
                        return (
                          <div
                            id={`mq-question-${qIndex}`}
                            key={qIndex}
                            className={`w-full ${theme.radius.lg} bg-white border px-6 py-5 sm:px-7 sm:py-6 scroll-mt-24`}
                            style={{ borderColor: theme.colors.border }}
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <p className="text-base sm:text-lg leading-relaxed flex-1" style={{ color: theme.colors.text.heading }}>
                                <span className="mr-2 font-semibold" style={{ color: theme.colors.text.light }}>
                                  {qIndex + 1}.
                                </span>
                                {q.prompt}
                              </p>
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
                                {isMarked ? "Marked" : "Mark"}
                              </button>
                            </div>

                            <div className="relative">
                              {/* Hidden single-row clone used only to detect wrapping.
                                  Kept in sync with the real options so we can tell
                                  whether they'd overflow one line. */}
                              <div
                                ref={(el) => {
                                  if (el) optionsRowRefs.current[qIndex] = el;
                                }}
                                className="flex flex-wrap gap-2.5 invisible absolute inset-x-0 top-0 pointer-events-none -z-10"
                                aria-hidden="true"
                              >
                                {q.options.map((option, oi) => (
                                  <span
                                    key={oi}
                                    className="text-sm sm:text-base font-medium px-4 py-2.5 rounded-md border"
                                  >
                                    {String.fromCharCode(65 + oi)}. {option}
                                  </span>
                                ))}
                              </div>

                              {isWrapped ? (
                                // Options didn't fit on one line — fall back to the
                                // vertical, one-option-per-line style.
                                <div className="flex flex-col gap-3">
                                  {q.options.map((option, oi) => {
                                    const isSelected = answers[qIndex] === oi;
                                    const letter = String.fromCharCode(65 + oi);
                                    return (
                                      <button
                                        key={oi}
                                        type="button"
                                        onClick={() => handleSelect(qIndex, oi)}
                                        className={`w-full flex items-center justify-between gap-3 ${theme.radius.lg} border px-5 py-3.5 text-left transition-colors`}
                                        style={{
                                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                          backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                                        }}
                                      >
                                        <span className="flex items-center gap-3.5 min-w-0">
                                          <span
                                            className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                                            style={{ borderColor: isSelected ? theme.colors.primary : "#CBD5E1" }}
                                          >
                                            {isSelected && (
                                              <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: theme.colors.primary }}
                                              />
                                            )}
                                          </span>
                                          <span className="text-base break-words" style={{ color: theme.colors.text.heading }}>
                                            {option}
                                          </span>
                                        </span>
                                        <span className="shrink-0 text-sm font-semibold" style={{ color: theme.colors.text.light }}>
                                          {letter}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                // Default: options in a single horizontal row.
                                <div className="flex flex-wrap gap-2.5">
                                  {q.options.map((option, oi) => {
                                    const isSelected = answers[qIndex] === oi;
                                    const letter = String.fromCharCode(65 + oi);
                                    return (
                                      <button
                                        key={oi}
                                        type="button"
                                        onClick={() => handleSelect(qIndex, oi)}
                                        className="flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2.5 rounded-md border transition-colors"
                                        style={{
                                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                          backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                                          color: theme.colors.text.heading,
                                        }}
                                      >
                                        <span
                                          className="font-semibold"
                                          style={{ color: isSelected ? theme.colors.primary : theme.colors.text.light }}
                                        >
                                          {letter}.
                                        </span>
                                        {option}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>

              {/* Navigator panel — jumps to & scrolls the question into view.
                  Stays fixed in place on desktop while the question list
                  scrolls past it. */}
              <div className={`w-full lg:w-64 shrink-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto ${theme.radius.lg} bg-white border border-slate-200 px-5 py-5 sm:py-6`}>
                {loading ? (
                  <Skeleton className="h-4 w-24 mb-4" />
                ) : (
                  <h3 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: theme.colors.text.light }}>
                    Navigator
                  </h3>
                )}

                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2.5 mb-5">
                  {loading
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
                  {loading
                    ? [1, 2, 3, 4].map((i) => (
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

            {/* Previous / Next — sits at the very end of the page, below both
                the question list and the navigator. Normal document flow;
                not sticky or fixed. */}
            <div className="max-w-6xl mx-auto mt-6 flex items-center justify-between gap-3">
              {loading ? (
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

              {!loading && (
                <span className="text-sm sm:text-base hidden sm:block" style={{ color: theme.colors.text.light }}>
                  {answeredCount} of {questions.length} answered
                </span>
              )}

              {loading ? (
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

            {!loading && (
              <p className="max-w-6xl mx-auto text-sm text-center mt-4 sm:hidden" style={{ color: theme.colors.text.light }}>
                {answeredCount} of {questions.length} answered
              </p>
            )}
          </main>
        </StudentLayout>
      );
    }

    // ------------------------------------------------------------------
    // SINGLE-QUESTION LAYOUT (fallback — any other section not covered by
    // the multi-question, rapid single-page, or image single-page layouts)
    // ------------------------------------------------------------------
    return (
      <StudentLayout topBar={sharedTopBar}>
        {!isOnline && <OfflineBanner />}

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

            {/* Question column */}
            <div className="w-full lg:flex-1 min-w-0">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <span className="text-sm sm:text-base font-semibold tracking-wide uppercase" style={{ color: theme.colors.text.light }}>
                    Question {currentIndex + 1} / {questions.length}
                  </span>
                )}
                {loading ? (
                  <Skeleton className="h-9 w-36 rounded-md" />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleMark(currentIndex)}
                    className={`flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2 sm:py-2.5 ${theme.radius.md} border transition-colors`}
                    style={{
                      borderColor: marked.has(currentIndex) ? "#FCD34D" : theme.colors.border,
                      backgroundColor: marked.has(currentIndex) ? "#FEF3C7" : "#FFFFFF",
                      color: marked.has(currentIndex) ? "#92400E" : theme.colors.text.body,
                    }}
                  >
                    <Flag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    {marked.has(currentIndex) ? "Marked" : "Mark for Review"}
                  </button>
                )}
              </div>

              <div className={`w-full ${theme.radius.lg} bg-white border border-slate-200 px-6 sm:px-8 py-6 sm:py-7 mb-5 sm:mb-6`}>
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-11/12 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </>
                ) : useImageOptionUI ? (
                  <div className="flex flex-col items-center">
                    <p className="text-base sm:text-lg leading-relaxed mb-5 text-center" style={{ color: theme.colors.text.heading }}>
                      {currentQuestion.prompt}
                    </p>
                    <div className="w-full max-w-xs border-2 rounded-lg p-3 flex items-center justify-center bg-white" style={{ borderColor: theme.colors.border }}>
                      <img
                        src={currentQuestion.questionImage}
                        alt="Question figure (X)"
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
                ) : (
                  <p className="text-lg sm:text-xl leading-relaxed" style={{ color: theme.colors.text.heading }}>
                    {currentQuestion.prompt}
                  </p>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col gap-3 sm:gap-3.5 mb-6 sm:mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-full ${theme.radius.lg} border px-4 sm:px-6 py-3.5 sm:py-4`} style={{ borderColor: theme.colors.border }}>
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-5 h-5 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : useImageOptionUI ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {currentQuestion.options.map((option, i) => {
                    const isSelected = answers[currentIndex] === i;
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelect(currentIndex, i)}
                        className="w-full rounded-xl border-2 px-5 py-4 text-left transition-all duration-200"
                        style={{
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                            style={{
                              backgroundColor: isSelected ? theme.colors.primary : "#F1F5F9",
                              color: isSelected ? "#FFFFFF" : theme.colors.text.heading,
                            }}
                          >
                            {letter}
                          </div>
                          <span className="text-lg font-medium" style={{ color: theme.colors.text.heading }}>
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-3.5 sm:gap-4 mb-6 sm:mb-8">
                  {currentQuestion.options.map((option, i) => {
                    const isSelected = answers[currentIndex] === i;
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelect(currentIndex, i)}
                        className={`w-full flex items-center justify-between gap-3 ${theme.radius.lg} border px-5 sm:px-7 py-4 sm:py-4.5 text-left transition-colors`}
                        style={{
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                        }}
                      >
                        <span className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                          <span
                            className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: isSelected ? theme.colors.primary : "#CBD5E1" }}
                          >
                            {isSelected && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }} />}
                          </span>
                          <span className="text-base sm:text-lg break-words" style={{ color: theme.colors.text.heading }}>
                            {option}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm sm:text-base font-semibold" style={{ color: theme.colors.text.light }}>
                          {letter}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                {loading ? (
                  <Skeleton className="h-12 w-32 rounded-lg" />
                ) : (
                  <button
                    type="button"
                    onClick={() => goTo(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className={`flex items-center gap-2 text-base font-medium px-5 py-3 ${theme.radius.md} border transition-colors`}
                    style={{
                      borderColor: theme.colors.border,
                      color: currentIndex === 0 ? theme.colors.text.light : theme.colors.text.body,
                      backgroundColor: "#FFFFFF",
                      opacity: currentIndex === 0 ? 0.6 : 1,
                      cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>
                )}

                {loading ? (
                  <Skeleton className="h-4 w-28 hidden sm:block" />
                ) : (
                  <span className="text-sm sm:text-base hidden sm:block" style={{ color: theme.colors.text.light }}>
                    {answeredCount} of {questions.length} answered
                  </span>
                )}

                {loading ? (
                  <Skeleton className="h-12 w-32 rounded-lg" />
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className={`flex items-center gap-2 text-base font-semibold px-6 py-3 ${theme.radius.md} transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                  >
                    {currentIndex === questions.length - 1 ? "Submit" : "Next"}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {!loading && (
                <p className="text-sm text-center mt-4 sm:hidden" style={{ color: theme.colors.text.light }}>
                  {answeredCount} of {questions.length} answered
                </p>
              )}
            </div>

            {/* Navigator panel */}
            <div className={`w-full lg:w-64 shrink-0 ${theme.radius.lg} bg-white border border-slate-200 px-5 py-5 sm:py-6`}>
              {loading ? (
                <Skeleton className="h-4 w-24 mb-4" />
              ) : (
                <h3 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: theme.colors.text.light }}>
                  Navigator
                </h3>
              )}

              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2.5 mb-5">
                {loading
                  ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
                  : questions.map((_, i) => {
                      const state = getNavState(i);
                      const c = navColors[state];
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => goTo(i)}
                          className="aspect-square rounded-lg border text-base font-medium flex items-center justify-center transition-colors"
                          style={{ backgroundColor: c.bg, color: c.color, borderColor: c.border }}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
              </div>

              <div className="flex flex-col gap-3">
                {loading
                  ? [1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <Skeleton className="w-3.5 h-3.5 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))
                  : [
                      { label: "Current", color: theme.colors.primary, filled: true },
                      { label: "Answered", color: "#ECFDF5", border: "#34D399" },
                      { label: "Marked", color: "#FEF3C7", border: "#FCD34D" },
                      { label: "Unvisited", color: "#FFFFFF", border: theme.colors.border },
                    ].map(({ label, color, border, filled }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: filled ? color : color, borderColor: border || color }} />
                        <span className="text-sm" style={{ color: theme.colors.text.body }}>
                          {label}
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </main>
      </StudentLayout>
    );
  };

  export default AssessmentRunner;