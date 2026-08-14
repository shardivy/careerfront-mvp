import axiosInstance from "../../axiosInstance";

// ================= GET QUESTIONS BY SUBSECTION =================

export const getQuestionsApi = async (subsectionId) => {
  const response = await axiosInstance.get(
    `/question/subsections/${subsectionId}/questions/`

  
  );
    console.log(subsectionId)

  return response.data;
};