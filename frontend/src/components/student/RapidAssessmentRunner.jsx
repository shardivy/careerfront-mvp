import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ScanLine,
  Binary,
  CalendarDays,
  Check,
} from "lucide-react";
import theme from "../../theme/theme";
import { UseTestSubsection } from "../hooks/UseTestSubsections";
import { saveAutosave, loadAutosave, clearAutosave } from "../hooks/testAutosave";
import Skeleton from "../ui/skeleton";
import OfflineBanner from "../ui/OfflineBanner";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { toast as toastManager, useToastManager } from "@/components/ui/toast";
import StudentLayout, { TopBar, SectionTimer } from "../layouts/StudentLayout";
import { useStudentQuestions } from "../hooks/useStudentQuestions";
import { transformRapidAssessmentQuestions } from "../../utils/rapidAssessmentTransformer";
import { saveStudentResponsesApi } from "../../api/student-api/studentResponseApi";

import {
  getAttemptId,
  getStudentId,
  getSubsectionResponses,
  saveQuestionResponse,
  clearSubsectionResponses,
} from "../../utils/studentResponseStorage";

const GROUP_META = {
  "compare-larger": { accent: "#808080", soft: "#FFFBEB", icon: TrendingUp },
  "compare-smaller": { accent: "#808080", soft: "#F0F9FF", icon: TrendingDown },
  "string-match": { accent: "#808080", soft: "#F5F3FF", icon: ScanLine },
  parity: { accent: "#808080", soft: "#F0FDFA", icon: Binary },
  "month-multiselect": { accent: "#808080", soft: "#FFF1F2", icon: CalendarDays },
};

