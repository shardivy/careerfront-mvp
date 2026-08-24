import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, Check, FileQuestion } from "lucide-react";
import theme from "../../theme/theme";
import { UseTestSubsection } from "../hooks/UseTestSubsections";
import { saveAutosave, loadAutosave, clearAutosave } from "../hooks/testAutosave";
import Skeleton from "../ui/skeleton";
import OfflineBanner from "../ui/OfflineBanner";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { toast as toastManager, useToastManager } from "@/components/ui/toast";
import StudentLayout, { TopBar, SectionTimer } from "../layouts/StudentLayout";
import { useStudentQuestions } from "../hooks/useStudentQuestions";
import { saveStudentResponsesApi } from "../../api/student-api/studentResponseApi";
import { getBackendOptionId } from "../../utils/questionOptionIds";

import {
  getAttemptId,
  getStudentId,
  getSubsectionResponses,
  includeUnansweredQuestionResponses,
  saveQuestionResponse,
  clearSubsectionResponses,
} from "../../utils/studentResponseStorage";

// Gray accent — matches the Rapid Assessment page's accent color (#808080)
// used for its colored left bar + boxed, checkmarked option buttons.
const ACCENT = "#808080";
const ACCENT_SOFT = "#FFFBEB";

// Height (px) of the sticky TopBar above the Likert header row, so the
// header row can stick directly beneath it instead of overlapping it.
// Adjust this if StudentLayout's TopBar height changes.
const TOPBAR_HEIGHT = 64;

