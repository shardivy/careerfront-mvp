import axiosInstance from "../../axiosInstance";

// ================= GET ALL SECTIONS =================

export const getSectionsApi = async () => {
  const response = await axiosInstance.get(
    "/assessment/sections/"
  );

  return response.data;
};