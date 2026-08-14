/**
 * Transform API question response to match AssessmentRunner format
 *
 * API format:
 * {
 *   question_text: "...",
 *   options: [{ id: "A", text: "..." }, ...],
 *   question_image: "...",
 *   marks: 1
 * }
 *
 * Expected format:
 * {
 *   prompt: "...",
 *   options: ["...", "...", ...],
 *   type: "image" | undefined,
 *   ...
 * }
 */
export const transformApiQuestion = (apiQuestion) => {
  if (!apiQuestion) return null;

  return {
    id: apiQuestion.id,
    prompt: apiQuestion.question_text,
    type: apiQuestion.question_image ? "image" : undefined,
    questionImage: apiQuestion.question_image,
    // Options as text array for display
    options: apiQuestion.options?.map((opt) => opt.text) || [],
    // Full options for answer checking
    optionsWithIds: apiQuestion.options || [],
    marks: apiQuestion.marks || 1,
    negativeMarks: apiQuestion.negative_marks || 0,
    questionType: apiQuestion.question_type,
    displayOrder: apiQuestion.display_order,
  };
};

/**
 * Transform full API response to questions array
 */
export const transformApiQuestionsResponse = (apiResponse) => {
  // API returns questions/subsection_id/subsection_name/question_count
  // directly on the response — no `results` wrapper.
  const questions = apiResponse?.questions || [];

  return {
    questions: questions.map(transformApiQuestion).filter(Boolean),
    subsectionId: apiResponse?.subsection_id,
    subsectionName: apiResponse?.subsection_name,
    count: apiResponse?.question_count ?? questions.length,
  };
};