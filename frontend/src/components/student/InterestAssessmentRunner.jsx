import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";
import theme from "../../theme/theme";
import { useTestSubsection } from "../hooks/useTestSubsections";
import { saveAutosave, loadAutosave, clearAutosave } from "../hooks/testAutosave";
import Skeleton from "../ui/Skeleton";
import OfflineBanner from "../ui/OfflineBanner";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { toast as toastManager, useToastManager } from "@/components/ui/toast";
import StudentLayout, { TopBar, SectionTimer } from "../layouts/StudentLayout";

// Gray accent — matches the Rapid Assessment page's accent color (#808080)
// used for its colored left bar + boxed, checkmarked option buttons.
const ACCENT = "#808080";
const ACCENT_SOFT = "#FFFBEB";

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

  const { section, loading: sectionLoading, error: sectionError } = useTestSubsection(testType, sectionId);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType, sectionId]);

  // section still resolving (section/subsection lookup + API fetch), or
  // the short fake-loading delay for the skeleton — either way, nothing
  // below can render real content yet.
  const isLoading = loading || sectionLoading || !section;
  const questions = section?.questions || [];

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
    saveAutosave(testType, sectionId, { answers, timeEndsAt });
  }, [testType, sectionId, answers, timeEndsAt]);

  const setAnswer = (qIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = (autoSubmitted = false) => {
    if (submittedRef.current && !autoSubmitted) return;
    submittedRef.current = true;
    clearAutosave(testType, sectionId);
    navigate(`/test/${testType}/${sectionId}/summary`, {
      state: {
        answers,
        totalQuestions: section?.totalQuestions ?? questions.length,
        autoSubmitted,
      },
    });
  };

  // Fired once by SectionTimer when the countdown hits zero.
  const handleTimeExpire = () => {
    handleSubmit(true);
  };

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
            />
          }
        />
      }
    >
      {!isOnline && <OfflineBanner />}

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 pb-28">
        <div className="max-w-6xl mx-auto">
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
            <div className="flex flex-col gap-2">
              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="flex items-stretch bg-white border rounded-xl overflow-hidden"
                  style={{ borderColor: theme.colors.border }}
                >
                  <span className="w-1.5 shrink-0" style={{ backgroundColor: ACCENT }} />
                  <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 px-3 sm:px-5 py-3.5">
                    <div className="flex items-center gap-3 lg:flex-1 min-w-0">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: ACCENT_SOFT, color: ACCENT }}
                      >
                        {qIndex + 1}
                      </span>
                      <p className="text-sm sm:text-base" style={{ color: theme.colors.text.heading }}>
                        {q.prompt}
                      </p>
                    </div>

                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:shrink-0">
                      {q.options.map((option, oi) => {
                        const isSelected = answers[qIndex] === oi;
                        return (
                          <button
                            key={oi}
                            type="button"
                            onClick={() => setAnswer(qIndex, oi)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all"
                            style={{
                              borderColor: isSelected ? ACCENT : theme.colors.border,
                              backgroundColor: isSelected ? ACCENT_SOFT : "#FFFFFF",
                              color: isSelected ? ACCENT : theme.colors.text.heading,
                            }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            {option}
                          </button>
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

export default InterestAssessmentRunner;