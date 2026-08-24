import axiosInstance from "../../axiosInstance";

// ================= GET ALL SUBSECTIONS (GRADE-WISE) =================

export const getSubsectionsApi = async (gradeId) => {
  const response = await axiosInstance.get(
    "/assessment/subsections/",
    {
      params: gradeId ? { grade_id: gradeId } : {},
    }
  );

  console.log("getSubsectionsApi - Full response:", {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    dataType: typeof response.data,
    isArray: Array.isArray(response.data),
    gradeId,
  });

  return response.data;
};