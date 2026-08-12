import axiosInstance from "../axiosInstance";

// Publish Assessment
export const publishAssessment = async (payload) => {
  const response = await axiosInstance.post(
    "/asse/assessment-builder/",
    payload
  );

  return response.data;
};

// Update existing draft assessment
export const updateAssessmentDraft = async (id, payload) => {
  const response = await axiosInstance.put(
    `/asse/assessment-builder/${id}/`,
    payload
  );

  return response.data;
};

// Get Assessment List
export const getAssessmentList = async () => {
  const response = await axiosInstance.get(
    "/asse/assessment-builder-list/"
  );

  return response.data;
};

// get draft assessment detail
export const getAssessmentDetail = async (id) => {
  const response = await axiosInstance.get(
    `/asse/assessment-builder/${id}/`
  );

  return response.data;
};