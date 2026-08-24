// =====================================================
// STUDENT RESPONSE LOCAL STORAGE
// =====================================================

// Change this if your project already has a different
// attempt ID storage key.
export const ATTEMPT_ID_KEY = "attempt_id";

// Change this if your project already has a different
// student ID storage key.
export const STUDENT_ID_KEY = "student_id";

export const getAttemptId = () => {
  const direct = localStorage.getItem(ATTEMPT_ID_KEY);
  if (direct) return direct;

  // Fallback: derive from examSessionData if the flat key was never set
  try {
    const raw = localStorage.getItem("examSessionData");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.attemptId) {
        localStorage.setItem(ATTEMPT_ID_KEY, parsed.attemptId); // backfill
        return parsed.attemptId;
      }
    }
  } catch (e) {
    console.error("Failed to derive attemptId from examSessionData:", e);
  }

  return null;
};

export const getStudentId = () => {
  const direct = localStorage.getItem(STUDENT_ID_KEY);
  if (direct) return direct;

  try {
    const raw = localStorage.getItem("examSessionData");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.studentId) {
        localStorage.setItem(STUDENT_ID_KEY, parsed.studentId); // backfill
        return parsed.studentId;
      }
    }
  } catch (e) {
    console.error("Failed to derive studentId from examSessionData:", e);
  }

  return null;
};


// =====================================================
// SUBSECTION STORAGE KEY
// =====================================================

export const getSubsectionResponseKey = (
  attemptId,
  subsectionId
) => {
  return `student_response_${attemptId}_${subsectionId}`;
};


// =====================================================
// GET SUBSECTION RESPONSES
// =====================================================

export const getSubsectionResponses = (
  attemptId,
  subsectionId
) => {
  try {
    if (!attemptId || !subsectionId) {
      return [];
    }

    const key = getSubsectionResponseKey(
      attemptId,
      subsectionId
    );

    const stored =
      localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Failed to read subsection responses:",
      error
    );

    return [];
  }
};


// =====================================================
// SAVE SUBSECTION RESPONSES
// =====================================================

export const saveSubsectionResponses = (
  attemptId,
  subsectionId,
  responses
) => {
  try {
    if (!attemptId || !subsectionId) {
      return;
    }

    const key = getSubsectionResponseKey(
      attemptId,
      subsectionId
    );

    localStorage.setItem(
      key,
      JSON.stringify(responses)
    );

  } catch (error) {
    console.error(
      "Failed to save subsection responses:",
      error
    );
  }
};


// =====================================================
// SAVE ONE QUESTION RESPONSE
// =====================================================

export const saveQuestionResponse = ({
  attemptId,
  subsectionId,
  questionId,
  selectedResponse,
}) => {

  const existingResponses =
    getSubsectionResponses(
      attemptId,
      subsectionId
    );

  const existingIndex =
    existingResponses.findIndex(
      (item) =>
        String(item.question_id) ===
        String(questionId)
    );

  const responseData = {
    question_id: questionId,
    selected_response: selectedResponse,
    is_answered: true,
    is_marked:
      existingIndex !== -1
        ? existingResponses[existingIndex]
            .is_marked ?? false
        : false,
  };

  if (existingIndex !== -1) {

    existingResponses[existingIndex] = {
      ...existingResponses[existingIndex],
      ...responseData,
    };

  } else {

    existingResponses.push(
      responseData
    );

  }

  saveSubsectionResponses(
    attemptId,
    subsectionId,
    existingResponses
  );

  return existingResponses;
};


// =====================================================
// UPDATE MARK STATUS
// =====================================================

export const saveQuestionMarkStatus = ({
  attemptId,
  subsectionId,
  questionId,
  isMarked,
}) => {

  const existingResponses =
    getSubsectionResponses(
      attemptId,
      subsectionId
    );

  const existingIndex =
    existingResponses.findIndex(
      (item) =>
        String(item.question_id) ===
        String(questionId)
    );

  if (existingIndex !== -1) {

    existingResponses[
      existingIndex
    ].is_marked = isMarked;

  } else {

    existingResponses.push({
      question_id: questionId,
      selected_response: null,
      is_answered: false,
      is_marked: isMarked,
    });

  }

  saveSubsectionResponses(
    attemptId,
    subsectionId,
    existingResponses
  );

  return existingResponses;
};


// =====================================================
// CLEAR ONE SUBSECTION
// =====================================================

export const clearSubsectionResponses = (
  attemptId,
  subsectionId
) => {

  const key =
    getSubsectionResponseKey(
      attemptId,
      subsectionId
    );

  localStorage.removeItem(key);
};


// =====================================================
// CHECK WHETHER SUBSECTION HAS SAVED DATA
// =====================================================

export const hasSubsectionResponses = (
  attemptId,
  subsectionId
) => {

  const responses =
    getSubsectionResponses(
      attemptId,
      subsectionId
    );

  return responses.length > 0;
};

// =====================================================
// COMPLETE AUTO-SUBMIT RESPONSES
// =====================================================
// The backend expects every question in an auto-submitted subsection. A
// question the student did not answer is therefore represented explicitly
// with a null option and is_answered: false, rather than being omitted.
export const includeUnansweredQuestionResponses = (
  questions,
  existingResponses
) => {
  const savedByQuestionId = new Map(
    (existingResponses || []).map((response) => [
      String(response.question_id),
      response,
    ])
  );

  const seenQuestionIds = new Set();

  return (questions || []).reduce((responses, question) => {
    const questionId =
      question && typeof question === "object" ? question.id : question;

    if (questionId === null || questionId === undefined) {
      return responses;
    }

    const key = String(questionId);
    if (seenQuestionIds.has(key)) {
      return responses;
    }
    seenQuestionIds.add(key);

    const saved = savedByQuestionId.get(key);
    const hasSelectedResponse =
      saved?.selected_response !== null &&
      saved?.selected_response !== undefined;

    responses.push({
      question_id: questionId,
      selected_response: hasSelectedResponse ? saved.selected_response : null,
      is_answered: hasSelectedResponse && saved?.is_answered !== false,
      is_marked: saved?.is_marked ?? false,
    });

    return responses;
  }, []);
};
