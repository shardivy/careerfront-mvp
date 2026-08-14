import axiosInstance from "../axiosInstance";

// ================= GENERATE QUESTION CODE =================

export const generateQuestionCodeApi = async (subsectionId) => {
  const response = await axiosInstance.get(
    `/asse/question/generate-code/${subsectionId}/`
  );

  return response.data;
};


// ================= CREATE QUESTION =================

export const createQuestionApi = async (payload) => {
  const isFormData = payload instanceof FormData;
  const response = await axiosInstance.post(`/asse/questions/`, payload, {
    headers: isFormData ? { "Content-Type": undefined } : undefined,
  });

  return response.data;
};

// export const createQuestionApi = async (payload) => {
//   const response = await axiosInstance.post(`/asse/questions/`, payload);

//   return response.data;
// };

// ================= GET ALL QUESTIONS =================  
export const getQuestionsApi = async () => { 
  const response = await axiosInstance.get("/asse/question-library/"); 
  
  return response.data; 
};

// ================= GET QUESTION BY ID for draft view =================

export const getQuestionByIdApi = async (questionId) => {
    const response = await axiosInstance.get(
        `/asse/questions/${questionId}/`
    );

    return response.data;
};

// export const updateQuestionApi = async (questionId, payload) => {
//     const response = await axiosInstance.put(
//         `/asse/questions/${questionId}/`,
//         payload
//     );
 
//     return response.data;
// };

export const updateQuestionApi = async (questionId, payload) => {
  const isFormData = payload instanceof FormData;
  const response = await axiosInstance.put(
    `/asse/questions/${questionId}/`,
    payload,
    {
      headers: isFormData ? { "Content-Type": undefined } : undefined,
    }
  );

  return response.data;
};