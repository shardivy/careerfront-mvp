import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getQuestionsApi } from "../../api/student-api/studentQuestionApi";
import { transformApiQuestionsResponse } from "../../utils/questionTransformer";

// =====================================================
// GET QUESTIONS BY GRADE + SUBSECTION
// =====================================================

export const getStudentQuestions = createAsyncThunk(
  "studentQuestion/getStudentQuestions",

  async ({ gradeId, subsectionId }, { rejectWithValue }) => {
    try {
      //console.log("Fetching questions for:", { gradeId, subsectionId });
      const response = await getQuestionsApi(gradeId, subsectionId);
    //   console.log("Questions API response:", response);

      return response;
    } catch (error) {
    //   console.error("Questions API error:", error);
      return rejectWithValue(
        error.response?.data || "Failed to fetch questions"
      );
    }
  }
);

// =====================================================
// SLICE
// =====================================================

const studentQuestionSlice = createSlice({
  name: "studentQuestion",

  initialState: {
    questions: [],
    subsectionId: null,
    subsectionName: "",
    count: 0,

    loading: false,
    error: null,
  },

  reducers: {
    clearStudentQuestions: (state) => {
      state.questions = [];
      state.subsectionId = null;
      state.subsectionName = "";
      state.count = 0;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getStudentQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getStudentQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const transformed = transformApiQuestionsResponse(action.payload);

        state.questions = transformed.questions;
        state.subsectionId = transformed.subsectionId || null;
        state.subsectionName = transformed.subsectionName || "";
        state.count = transformed.count;

        console.log("Questions transformed and stored:", {
          count: state.count,
          questionsLength: state.questions.length,
          subsectionName: state.subsectionName,
        });
      })

      .addCase(getStudentQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("Questions fetch failed:", action.payload);
      });
  },
});

export const { clearStudentQuestions } = studentQuestionSlice.actions;

export default studentQuestionSlice.reducer;