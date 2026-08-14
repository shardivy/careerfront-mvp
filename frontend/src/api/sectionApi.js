import axiosInstance from "../axiosInstance";

// ================= CREATE SECTION =================

export const createSectionApi = async (payload) => {
  const response = await axiosInstance.post("/asse/sections/", payload);
  return response.data;
};

// ================= GET SECTIONS =================

export const getSectionsApi = async () => {
  const response = await axiosInstance.get("/asse/sections/");
  return response.data;
};

// ================= UPDATE SECTION =================

export const updateSectionApi = async (id, payload) => {
  const response = await axiosInstance.put(`/asse/sections/${id}/`, payload);
  return response.data;
};

// ================= DELETE SECTION =================

export const deleteSectionApi = async (id) => {
  const response = await axiosInstance.delete(`/asse/sections/${id}/`);
  return response.data;
};