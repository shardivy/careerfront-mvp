import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSectionsApi } from "../../api/student-api/studentSectionApi";

// ================= GET SECTIONS =================

export const getStudentSections = createAsyncThunk(
  "studentSection/getStudentSections",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getSectionsApi();

      console.log("Sections API response:", response);

      return response.data;
    } catch (error) {
      console.error("Sections API error:", error);

      return rejectWithValue(
        error.response?.data || "Failed to fetch sections"
      );
    }
  }
);

// ================= SLICE =================

const studentSectionSlice = createSlice({
  name: "studentSection",

  initialState: {
    sections: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearStudentSections: (state) => {
      state.sections = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(getStudentSections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getStudentSections.fulfilled, (state, action) => {
        state.loading = false;

        console.log("Sections stored in Redux:", action.payload);

        state.sections = action.payload;
      })

      .addCase(getStudentSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStudentSections } = studentSectionSlice.actions;

export default studentSectionSlice.reducer;