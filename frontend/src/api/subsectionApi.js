import axiosInstance from "../axiosInstance";

// ================= GET SUBSECTIONS =================

export const getSubsectionsApi = async () => {
  const response = await axiosInstance.get("/asse/subsections/");
  return response.data;
};

// ================= CREATE SUBSECTION =================

export const createSubsectionApi = async (payload) => {
  const response = await axiosInstance.post("/asse/subsections/", payload);
  return response.data;
};

// ================= UPDATE SUBSECTION =================

export const updateSubsectionApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/asse/subsections/${id}/`,
    payload
  );
  return response.data;
};

// ================= DELETE SUBSECTION =================

export const deleteSubsectionApi = async (id) => {
  const response = await axiosInstance.delete(
    `/asse/subsections/${id}/`
  );
  return response.data;
};