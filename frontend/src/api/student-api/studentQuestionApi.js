import axiosInstance from "../../axiosInstance";

// ================= GET QUESTIONS BY GRADE + SUBSECTION =================

export const getQuestionsApi = async (gradeId, subsectionId) => {
  const response = await axiosInstance.get(
    `/question/grades/${gradeId}/subsections/${subsectionId}/questions/`
  );

  // console.log("getQuestionsApi called with:", { gradeId, subsectionId });

  return response.data;
};