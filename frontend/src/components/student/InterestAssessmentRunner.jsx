import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";
import theme from "../../theme/theme";
import { getSection } from "./testData";
import { saveAutosave, loadAutosave, clearAutosave } from "../hooks/testAutosave";
import Skeleton from "../ui/Skeleton";
import StudentLayout, { TopBar, SectionTimer } from "../layouts/StudentLayout";

// Gray accent — matches the Rapid Assessment page's accent color (#808080)
// used for its colored left bar + boxed, checkmarked option buttons.
const ACCENT = "#808080";
const ACCENT_SOFT = "#FFFBEB";

const InterestAssessmentRunner = () => {
  const { testType = "interest", sectionId } = useParams();
  const navigate = useNavigate();
  const section = getSection(testType, sectionId);
  const questions = section.questions || [];

  const [answers, setAnswers] = useState(
    () => loadAutosave(testType, section.id)?.answers ?? {}
  );
  const [loading, setLoading] = useState(true);
  const submittedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // If the section changes, restore whatever was saved for the new one.
  useEffect(() => {
    const saved = loadAutosave(testType, section.id);
    setAnswers(saved?.answers ?? {});
    submittedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType, section.id]);

  // Persist progress on every change.
  useEffect(() => {
    saveAutosave(testType, section.id, { answers });
  }, [testType, section.id, answers]);

  const setAnswer = (qIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = (autoSubmitted = false) => {
    if (submittedRef.current && !autoSubmitted) return;
    submittedRef.current = true;
    clearAutosave(testType, section.id);
    navigate(`/test/${testType}/${section.id}/summary`, {
      state: { answers, totalQuestions: questions.length, autoSubmitted },
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
            <span className="text-base sm:text-lg font-medium">{section.title}</span>
          }
          right={
            <SectionTimer
              timeLimitSeconds={section.timeLimitSeconds}
              resetKey={section.id}
              loading={loading}
              onExpire={handleTimeExpire}
            />
          }
        />
      }
    >
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 pb-28">
        <div className="max-w-6xl mx-auto">
          {loading ? (
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

      {!loading && (
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