import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentQuestions } from "../../slices/student-slices/studentQuestionSlice";

// Reads gradeId out of the examSessionData blob written in
// ExamManagement.jsx's handleStartExam (sessionData.gradeId)
const getGradeIdFromStorage = () => {
  try {
    const stored = localStorage.getItem("examSessionData");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.gradeId ?? null;
  } catch (e) {
    console.error("useStudentQuestions: failed to parse examSessionData", e);
    return null;
  }
};

/**
 * Hook to fetch and manage questions for a specific subsection.
 * Fetches from the Redux store if already loaded, otherwise triggers API call.
 *
 * IMPORTANT: the store only ever holds ONE subsection's questions at a
 * time (see studentQuestionSlice). When `subsectionId` changes, there is
 * a render (or several, if the network is slow) where the store still
 * holds the PREVIOUS subsection's questions/loading=false, because the
 * fetch-effect hasn't dispatched yet / hasn't resolved yet. If we return
 * that stale data as-is, consumers (e.g. AssessmentRunner) can briefly
 * render questions that don't match the current subsection, or index
 * into an array that's about to change out from under them.
 *
 * To prevent that, we only treat `questions` as valid when
 * `storedSubsectionId === subsectionId`. Otherwise we report `loading:
 * true` and return an empty `questions` array, even if the *previous*
 * fetch already completed.
 *
 * @param {number} subsectionId - The backend subsection ID (e.g., 1)
 * @returns {Object} { questions, loading, error, count, subsectionName }
 */
export const useStudentQuestions = (subsectionId) => {
  const dispatch = useDispatch();
  const {
    questions,
    loading,
    error,
    count,
    subsectionId: storedSubsectionId,
    subsectionName,
  } = useSelector((state) => state.studentQuestion);

  // Fetch questions when subsectionId changes
  useEffect(() => {
    if (subsectionId && subsectionId !== storedSubsectionId) {
      const gradeId = getGradeIdFromStorage();

      if (!gradeId) {
        console.warn(
          "useStudentQuestions: no gradeId found in examSessionData, skipping fetch for subsectionId:",
          subsectionId
        );
        return;
      }

      // console.log("useStudentQuestions: Fetching for", { gradeId, subsectionId });
      dispatch(getStudentQuestions({ gradeId, subsectionId }));
    }
  }, [subsectionId, storedSubsectionId, dispatch]);

  // Does the data currently in the store actually belong to the
  // subsection we were asked for? If not, we're mid-transition (old
  // data hasn't been cleared, new fetch hasn't landed yet).
  const isCurrent = Boolean(subsectionId) && subsectionId === storedSubsectionId;

  return {
    questions: isCurrent && Array.isArray(questions) ? questions : [],
    // Report loading not just while the current fetch is in flight, but
    // also during the window where subsectionId has changed but the
    // store hasn't caught up yet (isCurrent === false with no fetch
    // pending yet on this render).
    loading: loading || (Boolean(subsectionId) && !isCurrent),
    error,
    count,
    subsectionName,
  };
};