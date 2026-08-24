import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSubsectionsApi } from "../../api/student-api/studentSubsectionApi";

// ================= GET ALL SUBSECTIONS =================

export const getStudentSubsections = createAsyncThunk(
  "studentSubsection/getStudentSubsections",

  async (gradeId, { rejectWithValue }) => {
    try {
      const data = await getSubsectionsApi(gradeId);
      console.log("API Response - getSubsectionsApi:", data);
      return data;
    } catch (error) {
      console.error("API Error - getSubsectionsApi:", error);
      return rejectWithValue(
        error.response?.data || "Failed to fetch subsections"
      );
    }
  }
);

// ================= SLICE =================

const studentSubsectionSlice = createSlice({
  name: "studentSubsection",

  initialState: {
    subsections: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearStudentSubsections: (state) => {
      state.subsections = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getStudentSubsections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getStudentSubsections.fulfilled, (state, action) => {
        state.loading = false;

        let data = [];
        const payload = action.payload;

        console.log("Redux fulfilled - payload structure:", {
          hasResults: !!payload?.results,
          hasSubsections: !!payload?.results?.subsections,
          payload: payload,
        });

        if (payload?.results?.subsections && Array.isArray(payload.results.subsections)) {
          data = payload.results.subsections;
        } else if (Array.isArray(payload)) {
          data = payload;
        } else if (payload?.data && Array.isArray(payload.data)) {
          data = payload.data;
        }

        console.log("Redux - setting subsections:", { dataLength: data.length, firstItem: data[0] });
        state.subsections = data;
      })

      .addCase(getStudentSubsections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearStudentSubsections,
} = studentSubsectionSlice.actions;

export default studentSubsectionSlice.reducer;