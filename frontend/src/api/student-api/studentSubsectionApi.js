import axiosInstance from "../../axiosInstance";

// ================= GET ALL SUBSECTIONS =================

export const getSubsectionsApi = async () => {
  const response = await axiosInstance.get(
    "/assessment/subsections/"
  );

  console.log("getSubsectionsApi - Full response:", {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    dataType: typeof response.data,
    isArray: Array.isArray(response.data),
  });

  return response.data;
};