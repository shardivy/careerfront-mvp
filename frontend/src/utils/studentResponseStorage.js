// =====================================================
// STUDENT RESPONSE LOCAL STORAGE
// =====================================================

// Change this if your project already has a different
// attempt ID storage key.
export const ATTEMPT_ID_KEY = "attempt_id";

// Change this if your project already has a different
// student ID storage key.
export const STUDENT_ID_KEY = "student_id";


// =====================================================
// GET ATTEMPT ID
// =====================================================

export const getAttemptId = () => {
  return localStorage.getItem(ATTEMPT_ID_KEY);
};


// =====================================================
// GET STUDENT ID
// =====================================================

export const getStudentId = () => {
  return localStorage.getItem(STUDENT_ID_KEY);
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