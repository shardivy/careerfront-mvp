import axiosInstance from "../../axiosInstance";

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
      // item.selected_response is already the real backend option id —
      // "A"/"B" for compare-larger/compare-smaller (from opt.id in the
      // transformer), "Similar"/"Different" for string-match, "Odd"/"Even"
      // for parity, "true"/"false" for month toggles — set directly by
      // setAnswer()/toggleMonth() in RapidAssessmentRunner. Pass it
      // through as-is.
      //
      // Do NOT re-derive it with something like
      // String.fromCharCode(65 + Number(item.selected_response)) — that
      // assumes selected_response is a raw numeric index, which it is
      // not. Running that on a string like "A" or "Odd" produces NaN /
      // garbage characters in option_id. This exact bug has been
      // reintroduced once already — leave this as a straight pass-through.
      option_id: item.selected_response ?? null,
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