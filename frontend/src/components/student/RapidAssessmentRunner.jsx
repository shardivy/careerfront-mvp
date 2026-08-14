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
import { useTestSubsection } from "../hooks/UseTestSubsections";
import { saveAutosave, loadAutosave, clearAutosave } from "../hooks/testAutosave";
import Skeleton from "../ui/Skeleton";
import OfflineBanner from "../ui/OfflineBanner";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { toast as toastManager, useToastManager } from "@/components/ui/toast";
import StudentLayout, { TopBar, SectionTimer } from "../layouts/StudentLayout";
import { useStudentQuestions } from "../hooks/useStudentQuestions";
import { transformRapidAssessmentQuestions } from "../../utils/rapidAssessmentTransformer";


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

  const { section, loading: sectionLoading, error: sectionError } = useTestSubsection(testType, sectionId);
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
    setAnswers(saved?.answers ?? {});
    setSelectedMonths(new Set(saved?.selectedMonths ?? []));
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

  const setAnswer = (itemId, value) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const toggleMonth = (month) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  const handleSubmit = (autoSubmitted = false) => {
    if (submittedRef.current && !autoSubmitted) return;
    submittedRef.current = true;
    clearAutosave(testType, sectionId);
    navigate(`/test/${testType}/${sectionId}/summary`, {
      state: {
        answers: { ...answers, "days-30-31": Array.from(selectedMonths) },
        totalQuestions: section?.totalQuestions,
        autoSubmitted,
      },
    });
  };

  // Fired once by SectionTimer when the countdown hits zero.
  const handleTimeExpire = () => {
    handleSubmit(true);
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
            className={`flex items-center gap-2 px-6 py-3 text-base font-semibold ${theme.radius.md} ${theme.button.primary} ${theme.shadow.button}`}
          >
            Submit
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </StudentLayout>
  );
};

export default RapidAssessmentRunner;