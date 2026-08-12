import axiosInstance from "../axiosInstance";

// ================= CREATE GRADE =================

export const createGradeApi = async (payload) => {
  const response = await axiosInstance.post("/asse/grades/", payload);
  return response.data;
};

// ================= GET GRADES =================

export const getGradesApi = async () => {
  const response = await axiosInstance.get("/asse/grades/");
  return response.data;
};

// ================= UPDATE GRADE =================

export const updateGradeApi = async (id, payload) => {
  const response = await axiosInstance.put(`/asse/grades/${id}/`, payload);
  return response.data;
};

// ================= DELETE GRADE =================

export const deleteGradeApi = async (id) => {
  const response = await axiosInstance.delete(`/asse/grades/${id}/`);
  return response.data;
};