const RapidAssessmentRunner = () => {
  const { testType = "aptitude", sectionId } = useParams();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const isFirstOnlineCheck = useRef(true);
  const managerFromHook = useToastManager && useToastManager();

  const { section, loading: sectionLoading, error: sectionError } = UseTestSubsection(testType, sectionId);
  const { questions: apiQuestions, loading: apiQuestionsLoading } = useStudentQuestions(section?.dbId);
  const { groups: apiGroups } = useMemo(
    () => transformRapidAssessmentQuestions(apiQuestions),
    [apiQuestions]
  );

  const [answers, setAnswers] = useState(
    () => loadAutosave(testType, sectionId)?.answers ?? {}
  );
  const [selectedMonths, setSelectedMonths] = useState(
    () => new Set(loadAutosave(testType, sectionId)?.selectedMonths ?? [])
  );
  // Absolute epoch-ms timestamp the timer counts down to. Restored
  // from autosave so a refresh doesn't reset the clock.
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
    setSelectedMonths(new Set(saved?.selectedMonths ?? []));
    setTimeEndsAt(saved?.timeEndsAt ?? null);
    submittedRef.current = false;
    pausedRemainingRef.current = null;
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType, sectionId]);

  const isLoading = loading || sectionLoading || apiQuestionsLoading || !section;

  // Once we know the section's time limit, establish timeEndsAt exactly
  // ONCE — either from what was restored above, or freshly computed as
  // Date.now() + limit if this section has never been started before.
  useEffect(() => {
    if (isLoading) return;
    if (!Number.isFinite(section?.timeLimitSeconds)) return;
    if (timeEndsAt) return; // already have one (restored or already set)
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
      answers,
      selectedMonths: Array.from(selectedMonths),
      timeEndsAt,
    });
  }, [testType, sectionId, answers, selectedMonths, timeEndsAt]);

  // =====================================================
  // SAVE ONE ANSWER — both to UI state and to the per-question
  // localStorage bucket the submit API reads from.
  //
  // ASSUMPTION: selected_response_json.option_id is sent as a STRING
  // version of whatever value was picked (a number, "Similar"/"Different",
  // "Odd"/"Even") — NOT an A/B/C/D letter, since these aren't multiple
  // choice questions. Adjust `toResponseValue` below if the backend
  // expects a different shape for this question type.
  // =====================================================
  const toResponseValue = (value) => {
    if (value === null || value === undefined) return null;
    return String(value);
  };

  const setAnswer = (itemId, value) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));

    const attemptId = getAttemptId();
    if (!attemptId) {
      console.warn("attempt_id not found — skipping save for this answer");
      return;
    }

    if (section?.dbId === undefined || section?.dbId === null) {
      console.warn("section.dbId not yet resolved — skipping save this tick");
      return;
    }

    saveQuestionResponse({
      attemptId,
      subsectionId: section.dbId,
      questionId: itemId,
      selectedResponse: toResponseValue(value),
    });
  };

  // =====================================================
  // MONTH MULTI-SELECT
  //
  // ASSUMPTION: each month is saved as its OWN question_id
  // (`${itemId}` = the month name itself, e.g. "January"), with
  // selected_response = "true"/"false". This lets month selections ride
  // in the same per-question response array as everything else. If the
  // backend instead wants ONE question_id with an array/CSV of selected
  // months, replace this with a single saveQuestionResponse call using
  // Array.from(next).join(",") or JSON.stringify(Array.from(next)).
  // =====================================================
  const toggleMonth = (month) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      const willBeSelected = !next.has(month);

      if (willBeSelected) {
        next.add(month);
      } else {
        next.delete(month);
      }

      const attemptId = getAttemptId();
      if (attemptId && section?.dbId !== undefined && section?.dbId !== null) {
        saveQuestionResponse({
          attemptId,
          subsectionId: section.dbId,
          questionId: month, // month name used as the question identifier
          selectedResponse: String(willBeSelected),
        });
      } else {
        console.warn("attempt_id or section.dbId missing — skipping month save");
      }

      return next;
    });
  };

  const groupProgress = (group) => {
    if (group.type === "month-multiselect") {
      return { answered: selectedMonths.size > 0 ? 1 : 0, total: 1 };
    }
    return {
      answered: group.items.filter((item) => answers[item.id] !== undefined).length,
      total: group.items.length,
    };
  };

  const scrollToGroup = (id) => {
    document
      .getElementById(`group-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const groups = apiGroups.length > 0 ? apiGroups : (section?.groups || []);

  const handleSubmit = async (autoSubmitted = false) => {
    if (submittedRef.current || isSubmitting) {
      return;
    }

    // =================================================
    // REQUIRE ALL QUESTIONS ANSWERED
    //
    // Skipped when the timer forces an auto-submit — a student who ran
    // out of time should still have whatever they answered sent, not
    // get stuck unable to submit at all. Reuses groupProgress so this
    // stays in sync with the progress chips in the top bar, including
    // the month-multiselect group's "at least one month" rule.
    // =================================================
    if (!autoSubmitted) {
      const firstIncompleteGroup = groups.find((group) => {
        const { answered, total } = groupProgress(group);
        return answered < total;
      });

      if (firstIncompleteGroup) {
        setSubmitError(
          `Please answer all questions before submitting. "${firstIncompleteGroup.heading}" is incomplete.`
        );
        scrollToGroup(firstIncompleteGroup.id);
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

    // Client-side fallback counts (used only if the backend response
    // doesn't include per-subsection totals for some reason).
    const monthAnswered = selectedMonths.size > 0 ? 1 : 0;
    const fallbackTotal = groups.reduce(
      (sum, g) => sum + (g.type === "month-multiselect" ? 1 : (g.items?.length || 0)),
      0
    );
    const fallbackAnswered = groups.reduce((sum, g) => {
      if (g.type === "month-multiselect") return sum + monthAnswered;
      return sum + g.items.filter((item) => answers[item.id] !== undefined).length;
    }, 0);

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const localResponses = getSubsectionResponses(attemptId, subsectionId);

      console.log("=================================");
      console.log("RAPID ASSESSMENT SUBMIT");
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

      console.log("Rapid assessment API success:", result);

      // =================================================
      // Backend returns per-subsection totals in the response, e.g.:
      // { subsections: [{ subsection_id, total_questions,
      //                    answered_questions, remaining_questions,
      //                    subsection_status }] }
      // Prefer that over anything computed client-side — it's the
      // source of truth for what was actually saved/graded.
      // =================================================
      const subsectionResult =
        result?.subsections?.find(
          (s) => String(s.subsection_id) === String(subsectionId)
        ) || result?.subsections?.[0];

      const totalQuestionsFromApi = subsectionResult?.total_questions;
      const answeredQuestionsFromApi = subsectionResult?.answered_questions;

      // Only clear local data after API success — so a failed submit
      // still leaves responses available for retry.
      clearSubsectionResponses(attemptId, subsectionId);
      clearAutosave(testType, sectionId);

      submittedRef.current = true;

      navigate(`/test/${testType}/${sectionId}/summary`, {
        state: {
          answers: { ...answers, "days-30-31": Array.from(selectedMonths) },
          totalQuestions: totalQuestionsFromApi ?? fallbackTotal,
          answeredCount: answeredQuestionsFromApi ?? fallbackAnswered,
          remainingQuestions: subsectionResult?.remaining_questions,
          subsectionStatus: subsectionResult?.subsection_status,
          autoSubmitted,
          submittedResponse: result,
        },
      });
    } catch (error) {
      console.error("Rapid assessment submit error:", error);

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

  return (
    <StudentLayout
      topBar={
        <TopBar
          maxWidth="max-w-4xl"
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
          below={
            !isLoading && (
              <div className="border-t border-slate-100 bg-slate-50/60">
                <div className="w-full mx-auto pl-2 sm:pl-48 pr-2 sm:pr-4 py-2 flex items-center gap-2 flex-nowrap overflow-x-auto lg:overflow-x-hidden">
                  {groups.map((group) => {
                    const meta = GROUP_META[group.type];
                    const Icon = meta.icon;
                    const { answered, total } = groupProgress(group);
                    const done = answered === total;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => scrollToGroup(group.id)}
                        className="flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors"
                        style={{
                          borderColor: done ? meta.accent : theme.colors.border,
                          backgroundColor: done ? meta.soft : "#FFFFFF",
                          color: done ? meta.accent : theme.colors.text.body,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: meta.accent }} />
                        {group.heading}
                        <span className="tabular-nums opacity-70">
                          {answered}/{total}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          }
        />
      }
    >
      {!isOnline && <OfflineBanner />}

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 pb-28">
        <div className="max-w-4xl mx-auto">
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
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : (
            <>
              {groups.map((group) => {
                const meta = GROUP_META[group.type];
                const Icon = meta.icon;
                const { answered, total } = groupProgress(group);

                return (
                  <section key={group.id} id={`group-${group.id}`} className="mb-9 scroll-mt-32">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: meta.soft }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color: meta.accent }} />
                      </span>
                      <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: theme.colors.text.heading }}>
                        {group.heading}
                      </h2>
                      <span className="ml-auto text-sm font-semibold tabular-nums" style={{ color: meta.accent }}>
                        {answered}/{total}
                      </span>
                    </div>

                    {(group.type === "compare-larger" || group.type === "compare-smaller") && (
                      <div className="flex flex-col gap-2">
                        {group.items.map((item, i) => {
                          const qNum = i + 1 + (group.type === "compare-smaller" ? 12 : 0);
                          return (
                            <div
                              key={item.id}
                              className="flex items-stretch bg-white border rounded-xl overflow-hidden"
                              style={{ borderColor: theme.colors.border }}
                            >
                              <span
                                className="w-1.5 shrink-0"
                                style={{ backgroundColor: meta.accent }}
                              />
                              <div className="flex-1 flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3.5">
                                <span
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{ backgroundColor: meta.soft, color: meta.accent }}
                                >
                                  {qNum}
                                </span>
                                <div className="flex-1 flex items-center justify-center gap-3 sm:gap-5">
                                  {item.values.map((val, vi) => {
                                    const isSelected = answers[item.id] === val;
                                    return (
                                      <React.Fragment key={val}>
                                        {vi === 1 && (
                                          <span className="text-xs font-bold uppercase tracking-wider shrink-0" style={{ color: theme.colors.text.light }}>
                                            vs
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => setAnswer(item.id, val)}
                                          className="flex items-center justify-center gap-1.5 w-28 sm:w-32 py-3 rounded-lg border-2 font-bold tabular-nums text-lg sm:text-xl transition-all"
                                          style={{
                                            borderColor: isSelected ? meta.accent : theme.colors.border,
                                            backgroundColor: isSelected ? meta.soft : "#FFFFFF",
                                            color: isSelected ? meta.accent : theme.colors.text.heading,
                                          }}
                                        >
                                          {isSelected && <Check className="w-4 h-4" />}
                                          {val}
                                        </button>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {group.type === "string-match" && (
                      <div className="flex flex-col gap-2">
                        {group.items.map((item, i) => {
                          return (
                            <div
                              key={item.id}
                              className="flex items-stretch bg-white border rounded-xl overflow-hidden"
                              style={{ borderColor: theme.colors.border }}
                            >
                              <span className="w-1.5 shrink-0" style={{ backgroundColor: meta.accent }} />
                              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3.5">
                                <span
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{ backgroundColor: meta.soft, color: meta.accent }}
                                >
                                  {i + 1}
                                </span>

                                <div
                                  className="flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 px-3"
                                  style={{ backgroundColor: meta.soft }}
                                >
                                  <span className="font-mono text-base sm:text-lg font-semibold tracking-wide" style={{ color: theme.colors.text.heading }}>
                                    {item.pair[0]}
                                  </span>
                                  <span className="font-mono text-base sm:text-lg font-semibold tracking-wide" style={{ color: theme.colors.text.heading }}>
                                    {item.pair[1]}
                                  </span>
                                </div>

                                <div
                                  className="flex shrink-0 self-center rounded-full border p-0.5"
                                  style={{ borderColor: theme.colors.border }}
                                >
                                  {["Similar", "Different"].map((opt) => {
                                    const isSelected = answers[item.id] === opt;
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setAnswer(item.id, opt)}
                                        className="w-28 sm:w-32 py-2 rounded-full text-sm sm:text-base font-semibold transition-colors"
                                        style={{
                                          backgroundColor: isSelected ? meta.accent : "transparent",
                                          color: isSelected ? "#FFFFFF" : theme.colors.text.body,
                                        }}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {group.type === "parity" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-stretch bg-white border rounded-xl overflow-hidden"
                            style={{ borderColor: theme.colors.border }}
                          >
                            <span className="w-1.5 shrink-0" style={{ backgroundColor: meta.accent }} />
                            <div className="flex-1 flex items-center justify-between gap-3 px-3 sm:px-5 py-3.5">
                              <span className="font-mono text-base sm:text-lg tabular-nums" style={{ color: theme.colors.text.heading }}>
                                {item.value}
                              </span>
                              <div className="flex shrink-0 rounded-full border p-0.5" style={{ borderColor: theme.colors.border }}>
                                {["Odd", "Even"].map((opt) => {
                                  const isSelected = answers[item.id] === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setAnswer(item.id, opt)}
                                      className="px-4 py-2 rounded-full text-sm sm:text-base font-semibold transition-colors"
                                      style={{
                                        backgroundColor: isSelected ? meta.accent : "transparent",
                                        color: isSelected ? "#FFFFFF" : theme.colors.text.body,
                                      }}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {group.type === "month-multiselect" && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {group.months.map((month) => {
                          const isSelected = selectedMonths.has(month);
                          return (
                            <button
                              key={month}
                              type="button"
                              onClick={() => toggleMonth(month)}
                              className="relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-4 transition-all"
                              style={{
                                borderColor: isSelected ? meta.accent : theme.colors.border,
                                backgroundColor: isSelected ? meta.soft : "#FFFFFF",
                              }}
                            >
                              {isSelected && (
                                <span
                                  className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: meta.accent }}
                                >
                                  <Check className="w-3 h-3" style={{ color: "#FFFFFF" }} />
                                </span>
                              )}
                              <span
                                className="text-base font-semibold"
                                style={{ color: isSelected ? meta.accent : theme.colors.text.heading }}
                              >
                                {month}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  </section>
                );
              })}
            </>
          )}
        </div>
      </main>

      {!isLoading && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-2 mb-10 flex justify-end">
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

export default RapidAssessmentRunner;