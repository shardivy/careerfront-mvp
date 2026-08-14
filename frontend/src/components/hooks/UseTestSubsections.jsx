import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentSubsections } from "../../slices/student-slices/studentSubsectionSlice";
import { getStudentQuestions } from "../../slices/student-slices/studentQuestionSlice";
import {
  QUESTION_BANKS,
  DEFAULT_SUBSECTION_ICON,
  formatMinutes,
  splitInstructions,
  SECTION_ORDER,
  SUBSECTION_TO_SECTION,
  UNASSIGNED_SECTION_CODE,
  getSectionName,
} from "../student/testData";

/**
 * The backend now returns ONE flat list of every subsection the student
 * has — no section grouping, no section_code, no section_id anywhere
 * (the "get sections" call is gone entirely). This fetches that list
 * once and groups it locally by LOCAL section code using the
 * SUBSECTION_TO_SECTION map in testData.js.
 *
 * NOTE: `getStudentSubsections` is now called with NO ARGUMENTS and is
 * expected to fetch every subsection for the student in a single
 * request. If your thunk/slice still expects a sectionId param, it (or
 * the API route it hits) needs a "fetch all" mode added to match — this
 * hook assumes that already returns everything.
 */
const useAllSubsections = () => {
  const dispatch = useDispatch();
  const {
    subsections,
    loading,
    error,
  } = useSelector((s) => s.studentSubsection);

  useEffect(() => {
    dispatch(getStudentSubsections());
  }, [dispatch]);

  useEffect(() => {
    console.log("useAllSubsections Data:", {
      subsectionsLength: subsections?.length,
      subsections: subsections,
      loading,
      error,
    });
  }, [subsections, loading, error]);

  // Group the flat list by local section code, sort each group by
  // subsection_display_order.
  const bySection = useMemo(() => {
    if (!Array.isArray(subsections)) {
      console.warn("useAllSubsections: subsections is not an array:", subsections);
      return {};
    }

    const groups = {};
    subsections
      .filter((s) => s.status !== "INACTIVE")
      .forEach((s) => {
        const sectionCode = SUBSECTION_TO_SECTION[s.subsection_code] || UNASSIGNED_SECTION_CODE;
        if (!groups[sectionCode]) groups[sectionCode] = [];
        groups[sectionCode].push(s);
      });

    Object.values(groups).forEach((list) =>
      list.sort((a, b) => (a.subsection_display_order ?? 0) - (b.subsection_display_order ?? 0))
    );

    return groups;
  }, [subsections]);

  return { bySection, loading, error };
};

/**
 * Resolves `testType` (a LOCAL section code, e.g. "SEC001") to its group
 * of subsections from the flat fetch above, merging each one with its
 * local QUESTION_BANKS entry (icon, questions/groups, layout — the stuff
 * the backend doesn't return). This DOES NOT hit the questions API —
 * `questions`/`groups` here are still the local placeholder data, good
 * enough for listing tabs and showing a question count. For a single
 * subsection with REAL questions, use `useTestSubsection` below.
 */
export const useTestSubsections = (testType) => {
  const { bySection, loading, error } = useAllSubsections();

  const tabs = useMemo(() => {
    const list = bySection[testType] || [];

    if (!Array.isArray(list)) {
      console.warn(`useTestSubsections: bySection[${testType}] is not an array:`, list);
      return [];
    }

    return list
      .map((s) => {
        if (!s || !s.subsection_code) {
          console.warn("Invalid subsection data:", s);
          return null;
        }

        const bank = QUESTION_BANKS[s.subsection_code] || {};
        const questionCount =
          (Array.isArray(bank.questions) && bank.questions.length) ||
          (typeof bank.totalQuestions === "number" && bank.totalQuestions) ||
          (Array.isArray(bank.groups)
            ? bank.groups.reduce((sum, g) => sum + (Array.isArray(g.items) ? g.items.length : 0), 0)
            : 0);

        return {
          id: s.subsection_code,
          dbId: s.subsection_id,

          // DYNAMIC — from backend
          title: s.subsection_name || s.subsection_code,
          timeLimit: formatMinutes(s.time_limit_minutes),
          timeLimitSeconds: (Number(s.time_limit_minutes) || 0) * 60,

          // STATIC — local only, backend value ignored
          subtitle: bank.subtitle || "",
          instructions: bank.instructions || [],
          difficulty: bank.difficulty || "Adaptive",

          icon: bank.icon || DEFAULT_SUBSECTION_ICON,
          layout: bank.layout,
          questions: bank.questions,
          groups: bank.groups,
          months: bank.months,
          totalQuestions: bank.totalQuestions,
          questionCount,
        };
      })
      .filter(Boolean);
  }, [bySection, testType]);

  return {
    tabs,
    sectionId: testType,
    loading,
    error,
  };
};

/**
 * Same as useTestSubsections, but resolves ONE subsection by code AND
 * fetches its REAL questions from the questions API using the
 * subsection's `dbId` (backend subsection_id). Used by the actual test
 * runners (InterestAssessmentRunner, AssessmentRunner, etc.) where the
 * local QUESTION_BANKS entry is only a layout/icon fallback, not the
 * real question content.
 *
 * While the API questions are loading (or if this subsection has no
 * dbId, or the fetch fails), `section.questions` falls back to whatever
 * QUESTION_BANKS has locally, so runners that expect a `questions` array
 * never see undefined.
 */
export const useTestSubsection = (testType, subsectionCode) => {
  const dispatch = useDispatch();
  const { tabs, sectionId, loading: subsectionsLoading, error: subsectionsError } = useTestSubsections(testType);
  const localSection = tabs.find((t) => t.id === subsectionCode) || null;

  const {
    questions: apiQuestions,
    subsectionId: fetchedForId,
    loading: questionsLoading,
    error: questionsError,
  } = useSelector((s) => s.studentQuestion);

  useEffect(() => {
    if (localSection?.dbId) {
      dispatch(getStudentQuestions(localSection.dbId));
    }
  }, [dispatch, localSection?.dbId]);

  // Only trust apiQuestions once they were fetched FOR this subsection —
  // otherwise, while switching tabs, we'd briefly show the previous
  // subsection's questions under the new one's title.
  const questionsReady = Boolean(localSection?.dbId) && fetchedForId === localSection?.dbId;

  const section = useMemo(() => {
    if (!localSection) return null;
    if (questionsError && !questionsReady) {
      // API failed — fall back to local bank data rather than blocking the runner.
      return localSection;
    }
    return {
      ...localSection,
      questions: questionsReady ? apiQuestions : localSection.questions,
      questionCount: questionsReady ? apiQuestions.length : localSection.questionCount,
    };
  }, [localSection, apiQuestions, questionsReady, questionsError]);

  const isFetchingQuestions = Boolean(localSection?.dbId) && !questionsReady && !questionsError;

  return {
    section,
    tabs,
    sectionId,
    loading: subsectionsLoading || isFetchingQuestions,
    error: subsectionsError || (questionsReady ? null : questionsError),
  };
};

/**
 * For TestSelection, which used to call `getStudentSections()` directly.
 * Since that endpoint is gone, this derives the section-level card list
 * from the SAME flat subsections fetch: any local section code (from
 * SECTION_ORDER) with at least one subsection present in the response
 * becomes a card, in SECTION_ORDER's order.
 */
export const useTestSections = () => {
  const { loading, error } = useAllSubsections();

  const sections = useMemo(
    () => SECTION_ORDER.map((code) => ({ code, name: getSectionName(code) })),
    []
  );

  return { sections, loading, error };
};