import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
import theme from "../../theme/theme";
import { UseTestSubsections } from "../hooks/UseTestSubsections";
import { isTestComplete, isSectionComplete } from "./Testprogress";
import {
  saveAutosave,
  loadAutosave,
  clearAutosave,
} from "../hooks/testAutosave";
import { useStudentQuestions } from "../hooks/useStudentQuestions";
import Skeleton from "../ui/skeleton";
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

import { saveStudentResponsesApi } from "../../api/student-api/studentResponseApi";

import {
  getAttemptId,
  getStudentId,
  getSubsectionResponses,
  saveQuestionResponse,
  saveQuestionMarkStatus,
  clearSubsectionResponses,
} from "../../utils/studentResponseStorage";

const QUESTIONS_PER_PAGE = 10;

// Some question_text values from the backend arrive as pipe-delimited
// segments (an intro line followed by several statements), sometimes with
// stray \r\n and repeated spaces around each "|", e.g.:
//   "If the first two statements are true, the third statement is \r\n     |     Sanya is older than Sahil.     |     ..."
// This splits on "|", collapses whitespace/newlines within each segment,
// and drops empty segments so each part can be rendered on its own line
// instead of showing the raw pipes.
const splitPromptSegments = (text) => {
  if (!text) return [];
  return String(text)
    .split("|")
    .map((segment) => segment.replace(/\r\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const QuestionPrompt = ({ text, className, style }) => {
  const segments = splitPromptSegments(text);
  if (segments.length <= 1) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }
  return (
    <span className={className} style={style}>
      {segments.map((segment, i) =>
        i === 0 ? (
          <React.Fragment key={i}>{segment}</React.Fragment>
        ) : (
          <span key={i} className="block mt-1.5">
            {segment}
          </span>
        ),
      )}
    </span>
  );
};

const AssessmentRunner = () => {
  const { testType = "aptitude", sectionId } = useParams();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const isFirstOnlineCheck = useRef(true);
  const managerFromHook = useToastManager && useToastManager();

  const {
    tabs,
    loading: subsectionsLoading,
    error: subsectionsError,
  } = UseTestSubsections(testType);

  const sectionOrder = tabs.map((t) => t.id);
  const activeSectionId = sectionId || sectionOrder[0];
  const section = tabs.find((t) => t.id === activeSectionId) || null;

  const { questions: apiQuestions, loading: apiQuestionsLoading } =
    useStudentQuestions(section?.dbId);
  const questions =
    apiQuestions.length > 0 ? apiQuestions : section?.questions || [];

  const sectionsTotal = sectionOrder.length;
  const sectionIndex = Math.max(0, sectionOrder.indexOf(activeSectionId));
  const sectionNumber = sectionIndex + 1;

  const singlePageLayout = section?.layout === "single-page";
  const singlePageImageLayout = section?.layout === "single-page-image";
  const singlePageInterestLayout = section?.layout === "single-page-interest";
  const multiQuestionLayout = section?.layout === "multi-question";
  const totalPages = multiQuestionLayout
    ? Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE))
    : 1;

  const delegatesToChildRunner =
    singlePageLayout || singlePageImageLayout || singlePageInterestLayout;

  const [currentIndex, setCurrentIndex] = useState(
    () => loadAutosave(testType, activeSectionId)?.currentIndex ?? 0,
  );
  const [pageIndex, setPageIndex] = useState(
    () => loadAutosave(testType, activeSectionId)?.pageIndex ?? 0,
  );
  const [answers, setAnswers] = useState(
    () => loadAutosave(testType, activeSectionId)?.answers ?? {},
  );
  const [marked, setMarked] = useState(
    () => new Set(loadAutosave(testType, activeSectionId)?.marked ?? []),
  );
  const [visited, setVisited] = useState(
    () => new Set(loadAutosave(testType, activeSectionId)?.visited ?? [0]),
  );
  const [timeEndsAt, setTimeEndsAt] = useState(
    () => loadAutosave(testType, activeSectionId)?.timeEndsAt ?? null,
  );
  const submittedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState(null);

  const pausedRemainingRef = useRef(null);

  const isLoading =
    loading || subsectionsLoading || apiQuestionsLoading || !section;

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
      send({
        title: "Back online",
        description: "Your connection has been restored.",
        type: "success",
      });
    } else {
      send({
        title: "No internet connection",
        description: "Please reconnect to continue your assessment.",
        type: "error",
      });
    }
  }, [isOnline, managerFromHook]);

  useEffect(() => {
    const saved = loadAutosave(testType, activeSectionId);
    setCurrentIndex(saved?.currentIndex ?? 0);
    setPageIndex(saved?.pageIndex ?? 0);
    setAnswers(saved?.answers ?? {});
    setMarked(new Set(saved?.marked ?? []));
    setVisited(new Set(saved?.visited ?? [0]));
    setTimeEndsAt(saved?.timeEndsAt ?? null);
    submittedRef.current = false;
    pausedRemainingRef.current = null;
    optionsRowRefs.current = {};
    setWrappedQuestions({});
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType, activeSectionId]);

  useEffect(() => {
    if (isLoading || !activeSectionId || delegatesToChildRunner) return;
    if (!Number.isFinite(section?.timeLimitSeconds)) return;
    if (timeEndsAt) return;
    setTimeEndsAt(Date.now() + section.timeLimitSeconds * 1000);
  }, [
    isLoading,
    activeSectionId,
    section?.timeLimitSeconds,
    delegatesToChildRunner,
    timeEndsAt,
  ]);

  useEffect(() => {
    if (isLoading || !timeEndsAt || delegatesToChildRunner) return undefined;

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
  }, [isOnline, isLoading, delegatesToChildRunner]);

  useEffect(() => {
    if (!activeSectionId || tabs.length === 0) return;
    const testDone = isTestComplete(testType, sectionOrder);
    const sectionDone = isSectionComplete(testType, activeSectionId);
    if (testDone || sectionDone) {
      navigate("/test", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType, activeSectionId, tabs.length]);

  useEffect(() => {
    if (!activeSectionId || !questions.length) {
      return;
    }

    const attemptId = getAttemptId();

    if (!attemptId) {
      console.warn("attempt_id not found in localStorage");
      return;
    }

    const subsectionId = section?.dbId ?? activeSectionId;

    const subsectionResponses = getSubsectionResponses(
      attemptId,
      subsectionId
    );

    if (!subsectionResponses.length) {
      return;
    }

    const restoredAnswers = {};
    const restoredMarked = new Set();

    subsectionResponses.forEach((item) => {
      const questionIndex = questions.findIndex(
        (question) => String(question.id) === String(item.question_id)
      );

      if (questionIndex === -1) {
        return;
      }

      if (
        item.is_answered &&
        item.selected_response !== null &&
        item.selected_response !== undefined
      ) {
        restoredAnswers[questionIndex] = item.selected_response;
      }

      if (item.is_marked) {
        restoredMarked.add(questionIndex);
      }
    });

    if (Object.keys(restoredAnswers).length > 0) {
      setAnswers((previous) => ({
        ...previous,
        ...restoredAnswers,
      }));
    }

    if (restoredMarked.size > 0) {
      setMarked((previous) => {
        const next = new Set(previous);
        restoredMarked.forEach((index) => {
          next.add(index);
        });
        return next;
      });
    }
  }, [activeSectionId, section?.dbId, questions]);

  useEffect(() => {
    if (!activeSectionId) return;
    if (delegatesToChildRunner) return;
    saveAutosave(testType, activeSectionId, {
      currentIndex,
      pageIndex,
      answers,
      marked: Array.from(marked),
      visited: Array.from(visited),
      timeEndsAt,
    });
  }, [
    testType,
    activeSectionId,
    currentIndex,
    pageIndex,
    answers,
    marked,
    visited,
    timeEndsAt,
    delegatesToChildRunner,
  ]);

  const answeredCount = Object.keys(answers).length;
  const progressPct = multiQuestionLayout
    ? ((pageIndex + 1) / totalPages) * 100
    : ((currentIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentIndex];
  const useImageOptionUI =
    activeSectionId === "spatial" || activeSectionId === "mental-agility";

  // const useImageOptionUI = Boolean(currentQuestion?.questionImage);

  const pageStart = pageIndex * QUESTIONS_PER_PAGE;
  const pageQuestions = multiQuestionLayout
    ? questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE)
    : [];

  useLayoutEffect(() => {
    if (!multiQuestionLayout || isLoading) return undefined;

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
  }, [multiQuestionLayout, isLoading, pageIndex, questions.length]);

  const getSectionBarState = (id) => {
    if (id === activeSectionId) return "current";
    if (isSectionComplete(testType, id)) return "completed";
    return "upcoming";
  };

  const goTo = (index) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    setVisited((prev) => new Set(prev).add(index));
  };

  const handleSelect = (qIndex, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));

    const question = questions[qIndex];
    if (!question) return;

    const attemptId = getAttemptId();
    if (!attemptId) {
      console.warn("attempt_id not found");
      return;
    }

    if (section?.dbId === undefined || section?.dbId === null) {
      console.warn("section.dbId not yet resolved — skipping save this tick");
      return;
    }

    saveQuestionResponse({
      attemptId,
      subsectionId: section.dbId,
      questionId: question.id,
      selectedResponse: optionIndex,
    });
  };

  const toggleMark = (qIndex) => {
    let newMarkedValue = false;

    setMarked((previous) => {
      const next = new Set(previous);
      if (next.has(qIndex)) {
        next.delete(qIndex);
        newMarkedValue = false;
      } else {
        next.add(qIndex);
        newMarkedValue = true;
      }
      return next;
    });

    const question = questions[qIndex];
    if (!question) {
      return;
    }

    const attemptId = getAttemptId();
    if (!attemptId) {
      return;
    }

    const subsectionId = section?.dbId ?? activeSectionId;

    saveQuestionMarkStatus({
      attemptId,
      subsectionId,
      questionId: question.id,
      isMarked: newMarkedValue,
    });
  };

  const submitSection = async (autoSubmitted = false) => {
    if (submittedRef.current || isSubmitting) {
      return;
    }

    // =================================================
    // REQUIRE ALL QUESTIONS ANSWERED
    //
    // Skipped when the timer forces an auto-submit — a student who ran
    // out of time should still have whatever they answered sent, not
    // get stuck unable to submit at all.
    // =================================================
    if (!autoSubmitted) {
      const firstUnansweredIndex = questions.findIndex(
        (_, i) => answers[i] === undefined
      );

      if (firstUnansweredIndex !== -1) {
        setSubmitError(
          `Please answer all questions before submitting. Question ${firstUnansweredIndex + 1} is unanswered.`
        );

        if (multiQuestionLayout) {
          jumpToQuestion(firstUnansweredIndex);
        } else {
          goTo(firstUnansweredIndex);
        }

        return;
      }
    }

    const attemptId = getAttemptId();
    const studentId = getStudentId();
    const subsectionId = section?.dbId ?? activeSectionId;

    if (!attemptId) {
      const message = "Attempt ID not found.";
      setSubmitError(message);
      console.error(message);
      return;
    }

    if (!studentId) {
      const message = "Student ID not found.";
      setSubmitError(message);
      console.error(message);
      return;
    }

    if (!subsectionId) {
      const message = "Subsection ID not found.";
      setSubmitError(message);
      console.error(message);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const localResponses = getSubsectionResponses(attemptId, subsectionId);

      console.log("=================================");
      console.log("SUBSECTION SUBMIT");
      console.log("=================================");
      console.log("Attempt ID:", attemptId);
      console.log("Student ID:", studentId);
      console.log("Subsection ID:", subsectionId);
      console.log("Responses:", localResponses);

      const result = await saveStudentResponsesApi({
        attemptId,
        studentId,
        subsectionId,
        responses: localResponses,
      });

      console.log("Student response API success:", result);

      clearSubsectionResponses(attemptId, subsectionId);
      clearAutosave(testType, activeSectionId);

      submittedRef.current = true;

      navigate(`/test/${testType}/${activeSectionId}/summary`, {
        state: {
          answers,
          totalQuestions: section?.totalQuestions ?? questions.length,
          autoSubmitted,
          submittedResponse: result,
        },
      });
    } catch (error) {
      console.error("Student response submit error:", error);

      const message =
        error?.response?.data?.message ??
        error?.response?.data?.detail ??
        "Failed to submit student responses. Please try again.";

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      submitSection(false);
      return;
    }
    goTo(currentIndex + 1);
  };

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

  if (singlePageInterestLayout) {
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
    current: {
      bg: theme.colors.primary,
      color: theme.colors.text.white,
      border: theme.colors.primary,
    },
    answered: { bg: "#ECFDF5", color: "#047857", border: "#34D399" },
    marked: { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
    unvisited: {
      bg: "#FFFFFF",
      color: theme.colors.text.light,
      border: theme.colors.border,
    },
    visited: {
      bg: "#FFFFFF",
      color: theme.colors.text.body,
      border: theme.colors.border,
    },
  };

  const sharedTopBar = (
    <TopBar
      maxWidth="max-w-6xl"
      progressBar={
        isLoading ? (
          <div className="px-5 sm:px-6">
            <Skeleton className="h-1 w-1/4 rounded-none" />
          </div>
        ) : (
          <div className="px-5 sm:px-6">
            <div
              className="h-1 transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: theme.colors.primary,
              }}
            />
          </div>
        )
      }
      center={
        <SectionProgressLabel
          sectionNumber={sectionNumber}
          sectionsTotal={sectionsTotal}
          sectionTitle={section?.title}
          loading={isLoading}
        />
      }
      right={
        <SectionTimer
          endsAt={timeEndsAt}
          loading={isLoading}
          onExpire={handleTimeExpire}
        />
      }
      below={
        <>
          <SectionProgressLabel
            sectionNumber={sectionNumber}
            sectionsTotal={sectionsTotal}
            sectionTitle={section?.title}
            loading={isLoading}
            mobile
          />
          <SectionProgressDots
            sectionOrder={sectionOrder}
            getSectionState={getSectionBarState}
            sectionNumber={sectionNumber}
            sectionsTotal={sectionsTotal}
            loading={isLoading}
            maxWidth="max-w-6xl"
          />
        </>
      }
    />
  );

  if (multiQuestionLayout) {
    return (
      <StudentLayout topBar={sharedTopBar}>
        {!isOnline && <OfflineBanner />}

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
          {subsectionsError && !isLoading && (
            <p
              className="max-w-6xl mx-auto text-sm mb-4"
              style={{ color: "#B91C1C" }}
            >
              Couldn't load this section right now. Please refresh the page.
            </p>
          )}

          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            <div className="w-full lg:flex-1 min-w-0">
              {/* FIX: error banner now rendered as its own full-width block,
                  OUTSIDE the flex row below, so it no longer overlaps the
                  "Page X of Y" / "answered" labels. */}
              {submitError && (
                <div
                  className="mb-5 px-4 py-3 rounded-lg border"
                  style={{
                    color: "#B91C1C",
                    backgroundColor: "#FEF2F2",
                    borderColor: "#FECACA",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span>{submitError}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitError(null);
                      }}
                      className="font-semibold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-5 sm:mb-6">
                {isLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <span
                    className="text-sm sm:text-base font-semibold tracking-wide uppercase"
                    style={{ color: theme.colors.text.light }}
                  >
                    Page {pageIndex + 1} of {totalPages} · Q{pageStart + 1}–
                    {pageStart + pageQuestions.length} of {questions.length}
                  </span>
                )}
                {isLoading ? (
                  <Skeleton className="h-4 w-28 hidden sm:block" />
                ) : (
                  <span
                    className="text-sm sm:text-base hidden sm:block"
                    style={{ color: theme.colors.text.light }}
                  >
                    {answeredCount} of {questions.length} answered
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-5">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-full ${theme.radius.lg} bg-white border px-6 py-6`}
                        style={{ borderColor: theme.colors.border }}
                      >
                        <Skeleton className="h-5 w-11/12 mb-4" />
                        <div className="flex flex-wrap gap-2.5">
                          {[1, 2, 3, 4].map((j) => (
                            <Skeleton
                              key={j}
                              className="h-10 w-28 rounded-md"
                            />
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
                          className={`w-full ${theme.radius.lg} bg-white border px-6 py-5 sm:px-7 sm:py-6 scroll-mt-24 font`}
                          style={{ borderColor: theme.colors.border }}
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <p
                             className="text-base sm:text-lg leading-relaxed flex-1 font-bold"
                              style={{ color: theme.colors.text.heading }}
                            >
                              <span
                                className="mr-2 font-"
                                style={{ color: theme.colors.text.dark }}
                              >
                                {qIndex + 1}.
                              </span>
                              <QuestionPrompt text={q.prompt} />
                            </p>
                            {/* <button
                              type="button"
                              onClick={() => toggleMark(qIndex)}
                              className="shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md border transition-colors"
                              style={{
                                borderColor: isMarked
                                  ? "#FCD34D"
                                  : theme.colors.border,
                                backgroundColor: isMarked
                                  ? "#FEF3C7"
                                  : "#FFFFFF",
                                color: isMarked
                                  ? "#92400E"
                                  : theme.colors.text.body,
                              }}
                            >
                              <Flag className="w-3.5 h-3.5" />
                              {isMarked ? "Marked" : "Mark"}
                            </button> */}
                          </div>

                          <div className="relative">
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
                                        borderColor: isSelected
                                          ? theme.colors.primary
                                          : theme.colors.border,
                                        backgroundColor: isSelected
                                          ? "#EFF6FF"
                                          : "#FFFFFF",
                                      }}
                                    >
                                      <span className="flex items-center gap-3.5 min-w-0">
                                        <span
                                          className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                                          style={{
                                            borderColor: isSelected
                                              ? theme.colors.primary
                                              : "#CBD5E1",
                                          }}
                                        >
                                          {isSelected && (
                                            <span
                                              className="w-3 h-3 rounded-full"
                                              style={{
                                                backgroundColor:
                                                  theme.colors.primary,
                                              }}
                                            />
                                          )}
                                        </span>
                                        <span
                                          className="text-base break-words"
                                          style={{
                                            color: theme.colors.text.heading,
                                          }}
                                        >
                                          {option}
                                        </span>
                                      </span>
                                      <span
                                        className="shrink-0 text-sm font-semibold"
                                        style={{
                                          color: theme.colors.text.light,
                                        }}
                                      >
                                        {letter}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
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
                                        borderColor: isSelected
                                          ? theme.colors.primary
                                          : theme.colors.border,
                                        backgroundColor: isSelected
                                          ? "#EFF6FF"
                                          : "#FFFFFF",
                                        color: theme.colors.text.heading,
                                      }}
                                    >
                                      <span
                                        className="font-semibold"
                                        style={{
                                          color: isSelected
                                            ? theme.colors.primary
                                            : theme.colors.text.light,
                                        }}
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

            <div
              className={`w-full lg:w-64 shrink-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto ${theme.radius.lg} bg-white border border-slate-200 px-5 py-5 sm:py-6`}
            >
              {isLoading ? (
                <Skeleton className="h-4 w-24 mb-4" />
              ) : (
                <h3
                  className="text-sm font-semibold tracking-wide uppercase mb-4"
                  style={{ color: theme.colors.text.light }}
                >
                  Navigator
                </h3>
              )}

              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2.5 mb-5">
                {isLoading
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))
                  : questions.map((_, i) => {
                      const state = getNavState(i);
                      const c = navColors[state];
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => jumpToQuestion(i)}
                          className="aspect-square rounded-lg border text-base font-medium flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: c.bg,
                            color: c.color,
                            borderColor: c.border,
                          }}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
              </div>

              <div className="flex flex-col gap-3">
                {isLoading
                  ? [1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <Skeleton className="w-3.5 h-3.5 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))
                  : [
                      {
                        label: "Answered",
                        color: "#ECFDF5",
                        border: "#34D399",
                      },
                      // { label: "Marked", color: "#FEF3C7", border: "#FCD34D" },
                      {
                        label: "Unvisited",
                        color: "#FFFFFF",
                        border: theme.colors.border,
                      },
                    ].map(({ label, color, border }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full border"
                          style={{
                            backgroundColor: color,
                            borderColor: border,
                          }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: theme.colors.text.body }}
                        >
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
                  color:
                    pageIndex === 0
                      ? theme.colors.text.light
                      : theme.colors.text.body,
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
              <span
                className="text-sm sm:text-base hidden sm:block"
                style={{ color: theme.colors.text.light }}
              >
                {answeredCount} of {questions.length} answered
              </span>
            )}

            {isLoading ? (
              <Skeleton className="h-12 w-32 rounded-lg" />
            ) : (
              <button
                type="button"
                onClick={handleNextPage}
                disabled={isSubmitting}
                className={`flex items-center gap-2 text-base font-semibold px-6 py-3 ${theme.radius.md} transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                style={{
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting
                  ? "Submitting..."
                  : pageIndex === totalPages - 1
                    ? "Submit"
                    : "Next"}

                {!isSubmitting && <ChevronRight className="w-5 h-5" />}
              </button>
            )}
          </div>

          {!isLoading && (
            <p
              className="max-w-6xl mx-auto text-sm text-center mt-4 sm:hidden"
              style={{ color: theme.colors.text.light }}
            >
              {answeredCount} of {questions.length} answered
            </p>
          )}
        </main>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout topBar={sharedTopBar}>
      {!isOnline && <OfflineBanner />}

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        {subsectionsError && !isLoading && (
          <p
            className="max-w-6xl mx-auto text-sm mb-4"
            style={{ color: "#B91C1C" }}
          >
            Couldn't load this section right now. Please refresh the page.
          </p>
        )}

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="w-full lg:flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <span
                  className="text-sm sm:text-base font-semibold tracking-wide uppercase"
                  style={{ color: theme.colors.text.light }}
                >
                  Question {currentIndex + 1} / {questions.length}
                </span>
              )}
              {isLoading ? (
                <Skeleton className="h-9 w-36 rounded-md" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleMark(currentIndex)}
                  className={`flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2 sm:py-2.5 ${theme.radius.md} border transition-colors`}
                  style={{
                    borderColor: marked.has(currentIndex)
                      ? "#FCD34D"
                      : theme.colors.border,
                    backgroundColor: marked.has(currentIndex)
                      ? "#FEF3C7"
                      : "#FFFFFF",
                    color: marked.has(currentIndex)
                      ? "#92400E"
                      : theme.colors.text.body,
                  }}
                >
                  <Flag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  {marked.has(currentIndex) ? "Marked" : "Mark for Review"}
                </button>
              )}
            </div>

            {submitError && (
              <div
                className="mb-5 px-4 py-3 rounded-lg border"
                style={{
                  color: "#B91C1C",
                  backgroundColor: "#FEF2F2",
                  borderColor: "#FECACA",
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <span>{submitError}</span>
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="font-semibold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div
              className={`w-full ${theme.radius.lg} bg-white border border-slate-200 px-6 sm:px-8 py-6 sm:py-7 mb-5 sm:mb-6`}
            >
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-11/12 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </>
              ) : useImageOptionUI ? (
                <div className="flex flex-col items-center">
                  <p
                    className="text-base sm:text-lg leading-relaxed mb-5 text-center"
                    style={{ color: theme.colors.text.heading }}
                  >
                    <QuestionPrompt text={currentQuestion.prompt} />
                  </p>
                  <div
                    className="w-full max-w-xs border-2 rounded-lg p-3 flex items-center justify-center bg-white"
                    style={{ borderColor: theme.colors.border }}
                  >
                    <img
                      src={currentQuestion.questionImage}
                      alt="Question figure (X)"
                      className="max-w-full h-auto object-contain"
                      draggable={false}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.insertAdjacentHTML(
                          "beforeend",
                          '<span style="color:#DC2626;font-size:13px;">Image failed to load — check the file path</span>',
                        );
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p
                  className="text-lg sm:text-xl leading-relaxed"
                  style={{ color: theme.colors.text.heading }}
                >
                  <QuestionPrompt text={currentQuestion.prompt} />
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3 sm:gap-3.5 mb-6 sm:mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-full ${theme.radius.lg} border px-4 sm:px-6 py-3.5 sm:py-4`}
                    style={{ borderColor: theme.colors.border }}
                  >
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
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                          style={{
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : "#F1F5F9",
                            color: isSelected
                              ? "#FFFFFF"
                              : theme.colors.text.heading,
                          }}
                        >
                          {letter}
                        </div>
                        <span
                          className="text-lg font-medium"
                          style={{ color: theme.colors.text.heading }}
                        >
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
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                      }}
                    >
                      <span className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <span
                          className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: isSelected
                              ? theme.colors.primary
                              : "#CBD5E1",
                          }}
                        >
                          {isSelected && (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: theme.colors.primary }}
                            />
                          )}
                        </span>
                        <span
                          className="text-base sm:text-lg break-words"
                          style={{ color: theme.colors.text.heading }}
                        >
                          {option}
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-sm sm:text-base font-semibold"
                        style={{ color: theme.colors.text.light }}
                      >
                        {letter}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {isLoading ? (
                <Skeleton className="h-12 w-32 rounded-lg" />
              ) : (
                <button
                  type="button"
                  onClick={() => goTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className={`flex items-center gap-2 text-base font-medium px-5 py-3 ${theme.radius.md} border transition-colors`}
                  style={{
                    borderColor: theme.colors.border,
                    color:
                      currentIndex === 0
                        ? theme.colors.text.light
                        : theme.colors.text.body,
                    backgroundColor: "#FFFFFF",
                    opacity: currentIndex === 0 ? 0.6 : 1,
                    cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
              )}

              {isLoading ? (
                <Skeleton className="h-4 w-28 hidden sm:block" />
              ) : (
                <span
                  className="text-sm sm:text-base hidden sm:block"
                  style={{ color: theme.colors.text.light }}
                >
                  {answeredCount} of {questions.length} answered
                </span>
              )}

              {isLoading ? (
                <Skeleton className="h-12 w-32 rounded-lg" />
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 text-base font-semibold px-6 py-3 ${theme.radius.md} transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                  style={{
                    opacity: isSubmitting ? 0.6 : 1,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : currentIndex === questions.length - 1
                      ? "Submit"
                      : "Next"}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {!isLoading && (
              <p
                className="text-sm text-center mt-4 sm:hidden"
                style={{ color: theme.colors.text.light }}
              >
                {answeredCount} of {questions.length} answered
              </p>
            )}
          </div>

          <div
            className={`w-full lg:w-64 shrink-0 ${theme.radius.lg} bg-white border border-slate-200 px-5 py-5 sm:py-6`}
          >
            {isLoading ? (
              <Skeleton className="h-4 w-24 mb-4" />
            ) : (
              <h3
                className="text-sm font-semibold tracking-wide uppercase mb-4"
                style={{ color: theme.colors.text.light }}
              >
                Navigator
              </h3>
            )}

            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2.5 mb-5">
              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))
                : questions.map((_, i) => {
                    const state = getNavState(i);
                    const c = navColors[state];
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goTo(i)}
                        className="aspect-square rounded-lg border text-base font-medium flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: c.bg,
                          color: c.color,
                          borderColor: c.border,
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
            </div>

            <div className="flex flex-col gap-3">
              {isLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <Skeleton className="w-3.5 h-3.5 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))
                : [
                    {
                      label: "Current",
                      color: theme.colors.primary,
                      filled: true,
                    },
                    { label: "Answered", color: "#ECFDF5", border: "#34D399" },
                    { label: "Marked", color: "#FEF3C7", border: "#FCD34D" },
                    {
                      label: "Unvisited",
                      color: "#FFFFFF",
                      border: theme.colors.border,
                    },
                  ].map(({ label, color, border, filled }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: filled ? color : color,
                          borderColor: border || color,
                        }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: theme.colors.text.body }}
                      >
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

// import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
//   import { useParams, useNavigate } from "react-router-dom";
//   import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
//   import theme from "../../theme/theme";
//   import { useTestSubsections, useTestSubsection } from "../hooks/useTestSubsections";
//   import { isTestComplete, isSectionComplete } from "./testProgress";
//   import { saveAutosave, loadAutosave, clearAutosave } from "../hooks/testAutosave";
//   import { useStudentQuestions } from "../hooks/useStudentQuestions";
//   import Skeleton from "../ui/Skeleton";
//   import OfflineBanner from "../ui/OfflineBanner";
//   import useOnlineStatus from "../hooks/useOnlineStatus";
//   import { toast as toastManager, useToastManager } from "@/components/ui/toast";
//   import RapidAssessmentRunner from "./RapidAssessmentRunner";
//   import ImageAssessmentRunner from "./ImageAssessmentRunner";
//   import InterestAssessmentRunner from "./InterestAssessmentRunner";
//   import StudentLayout, {
//     TopBar,
//     SectionTimer,
//     SectionProgressLabel,
//     SectionProgressDots,
//   } from "../layouts/StudentLayout";

//   // Sections that use the "many questions per page, options in one row" layout
//   // const MULTI_QUESTION_SECTIONS = ["quantitative", "verbal", "reasoning"];
//   const QUESTIONS_PER_PAGE = 10;

//   const AssessmentRunner = () => {
//     const { testType = "aptitude", sectionId } = useParams();
//     const navigate = useNavigate();
//     const isOnline = useOnlineStatus();
//     const isFirstOnlineCheck = useRef(true);
//     const managerFromHook = useToastManager && useToastManager();

//     // `tabs` is every subsection for this test, in display order, merged
//     // with its local QUESTION_BANKS entry (questions/groups/layout/etc).
//     // `sectionId` from the route may be absent (e.g. landing on the test
//     // without a specific subsection) — in that case we fall back to the
//     // first subsection once `tabs` has loaded.
//     const { tabs, loading: subsectionsLoading, error: subsectionsError } = useTestSubsections(testType);

//     const sectionOrder = tabs.map((t) => t.id);
//     const activeSectionId = sectionId || sectionOrder[0];
//     const section = tabs.find((t) => t.id === activeSectionId) || null;

//     // Fetch questions from API, fallback to test data
//     const { questions: apiQuestions, loading: apiQuestionsLoading } = useStudentQuestions(section?.dbId);
//     const questions = apiQuestions.length > 0 ? apiQuestions : (section?.questions || []);

//     const sectionsTotal = sectionOrder.length;
//     const sectionIndex = Math.max(0, sectionOrder.indexOf(activeSectionId));
//     const sectionNumber = sectionIndex + 1;

//     // "single-page" = Rapid Assessment's grouped comparison layout.
//     // "single-page-image" = image-based questions (Visual Reasoning,
//     // Mental Agility) shown all at once instead of one-per-page.
//     const singlePageLayout = section?.layout === "single-page";
//     const singlePageImageLayout = section?.layout === "single-page-image";
//     const singlePageInterestLayout = section?.layout === "single-page-interest";
//     // const multiQuestionLayout = MULTI_QUESTION_SECTIONS.includes(activeSectionId);
//     const multiQuestionLayout = section?.layout === "multi-question";
//     const totalPages = multiQuestionLayout
//       ? Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE))
//       : 1;

//     // Restore any autosaved progress for this section (survives refresh /
//     // network drop / tab close). Falls back to blank state if nothing saved.
//     const [currentIndex, setCurrentIndex] = useState(
//       () => loadAutosave(testType, activeSectionId)?.currentIndex ?? 0
//     );
//     const [pageIndex, setPageIndex] = useState(
//       () => loadAutosave(testType, activeSectionId)?.pageIndex ?? 0
//     );
//     const [answers, setAnswers] = useState(
//       () => loadAutosave(testType, activeSectionId)?.answers ?? {}
//     );
//     const [marked, setMarked] = useState(
//       () => new Set(loadAutosave(testType, activeSectionId)?.marked ?? [])
//     );
//     const [visited, setVisited] = useState(
//       () => new Set(loadAutosave(testType, activeSectionId)?.visited ?? [0])
//     );
//     const submittedRef = useRef(false);
//     const [loading, setLoading] = useState(true);

//     // section still resolving (subsection lookup + API fetch), or the
//     // short fake-loading delay for the skeleton — either way, nothing
//     // below can render real content yet.
//     const isLoading = loading || subsectionsLoading || apiQuestionsLoading || !section;

//     // --- option-wrap detection (multi-question layout only) -----------------
//     // Each question's options normally render as a single horizontal row.
//     // If a question's options are too long to fit on one line, we fall back
//     // to the vertical, one-option-per-line style used in the single-question
//     // layout, but only for that specific question.
//     const optionsRowRefs = useRef({});
//     const [wrappedQuestions, setWrappedQuestions] = useState({});

//     useEffect(() => {
//       const link = document.createElement("link");
//       link.rel = "stylesheet";
//       link.href =
//         "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
//       document.head.appendChild(link);
//       return () => document.head.removeChild(link);
//     }, []);

//     useEffect(() => {
//       const timer = setTimeout(() => setLoading(false), 300);
//       return () => clearTimeout(timer);
//     }, []);

//     useEffect(() => {
//       if (isFirstOnlineCheck.current) {
//         isFirstOnlineCheck.current = false;
//         return;
//       }

//       const manager = managerFromHook || toastManager;
//       const send = (payload) => {
//         if (!manager) return;
//         if (typeof manager.create === "function") return manager.create(payload);
//         if (typeof manager.add === "function") return manager.add(payload);
//         if (typeof manager.push === "function") return manager.push(payload);
//         return undefined;
//       };

//       if (isOnline) {
//         send({ title: "Back online", description: "Your connection has been restored.", type: "success" });
//       } else {
//         send({ title: "No internet connection", description: "Please reconnect to continue your assessment.", type: "error" });
//       }
//     }, [isOnline]);

//     // Whenever the active section changes, restore whatever was autosaved
//     // for the NEW section (instead of always blanking to defaults). If
//     // nothing was saved for that section yet, this naturally falls back to
//     // a fresh start. Also fires once `activeSectionId` resolves from
//     // undefined -> an actual id (e.g. no sectionId in the route, waiting
//     // on `tabs` to load) so the initial lazy-state reads aren't stale.
//     useEffect(() => {
//       const saved = loadAutosave(testType, activeSectionId);
//       setCurrentIndex(saved?.currentIndex ?? 0);
//       setPageIndex(saved?.pageIndex ?? 0);
//       setAnswers(saved?.answers ?? {});
//       setMarked(new Set(saved?.marked ?? []));
//       setVisited(new Set(saved?.visited ?? [0]));
//       submittedRef.current = false;
//       optionsRowRefs.current = {};
//       setWrappedQuestions({});
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [testType, activeSectionId]);

//     // Don't evaluate completion until we actually have a resolved section
//     // list — an empty `sectionOrder` (still loading) would vacuously look
//     // "complete" and bounce the user back to /test.
//     useEffect(() => {
//       if (!activeSectionId || tabs.length === 0) return;
//       const testDone = isTestComplete(testType, sectionOrder);
//       const sectionDone = isSectionComplete(testType, activeSectionId);
//       if (testDone || sectionDone) {
//         navigate("/test", { replace: true });
//       }
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [testType, activeSectionId, tabs.length]);

//     // Persist progress to localStorage on every change so a dropped
//     // connection or refresh doesn't lose answers.
//     useEffect(() => {
//       if (!activeSectionId) return;
//       saveAutosave(testType, activeSectionId, {
//         currentIndex,
//         pageIndex,
//         answers,
//         marked: Array.from(marked),
//         visited: Array.from(visited),
//       });
//     }, [testType, activeSectionId, currentIndex, pageIndex, answers, marked, visited]);

//     const answeredCount = Object.keys(answers).length;
//     const progressPct = multiQuestionLayout
//       ? ((pageIndex + 1) / totalPages) * 100
//       : ((currentIndex + 1) / questions.length) * 100;
//     const currentQuestion = questions[currentIndex];
//     const useImageOptionUI =
//       activeSectionId === "spatial" ||
//       activeSectionId === "mental-agility";

//     const pageStart = pageIndex * QUESTIONS_PER_PAGE;
//     const pageQuestions = multiQuestionLayout
//       ? questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE)
//       : [];

//     // Measure each question's (hidden) single-row option clone. If its
//     // buttons land on more than one visual row, that question is flagged as
//     // "wrapped" and rendered with the vertical, one-per-line option style
//     // instead. Re-measures on resize so rotating a device / resizing a
//     // window re-evaluates the layout.
//     useLayoutEffect(() => {
//       if (!multiQuestionLayout || isLoading) return undefined;

//       const measure = () => {
//         setWrappedQuestions((prev) => {
//           let changed = false;
//           const next = { ...prev };
//           pageQuestions.forEach((_, i) => {
//             const qIndex = pageStart + i;
//             const container = optionsRowRefs.current[qIndex];
//             if (!container) return;
//             const buttons = Array.from(container.children);
//             if (buttons.length < 2) return;
//             const firstTop = buttons[0].offsetTop;
//             const wraps = buttons.some((b) => b.offsetTop !== firstTop);
//             if (next[qIndex] !== wraps) {
//               next[qIndex] = wraps;
//               changed = true;
//             }
//           });
//           return changed ? next : prev;
//         });
//       };

//       const raf = requestAnimationFrame(measure);
//       window.addEventListener("resize", measure);
//       return () => {
//         cancelAnimationFrame(raf);
//         window.removeEventListener("resize", measure);
//       };
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [multiQuestionLayout, isLoading, pageIndex, questions.length]);

//     const getSectionBarState = (id) => {
//       if (id === activeSectionId) return "current";
//       if (isSectionComplete(testType, id)) return "completed";
//       return "upcoming";
//     };

//     const goTo = (index) => {
//       if (index < 0 || index >= questions.length) return;
//       setCurrentIndex(index);
//       setVisited((prev) => new Set(prev).add(index));
//     };

//     const handleSelect = (qIndex, optionIndex) => {
//       setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
//     };

//     const toggleMark = (qIndex) => {
//       setMarked((prev) => {
//         const next = new Set(prev);
//         if (next.has(qIndex)) next.delete(qIndex);
//         else next.add(qIndex);
//         return next;
//       });
//     };

//     const submitSection = (autoSubmitted = false) => {
//       if (submittedRef.current) return;
//       submittedRef.current = true;
//       clearAutosave(testType, activeSectionId);
//       navigate(`/test/${testType}/${activeSectionId}/summary`, {
//         state: { answers, totalQuestions: section?.totalQuestions ?? questions.length, autoSubmitted },
//       });
//     };

//     const handleNext = () => {
//       if (currentIndex === questions.length - 1) {
//         submitSection(false);
//         return;
//       }
//       goTo(currentIndex + 1);
//     };

//     // Fired once by SectionTimer when the countdown hits zero.
//     const handleTimeExpire = () => {
//       submitSection(true);
//     };

//     const goToPage = (p) => {
//       if (p < 0 || p >= totalPages) return;
//       setPageIndex(p);
//       scrollTo({ top: 0, behavior: "smooth" });
//     };

//     const handleNextPage = () => {
//       if (pageIndex === totalPages - 1) {
//         submitSection(false);
//         return;
//       }
//       goToPage(pageIndex + 1);
//     };

//     const jumpToQuestion = (qIndex) => {
//       const targetPage = Math.floor(qIndex / QUESTIONS_PER_PAGE);
//       const scrollToCard = () =>
//         document
//           .getElementById(`mq-question-${qIndex}`)
//           ?.scrollIntoView({ behavior: "smooth", block: "center" });

//       if (targetPage !== pageIndex) {
//         setPageIndex(targetPage);
//         requestAnimationFrame(() => requestAnimationFrame(scrollToCard));
//       } else {
//         scrollToCard();
//       }
//     };

//     if (singlePageLayout) {
//       return <RapidAssessmentRunner />;
//     }

//     if (singlePageImageLayout) {
//       return <ImageAssessmentRunner />;
//     }

//       if (singlePageInterestLayout) {          // ← add
//       return <InterestAssessmentRunner />;
//     }

//     const getNavState = (index) => {
//       if (!multiQuestionLayout && index === currentIndex) return "current";
//       if (marked.has(index)) return "marked";
//       if (answers[index] !== undefined) return "answered";
//       if (visited.has(index)) return "visited";
//       return "unvisited";
//     };

//     const navColors = {
//       current: { bg: theme.colors.primary, color: theme.colors.text.white, border: theme.colors.primary },
//       answered: { bg: "#ECFDF5", color: "#047857", border: "#34D399" },
//       marked: { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
//       unvisited: { bg: "#FFFFFF", color: theme.colors.text.light, border: theme.colors.border },
//       visited: { bg: "#FFFFFF", color: theme.colors.text.body, border: theme.colors.border },
//     };

//     const sharedTopBar = (
//       <TopBar
//         maxWidth="max-w-6xl"
//         progressBar={
//           isLoading ? (
//             <div className="px-5 sm:px-6">
//               <Skeleton className="h-1 w-1/4 rounded-none" />
//             </div>
//           ) : (
//             <div className="px-5 sm:px-6">
//               <div
//                 className="h-1 transition-all duration-300"
//                 style={{ width: `${progressPct}%`, backgroundColor: theme.colors.primary }}
//               />
//             </div>
//           )
//         }
//         center={
//           <SectionProgressLabel
//             sectionNumber={sectionNumber}
//             sectionsTotal={sectionsTotal}
//             sectionTitle={section?.title}
//             loading={isLoading}
//           />
//         }
//         right={
//           <SectionTimer
//             timeLimitSeconds={section?.timeLimitSeconds}
//             resetKey={activeSectionId}
//             loading={isLoading}
//             onExpire={handleTimeExpire}
//           />
//         }
//         below={
//           <>
//             <SectionProgressLabel
//               sectionNumber={sectionNumber}
//               sectionsTotal={sectionsTotal}
//               sectionTitle={section?.title}
//               loading={isLoading}
//               mobile
//             />
//             <SectionProgressDots
//               sectionOrder={sectionOrder}
//               getSectionState={getSectionBarState}
//               sectionNumber={sectionNumber}
//               sectionsTotal={sectionsTotal}
//               loading={isLoading}
//               maxWidth="max-w-6xl"
//             />
//           </>
//         }
//       />
//     );

//     // ------------------------------------------------------------------
//     // MULTI-QUESTION LAYOUT (quantitative / verbal / reasoning)
//     // 10 questions per page, scrollable list. Options render in one row by
//     // default; any question whose options don't fit on one line falls back
//     // to the vertical, one-option-per-line style automatically.
//     // ------------------------------------------------------------------
//     if (multiQuestionLayout) {
//       return (
//         <StudentLayout topBar={sharedTopBar}>
//           {!isOnline && <OfflineBanner />}

//           <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
//             {subsectionsError && !isLoading && (
//               <p className="max-w-6xl mx-auto text-sm mb-4" style={{ color: "#B91C1C" }}>
//                 Couldn't load this section right now. Please refresh the page.
//               </p>
//             )}

//             <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

//               {/* Scrollable question list */}
//               <div className="w-full lg:flex-1 min-w-0">
//                 <div className="flex items-center justify-between mb-5 sm:mb-6">
//                   {isLoading ? (
//                     <Skeleton className="h-4 w-48" />
//                   ) : (
//                     <span className="text-sm sm:text-base font-semibold tracking-wide uppercase" style={{ color: theme.colors.text.light }}>
//                       Page {pageIndex + 1} of {totalPages} · Q{pageStart + 1}–{pageStart + pageQuestions.length} of {questions.length}
//                     </span>
//                   )}
//                   {isLoading ? (
//                     <Skeleton className="h-4 w-28 hidden sm:block" />
//                   ) : (
//                     <span className="text-sm sm:text-base hidden sm:block" style={{ color: theme.colors.text.light }}>
//                       {answeredCount} of {questions.length} answered
//                     </span>
//                   )}
//                 </div>

//                 <div className="flex flex-col gap-5">
//                   {isLoading
//                     ? Array.from({ length: 4 }).map((_, i) => (
//                         <div key={i} className={`w-full ${theme.radius.lg} bg-white border px-6 py-6`} style={{ borderColor: theme.colors.border }}>
//                           <Skeleton className="h-5 w-11/12 mb-4" />
//                           <div className="flex flex-wrap gap-2.5">
//                             {[1, 2, 3, 4].map((j) => (
//                               <Skeleton key={j} className="h-10 w-28 rounded-md" />
//                             ))}
//                           </div>
//                         </div>
//                       ))
//                     : pageQuestions.map((q, i) => {
//                         const qIndex = pageStart + i;
//                         const isMarked = marked.has(qIndex);
//                         const isWrapped = !!wrappedQuestions[qIndex];
//                         return (
//                           <div
//                             id={`mq-question-${qIndex}`}
//                             key={qIndex}
//                             className={`w-full ${theme.radius.lg} bg-white border px-6 py-5 sm:px-7 sm:py-6 scroll-mt-24`}
//                             style={{ borderColor: theme.colors.border }}
//                           >
//                             <div className="flex items-start justify-between gap-4 mb-4">
//                               <p className="text-base sm:text-lg leading-relaxed flex-1" style={{ color: theme.colors.text.heading }}>
//                                 <span className="mr-2 font-semibold" style={{ color: theme.colors.text.light }}>
//                                   {qIndex + 1}.
//                                 </span>
//                                 {q.prompt}
//                               </p>
//                               <button
//                                 type="button"
//                                 onClick={() => toggleMark(qIndex)}
//                                 className="shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md border transition-colors"
//                                 style={{
//                                   borderColor: isMarked ? "#FCD34D" : theme.colors.border,
//                                   backgroundColor: isMarked ? "#FEF3C7" : "#FFFFFF",
//                                   color: isMarked ? "#92400E" : theme.colors.text.body,
//                                 }}
//                               >
//                                 <Flag className="w-3.5 h-3.5" />
//                                 {isMarked ? "Marked" : "Mark"}
//                               </button>
//                             </div>

//                             <div className="relative">
//                               {/* Hidden single-row clone used only to detect wrapping.
//                                   Kept in sync with the real options so we can tell
//                                   whether they'd overflow one line. */}
//                               <div
//                                 ref={(el) => {
//                                   if (el) optionsRowRefs.current[qIndex] = el;
//                                 }}
//                                 className="flex flex-wrap gap-2.5 invisible absolute inset-x-0 top-0 pointer-events-none -z-10"
//                                 aria-hidden="true"
//                               >
//                                 {q.options.map((option, oi) => (
//                                   <span
//                                     key={oi}
//                                     className="text-sm sm:text-base font-medium px-4 py-2.5 rounded-md border"
//                                   >
//                                     {String.fromCharCode(65 + oi)}. {option}
//                                   </span>
//                                 ))}
//                               </div>

//                               {isWrapped ? (
//                                 // Options didn't fit on one line — fall back to the
//                                 // vertical, one-option-per-line style.
//                                 <div className="flex flex-col gap-3">
//                                   {q.options.map((option, oi) => {
//                                     const isSelected = answers[qIndex] === oi;
//                                     const letter = String.fromCharCode(65 + oi);
//                                     return (
//                                       <button
//                                         key={oi}
//                                         type="button"
//                                         onClick={() => handleSelect(qIndex, oi)}
//                                         className={`w-full flex items-center justify-between gap-3 ${theme.radius.lg} border px-5 py-3.5 text-left transition-colors`}
//                                         style={{
//                                           borderColor: isSelected ? theme.colors.primary : theme.colors.border,
//                                           backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
//                                         }}
//                                       >
//                                         <span className="flex items-center gap-3.5 min-w-0">
//                                           <span
//                                             className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
//                                             style={{ borderColor: isSelected ? theme.colors.primary : "#CBD5E1" }}
//                                           >
//                                             {isSelected && (
//                                               <span
//                                                 className="w-3 h-3 rounded-full"
//                                                 style={{ backgroundColor: theme.colors.primary }}
//                                               />
//                                             )}
//                                           </span>
//                                           <span className="text-base break-words" style={{ color: theme.colors.text.heading }}>
//                                             {option}
//                                           </span>
//                                         </span>
//                                         <span className="shrink-0 text-sm font-semibold" style={{ color: theme.colors.text.light }}>
//                                           {letter}
//                                         </span>
//                                       </button>
//                                     );
//                                   })}
//                                 </div>
//                               ) : (
//                                 // Default: options in a single horizontal row.
//                                 <div className="flex flex-wrap gap-2.5">
//                                   {q.options.map((option, oi) => {
//                                     const isSelected = answers[qIndex] === oi;
//                                     const letter = String.fromCharCode(65 + oi);
//                                     return (
//                                       <button
//                                         key={oi}
//                                         type="button"
//                                         onClick={() => handleSelect(qIndex, oi)}
//                                         className="flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2.5 rounded-md border transition-colors"
//                                         style={{
//                                           borderColor: isSelected ? theme.colors.primary : theme.colors.border,
//                                           backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
//                                           color: theme.colors.text.heading,
//                                         }}
//                                       >
//                                         <span
//                                           className="font-semibold"
//                                           style={{ color: isSelected ? theme.colors.primary : theme.colors.text.light }}
//                                         >
//                                           {letter}.
//                                         </span>
//                                         {option}
//                                       </button>
//                                     );
//                                   })}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })}
//                 </div>
//               </div>

//               {/* Navigator panel — jumps to & scrolls the question into view.
//                   Stays fixed in place on desktop while the question list
//                   scrolls past it. */}
//               <div className={`w-full lg:w-64 shrink-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto ${theme.radius.lg} bg-white border border-slate-200 px-5 py-5 sm:py-6`}>
//                 {isLoading ? (
//                   <Skeleton className="h-4 w-24 mb-4" />
//                 ) : (
//                   <h3 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: theme.colors.text.light }}>
//                     Navigator
//                   </h3>
//                 )}

//                 <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2.5 mb-5">
//                   {isLoading
//                     ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
//                     : questions.map((_, i) => {
//                         const state = getNavState(i);
//                         const c = navColors[state];
//                         return (
//                           <button
//                             key={i}
//                             type="button"
//                             onClick={() => jumpToQuestion(i)}
//                             className="aspect-square rounded-lg border text-base font-medium flex items-center justify-center transition-colors"
//                             style={{ backgroundColor: c.bg, color: c.color, borderColor: c.border }}
//                           >
//                             {i + 1}
//                           </button>
//                         );
//                       })}
//                 </div>

//                 <div className="flex flex-col gap-3">
//                   {isLoading
//                     ? [1, 2, 3, 4].map((i) => (
//                         <div key={i} className="flex items-center gap-2.5">
//                           <Skeleton className="w-3.5 h-3.5 rounded-full" />
//                           <Skeleton className="h-3 w-24" />
//                         </div>
//                       ))
//                     : [
//                         { label: "Answered", color: "#ECFDF5", border: "#34D399" },
//                         { label: "Marked", color: "#FEF3C7", border: "#FCD34D" },
//                         { label: "Unvisited", color: "#FFFFFF", border: theme.colors.border },
//                       ].map(({ label, color, border }) => (
//                         <div key={label} className="flex items-center gap-2.5">
//                           <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color, borderColor: border }} />
//                           <span className="text-sm" style={{ color: theme.colors.text.body }}>
//                             {label}
//                           </span>
//                         </div>
//                       ))}
//                 </div>
//               </div>
//             </div>

//             {/* Previous / Next — sits at the very end of the page, below both
//                 the question list and the navigator. Normal document flow;
//                 not sticky or fixed. */}
//             <div className="max-w-6xl mx-auto mt-6 flex items-center justify-between gap-3">
//               {isLoading ? (
//                 <Skeleton className="h-12 w-32 rounded-lg" />
//               ) : (
//                 <button
//                   type="button"
//                   onClick={() => goToPage(pageIndex - 1)}
//                   disabled={pageIndex === 0}
//                   className={`flex items-center gap-2 text-base font-medium px-5 py-3 ${theme.radius.md} border transition-colors`}
//                   style={{
//                     borderColor: theme.colors.border,
//                     color: pageIndex === 0 ? theme.colors.text.light : theme.colors.text.body,
//                     backgroundColor: "#FFFFFF",
//                     opacity: pageIndex === 0 ? 0.6 : 1,
//                     cursor: pageIndex === 0 ? "not-allowed" : "pointer",
//                   }}
//                 >
//                   <ChevronLeft className="w-5 h-5" />
//                   Previous 10
//                 </button>
//               )}

//               {!isLoading && (
//                 <span className="text-sm sm:text-base hidden sm:block" style={{ color: theme.colors.text.light }}>
//                   {answeredCount} of {questions.length} answered
//                 </span>
//               )}

//               {isLoading ? (
//                 <Skeleton className="h-12 w-32 rounded-lg" />
//               ) : (
//                 <button
//                   type="button"
//                   onClick={handleNextPage}
//                   className={`flex items-center gap-2 text-base font-semibold px-6 py-3 ${theme.radius.md} transition-colors ${theme.button.primary} ${theme.shadow.button}`}
//                 >
//                   {pageIndex === totalPages - 1 ? "Submit" : "Next"}
//                   <ChevronRight className="w-5 h-5" />
//                 </button>
//               )}
//             </div>

//             {!isLoading && (
//               <p className="max-w-6xl mx-auto text-sm text-center mt-4 sm:hidden" style={{ color: theme.colors.text.light }}>
//                 {answeredCount} of {questions.length} answered
//               </p>
//             )}
//           </main>
//         </StudentLayout>
//       );
//     }

//     // ------------------------------------------------------------------
//     // SINGLE-QUESTION LAYOUT (fallback — any other section not covered by
//     // the multi-question, rapid single-page, or image single-page layouts)
//     // ------------------------------------------------------------------
//     return (
//       <StudentLayout topBar={sharedTopBar}>
//         {!isOnline && <OfflineBanner />}

//         <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
//           {subsectionsError && !isLoading && (
//             <p className="max-w-6xl mx-auto text-sm mb-4" style={{ color: "#B91C1C" }}>
//               Couldn't load this section right now. Please refresh the page.
//             </p>
//           )}

//           <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

//             {/* Question column */}
//             <div className="w-full lg:flex-1 min-w-0">
//               <div className="flex items-center justify-between mb-5 sm:mb-6">
//                 {isLoading ? (
//                   <Skeleton className="h-4 w-32" />
//                 ) : (
//                   <span className="text-sm sm:text-base font-semibold tracking-wide uppercase" style={{ color: theme.colors.text.light }}>
//                     Question {currentIndex + 1} / {questions.length}
//                   </span>
//                 )}
//                 {isLoading ? (
//                   <Skeleton className="h-9 w-36 rounded-md" />
//                 ) : (
//                   <button
//                     type="button"
//                     onClick={() => toggleMark(currentIndex)}
//                     className={`flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2 sm:py-2.5 ${theme.radius.md} border transition-colors`}
//                     style={{
//                       borderColor: marked.has(currentIndex) ? "#FCD34D" : theme.colors.border,
//                       backgroundColor: marked.has(currentIndex) ? "#FEF3C7" : "#FFFFFF",
//                       color: marked.has(currentIndex) ? "#92400E" : theme.colors.text.body,
//                     }}
//                   >
//                     <Flag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
//                     {marked.has(currentIndex) ? "Marked" : "Mark for Review"}
//                   </button>
//                 )}
//               </div>

//               <div className={`w-full ${theme.radius.lg} bg-white border border-slate-200 px-6 sm:px-8 py-6 sm:py-7 mb-5 sm:mb-6`}>
//                 {isLoading ? (
//                   <>
//                     <Skeleton className="h-4 w-full mb-2" />
//                     <Skeleton className="h-4 w-11/12 mb-2" />
//                     <Skeleton className="h-4 w-2/3" />
//                   </>
//                 ) : useImageOptionUI ? (
//                   <div className="flex flex-col items-center">
//                     <p className="text-base sm:text-lg leading-relaxed mb-5 text-center" style={{ color: theme.colors.text.heading }}>
//                       {currentQuestion.prompt}
//                     </p>
//                     <div className="w-full max-w-xs border-2 rounded-lg p-3 flex items-center justify-center bg-white" style={{ borderColor: theme.colors.border }}>
//                       <img
//                         src={currentQuestion.questionImage}
//                         alt="Question figure (X)"
//                         className="max-w-full h-auto object-contain"
//                         draggable={false}
//                         onError={(e) => {
//                           e.currentTarget.style.display = "none";
//                           e.currentTarget.parentElement.insertAdjacentHTML(
//                             "beforeend",
//                             '<span style="color:#DC2626;font-size:13px;">Image failed to load — check the file path</span>'
//                           );
//                         }}
//                       />
//                     </div>
//                   </div>
//                 ) : (
//                   <p className="text-lg sm:text-xl leading-relaxed" style={{ color: theme.colors.text.heading }}>
//                     {currentQuestion.prompt}
//                   </p>
//                 )}
//               </div>

//               {isLoading ? (
//                 <div className="flex flex-col gap-3 sm:gap-3.5 mb-6 sm:mb-8">
//                   {[1, 2, 3, 4].map((i) => (
//                     <div key={i} className={`w-full ${theme.radius.lg} border px-4 sm:px-6 py-3.5 sm:py-4`} style={{ borderColor: theme.colors.border }}>
//                       <div className="flex items-center gap-4">
//                         <Skeleton className="w-5 h-5 rounded-full" />
//                         <Skeleton className="h-4 flex-1" />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : useImageOptionUI ? (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
//                   {currentQuestion.options.map((option, i) => {
//                     const isSelected = answers[currentIndex] === i;
//                     const letter = String.fromCharCode(65 + i);
//                     return (
//                       <button
//                         key={i}
//                         type="button"
//                         onClick={() => handleSelect(currentIndex, i)}
//                         className="w-full rounded-xl border-2 px-5 py-4 text-left transition-all duration-200"
//                         style={{
//                           borderColor: isSelected ? theme.colors.primary : theme.colors.border,
//                           backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
//                         }}
//                       >
//                         <div className="flex items-center gap-4">
//                           <div
//                             className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
//                             style={{
//                               backgroundColor: isSelected ? theme.colors.primary : "#F1F5F9",
//                               color: isSelected ? "#FFFFFF" : theme.colors.text.heading,
//                             }}
//                           >
//                             {letter}
//                           </div>
//                           <span className="text-lg font-medium" style={{ color: theme.colors.text.heading }}>
//                             {option}
//                           </span>
//                         </div>
//                       </button>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <div className="flex flex-col gap-3.5 sm:gap-4 mb-6 sm:mb-8">
//                   {currentQuestion.options.map((option, i) => {
//                     const isSelected = answers[currentIndex] === i;
//                     const letter = String.fromCharCode(65 + i);
//                     return (
//                       <button
//                         key={i}
//                         type="button"
//                         onClick={() => handleSelect(currentIndex, i)}
//                         className={`w-full flex items-center justify-between gap-3 ${theme.radius.lg} border px-5 sm:px-7 py-4 sm:py-4.5 text-left transition-colors`}
//                         style={{
//                           borderColor: isSelected ? theme.colors.primary : theme.colors.border,
//                           backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
//                         }}
//                       >
//                         <span className="flex items-center gap-3.5 sm:gap-4 min-w-0">
//                           <span
//                             className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
//                             style={{ borderColor: isSelected ? theme.colors.primary : "#CBD5E1" }}
//                           >
//                             {isSelected && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }} />}
//                           </span>
//                           <span className="text-base sm:text-lg break-words" style={{ color: theme.colors.text.heading }}>
//                             {option}
//                           </span>
//                         </span>
//                         <span className="shrink-0 text-sm sm:text-base font-semibold" style={{ color: theme.colors.text.light }}>
//                           {letter}
//                         </span>
//                       </button>
//                     );
//                   })}
//                 </div>
//               )}

//               <div className="flex items-center justify-between gap-3">
//                 {isLoading ? (
//                   <Skeleton className="h-12 w-32 rounded-lg" />
//                 ) : (
//                   <button
//                     type="button"
//                     onClick={() => goTo(currentIndex - 1)}
//                     disabled={currentIndex === 0}
//                     className={`flex items-center gap-2 text-base font-medium px-5 py-3 ${theme.radius.md} border transition-colors`}
//                     style={{
//                       borderColor: theme.colors.border,
//                       color: currentIndex === 0 ? theme.colors.text.light : theme.colors.text.body,
//                       backgroundColor: "#FFFFFF",
//                       opacity: currentIndex === 0 ? 0.6 : 1,
//                       cursor: currentIndex === 0 ? "not-allowed" : "pointer",
//                     }}
//                   >
//                     <ChevronLeft className="w-5 h-5" />
//                     Previous
//                   </button>
//                 )}

//                 {isLoading ? (
//                   <Skeleton className="h-4 w-28 hidden sm:block" />
//                 ) : (
//                   <span className="text-sm sm:text-base hidden sm:block" style={{ color: theme.colors.text.light }}>
//                     {answeredCount} of {questions.length} answered
//                   </span>
//                 )}

//                 {isLoading ? (
//                   <Skeleton className="h-12 w-32 rounded-lg" />
//                 ) : (
//                   <button
//                     type="button"
//                     onClick={handleNext}
//                     className={`flex items-center gap-2 text-base font-semibold px-6 py-3 ${theme.radius.md} transition-colors ${theme.button.primary} ${theme.shadow.button}`}
//                   >
//                     {currentIndex === questions.length - 1 ? "Submit" : "Next"}
//                     <ChevronRight className="w-5 h-5" />
//                   </button>
//                 )}
//               </div>

//               {!isLoading && (
//                 <p className="text-sm text-center mt-4 sm:hidden" style={{ color: theme.colors.text.light }}>
//                   {answeredCount} of {questions.length} answered
//                 </p>
//               )}
//             </div>

//             {/* Navigator panel */}
//             <div className={`w-full lg:w-64 shrink-0 ${theme.radius.lg} bg-white border border-slate-200 px-5 py-5 sm:py-6`}>
//               {isLoading ? (
//                 <Skeleton className="h-4 w-24 mb-4" />
//               ) : (
//                 <h3 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: theme.colors.text.light }}>
//                   Navigator
//                 </h3>
//               )}

//               <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2.5 mb-5">
//                 {isLoading
//                   ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
//                   : questions.map((_, i) => {
//                       const state = getNavState(i);
//                       const c = navColors[state];
//                       return (
//                         <button
//                           key={i}
//                           type="button"
//                           onClick={() => goTo(i)}
//                           className="aspect-square rounded-lg border text-base font-medium flex items-center justify-center transition-colors"
//                           style={{ backgroundColor: c.bg, color: c.color, borderColor: c.border }}
//                         >
//                           {i + 1}
//                         </button>
//                       );
//                     })}
//               </div>

//               <div className="flex flex-col gap-3">
//                 {isLoading
//                   ? [1, 2, 3, 4].map((i) => (
//                       <div key={i} className="flex items-center gap-2.5">
//                         <Skeleton className="w-3.5 h-3.5 rounded-full" />
//                         <Skeleton className="h-3 w-24" />
//                       </div>
//                     ))
//                   : [
//                       { label: "Current", color: theme.colors.primary, filled: true },
//                       { label: "Answered", color: "#ECFDF5", border: "#34D399" },
//                       { label: "Marked", color: "#FEF3C7", border: "#FCD34D" },
//                       { label: "Unvisited", color: "#FFFFFF", border: theme.colors.border },
//                     ].map(({ label, color, border, filled }) => (
//                       <div key={label} className="flex items-center gap-2.5">
//                         <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: filled ? color : color, borderColor: border || color }} />
//                         <span className="text-sm" style={{ color: theme.colors.text.body }}>
//                           {label}
//                         </span>
//                       </div>
//                     ))}
//               </div>
//             </div>
//           </div>
//         </main>
//       </StudentLayout>
//     );
//   };

//   export default AssessmentRunner;
