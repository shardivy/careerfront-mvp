import axiosInstance from "../../axiosInstance";

// Convert a numeric option index (0, 1, 2, 3...) to a letter (A, B, C, D...)
const indexToOptionLetter = (index) => {
  if (index === null || index === undefined) return null;
  return String.fromCharCode(65 + Number(index));
};

// =====================================================
// SAVE COMPLETE SUBSECTION RESPONSES
// =====================================================

export const saveStudentResponsesApi = async ({
  attemptId,
  studentId,
  subsectionId,
  responses,
}) => {
  const answers = responses.map((item) => ({
    question_id: item.question_id,
    selected_response_json: {
      option_id: indexToOptionLetter(item.selected_response),
    },
    is_answered: !!item.is_answered,
  }));

  const payload = {
    attempt_id: attemptId,
    student_id: studentId,
    subsections: [
      {
        subsection_id: subsectionId,
        answers,
      },
    ],
  };

  console.log("Saving subsection responses:", payload);

  const response = await axiosInstance.post(
    `/students/student-test-responses/`,
    payload
  );

  return response.data;
};