const InterestAssessmentRunner = () => {
  // NOTE: `testType` is the backend section_code (e.g. "SEC001") and
  // `sectionId` (kept as the existing route param name) is actually the
  // subsection_code (e.g. "SUBSEC004") in backend terms. Both are used
  // as-is below as stable autosave/routing keys — they don't need the
  // API data to have loaded yet.
  const { testType = "interest", sectionId } = useParams();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const isFirstOnlineCheck = useRef(true);
  const managerFromHook = useToastManager && useToastManager();

  const { section, loading: sectionLoading, error: sectionError } = UseTestSubsection(testType, sectionId);
  const { questions: apiQuestions, loading: apiQuestionsLoading } = useStudentQuestions(section?.dbId);
  const questions = apiQuestions.length > 0 ? apiQuestions : section?.questions || [];

  // The Likert/interest scale is the same set of options for every
  // question in this runner, so we only need it once, from the first
  // question, to render the fixed header row.
  const scaleOptions = questions[0]?.options || [];
  const optionCount = scaleOptions.length;
  // The question column is the ONLY flexible (1fr) track — it takes all
  // remaining width, with a firm minimum so it always has room to fit
  // on one line. Radio columns are capped at a small fixed width so
  // they stay close together instead of spreading across the full row
  // width — that spreading was also what starved the question column.
  const gridTemplateColumns = `minmax(280px,1fr) repeat(${Math.max(optionCount, 1)}, 56px)`;

  // Restore any autosaved progress for this subsection. Keyed off the
  // route param directly so this works before `section` has loaded.
  const [answers, setAnswers] = useState(
    () => loadAutosave(testType, sectionId)?.answers ?? {}
  );
  // Absolute epoch-ms timestamp the timer counts down to. Restored from
  // autosave so a refresh resumes the same countdown instead of resetting it.
  const [timeEndsAt, setTimeEndsAt] = useState(
    () => loadAutosave(testType, sectionId)?.timeEndsAt ?? null
  );
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
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
    setAnswers(saved?.answers ?? {});
    setTimeEndsAt(saved?.timeEndsAt ?? null);
    submittedRef.current = false;
    pausedRemainingRef.current = null;
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType, sectionId]);

  // section still resolving (section/subsection lookup + API fetch), or
  // the short fake-loading delay for the skeleton — either way, nothing
  // below can render real content yet.
  const isLoading = loading || sectionLoading || apiQuestionsLoading || !section;

  // Once we know the section's time limit, establish timeEndsAt exactly
  // ONCE — either from what was restored above, or freshly computed as
  // Date.now() + limit if this section has never been started before.
  // Skipped entirely when there are no questions to answer — no point
  // starting a countdown for a subsection with nothing in it.
  useEffect(() => {
    if (isLoading) return;
    if (questions.length === 0) return;
    if (!Number.isFinite(section?.timeLimitSeconds)) return;
    if (timeEndsAt) return; // already have one (restored or already set)
    setTimeEndsAt(Date.now() + section.timeLimitSeconds * 1000);
  }, [isLoading, section?.timeLimitSeconds, timeEndsAt, questions.length]);

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
    saveAutosave(testType, sectionId, { answers, timeEndsAt });
  }, [testType, sectionId, answers, timeEndsAt]);

  // =====================================================
  // SAVE ONE ANSWER — both to UI state and to the per-question
  // localStorage bucket the submit API reads from. Mirrors
  // ImageAssessmentRunner.handleSelect.
  // =====================================================
  const setAnswer = (qIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));

    const question = questions[qIndex];
    if (!question) return;

    const attemptId = getAttemptId();
    if (!attemptId) {
      console.warn("attempt_id not found — skipping save for this answer");
      return;
    }

    const subsectionId = section?.dbId;
    if (subsectionId === undefined || subsectionId === null) {
      console.warn("section.dbId not yet resolved — skipping save this tick");
      return;
    }

    saveQuestionResponse({
      attemptId,
      subsectionId,
      questionId: question.id,
      selectedResponse: getBackendOptionId(question, optionIndex),
    });
  };

  const answeredCount = Object.keys(answers).length;

  // Scrolls to a given question card — used by the "answer all
  // questions" validation below to take the student straight to the
  // first thing they missed.
  const scrollToQuestion = (qIndex) => {
    document
      .getElementById(`interest-question-${qIndex}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // =====================================================
  // SUBMIT — pushes all locally-saved responses to the backend, same
  // flow as RapidAssessmentRunner / ImageAssessmentRunner: only clear
  // local data after API success so a failed submit stays retryable.
  // =====================================================
  const handleSubmit = async (autoSubmitted = false) => {
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
        scrollToQuestion(firstUnansweredIndex);
        return;
      }
    }

    const attemptId = getAttemptId();
    const studentId = getStudentId();
    const subsectionId = section?.dbId;

    if (!attemptId) {
      setSubmitError("Attempt ID not found.");
      console.error("Attempt ID not found.");
      return;
    }

    if (!studentId) {
      setSubmitError("Student ID not found.");
      console.error("Student ID not found.");
      return;
    }

    if (!subsectionId) {
      setSubmitError("Subsection ID not found.");
      console.error("Subsection ID not found.");
      return;
    }

    const secondsRemaining = Number.isFinite(timeEndsAt)
      ? Math.max(0, Math.round((timeEndsAt - Date.now()) / 1000))
      : 0;
    const timeUsedSeconds = Number.isFinite(section?.timeLimitSeconds)
      ? Math.max(0, section.timeLimitSeconds - secondsRemaining)
      : undefined;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const savedResponses = getSubsectionResponses(attemptId, subsectionId);
      const localResponses = autoSubmitted
        ? includeUnansweredQuestionResponses(questions, savedResponses)
        : savedResponses;

      console.log("=================================");
      console.log("INTEREST ASSESSMENT SUBMIT");
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

      console.log("Interest assessment API success:", result);

      // Only clear local data after API success — so a failed submit
      // still leaves responses available for retry.
      clearSubsectionResponses(attemptId, subsectionId);
      clearAutosave(testType, sectionId);

      submittedRef.current = true;

      navigate(`/test/${testType}/${sectionId}/summary`, {
        state: {
          answers,
          totalQuestions: questions.length,
          timeUsedSeconds,
          autoSubmitted,
          submittedResponse: result,
        },
      });
    } catch (error) {
      console.error("Interest assessment submit error:", error);

      const message =
        error?.response?.data?.message ??
        error?.response?.data?.detail ??
        "Failed to submit responses. Please try again.";

      setSubmitError(message);
      // Do NOT clear localStorage here — allow retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fired once by SectionTimer when the countdown hits zero.
  const handleTimeExpire = () => {
    handleSubmit(true);
  };

  // Top bar used ONLY on the empty-state screen below — deliberately
  // has no `right` slot, so the timer never renders (and, combined with
  // the timer-start guard above, never starts) when there are no
  // questions to answer for this subsection.
  const emptyStateTopBar = (
    <TopBar
      maxWidth="max-w-6xl"
      sticky
      center={
        <span className="text-base sm:text-lg font-medium">{section?.title}</span>
      }
    />
  );

  // The questions endpoint can validly return an empty list. Show a
  // dedicated "not found" screen instead of the Likert layout in that
  // case, with no timer running behind it.
  if (!isLoading && questions.length === 0) {
    return (
      <StudentLayout topBar={emptyStateTopBar}>
        {!isOnline && <OfflineBanner />}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
          <div
            className={`w-full max-w-md ${theme.radius.xl} bg-white border border-slate-100 px-6 py-10 text-center ${theme.shadow.card}`}
          >
            <span
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "#EFF6FF" }}
            >
              <FileQuestion className="h-7 w-7" style={{ color: theme.colors.primary }} />
            </span>
            <h1 className="text-xl font-bold" style={{ color: theme.colors.text.heading }}>
              Question data not found
            </h1>
            <p className="mt-2 text-sm" style={{ color: theme.colors.text.light }}>
              There are no questions available for this section right now.
            </p>
          </div>
        </main>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      topBar={
        <TopBar
          maxWidth="max-w-6xl"
          sticky
          center={
            <span className="text-base sm:text-lg font-medium">{section?.title}</span>
          }
          right={
            <SectionTimer
              endsAt={timeEndsAt}
              loading={isLoading}
              onExpire={handleTimeExpire}
              paused={!isOnline}
            />
          }
        />
      }
    >
      {!isOnline && <OfflineBanner />}

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 pb-28">
        <div className="max-w-6xl mx-auto" style={{ maxWidth: "72rem" }}>
          {/* ================= LIKERT SCALE HEADER =================
              Shown once, stuck below the TopBar. Lives in the SAME
              container as the question rows (not a separate wrapper
              outside <main>), and mirrors each row's left accent-bar
              spacer, so its columns are pixel-aligned with the radio
              dots below no matter how the viewport resizes. */}
          {!isLoading && optionCount > 0 && (
            <div
              className="sticky z-10 bg-white/95 backdrop-blur border-b flex items-stretch mb-2"
              style={{ top: TOPBAR_HEIGHT, borderColor: theme.colors.border }}
            >
              <span className="w-1.5 shrink-0" />
              <div
                className="flex-1 grid items-end gap-x-1 sm:gap-x-2 px-3 sm:px-5 py-7"
                style={{ gridTemplateColumns }}
              >
                <div />
                {scaleOptions.map((option, oi) => (
                  <span
                    key={oi}
                    className="text-center text-[10px] sm:text-xs font-semibold leading-tight px-0.5"
                    style={{ color: theme.colors.text.body }}
                  >
                    {option}
                  </span>
                ))}
              </div>
            </div>
          )}

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

          {sectionError && !isLoading && (
            <p className="text-sm mb-4" style={{ color: "#B91C1C" }}>
              Couldn't load this section right now. Please refresh the page.
            </p>
          )}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  id={`interest-question-${qIndex}`}
                  className="flex items-stretch bg-white border rounded-xl overflow-hidden scroll-mt-32"
                  style={{ borderColor: theme.colors.border }}
                >
                  <span className="w-1.5 shrink-0" style={{ backgroundColor: ACCENT }} />
                  <div
                    className="flex-1 grid items-center gap-x-1 sm:gap-x-2 px-3 sm:px-5 py-3.5"
                    style={{ gridTemplateColumns }}
                  >
                    {/* Prompt — left side, single line, truncates with … if too long */}
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: ACCENT_SOFT, color: ACCENT }}
                      >
                        {qIndex + 1}
                      </span>
                      <p
                        title={q.prompt}
                        className="text-sm sm:text-base truncate font-bold"
                        style={{ color: theme.colors.text.heading }}
                      >
                        {q.prompt}
                      </p>
                    </div>
                    {/* Radio dots — aligned under the header labels */}
                    <div
                      role="radiogroup"
                      aria-label={q.prompt}
                      className="contents"
                    >
                      {q.options.map((option, oi) => {
                        const isSelected = answers[qIndex] === oi;
                        return (
                          <div key={oi} className="flex justify-center">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={option}
                              onClick={() => setAnswer(qIndex, oi)}
                              className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                              style={{
                                borderColor: isSelected ? ACCENT : theme.colors.border,
                                backgroundColor: isSelected ? ACCENT : "#FFFFFF",
                              }}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {!isLoading && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-2 mb-10 flex items-center justify-between gap-3">
          <span className="text-sm" style={{ color: theme.colors.text.light }}>
            {answeredCount} of {questions.length} answered
          </span>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 text-base font-semibold ${theme.radius.md} ${theme.button.primary} ${theme.shadow.button}`}
            style={{
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
            {!isSubmitting && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </StudentLayout>
  );
};

export default InterestAssessmentRunner;