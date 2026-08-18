import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  responses: [],
  currentPage: 0,
  questionsPerPage: 10,
  submitting: false,
  submitted: false,
  error: null,
};

const studentResponseSlice = createSlice({
  name: "studentResponse",

  initialState,

  reducers: {
    setResponses: (state, action) => {
      state.responses = action.payload;
    },

    addOrUpdateResponse: (state, action) => {
      const response = action.payload;

      const existingIndex =
        state.responses.findIndex(
          (item) =>
            item.question_id === response.question_id
        );

      if (existingIndex !== -1) {
        state.responses[existingIndex] = {
          ...state.responses[existingIndex],
          ...response,
        };
      } else {
        state.responses.push(response);
      }
    },

    updateMarkStatus: (state, action) => {
      const {
        question_id,
        is_marked,
      } = action.payload;

      const existingIndex =
        state.responses.findIndex(
          (item) =>
            item.question_id === question_id
        );

      if (existingIndex !== -1) {
        state.responses[existingIndex].is_marked =
          is_marked;
      } else {
        state.responses.push({
          question_id,
          selected_response: null,
          is_answered: false,
          is_marked,
        });
      }
    },

    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    nextPage: (state) => {
      state.currentPage += 1;
    },

    previousPage: (state) => {
      if (state.currentPage > 0) {
        state.currentPage -= 1;
      }
    },

    setSubmitting: (state, action) => {
      state.submitting = action.payload;
    },

    setSubmitted: (state, action) => {
      state.submitted = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    resetResponseState: () => initialState,
  },
});

export const {
  setResponses,
  addOrUpdateResponse,
  updateMarkStatus,
  setCurrentPage,
  nextPage,
  previousPage,
  setSubmitting,
  setSubmitted,
  setError,
  resetResponseState,
} = studentResponseSlice.actions;

export default studentResponseSlice.reducer;