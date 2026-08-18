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
  const payload = {
    attempt_id: attemptId,
    student_id: studentId,
    subsection_id: subsectionId,
    responses: responses,
  };

  console.log("Saving subsection responses:", payload);

  const response = await axiosInstance.post(
    `/students/student-test-responses/`,
    payload
  );

  return response.data;
};