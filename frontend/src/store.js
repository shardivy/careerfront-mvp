import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import assessmentReducer from "./slices/assessmentSlice";
import gradeReducer from "./slices/gradeSlice";
import sectionReducer from "./slices/sectionSlice";
import subsectionReducer from "./slices/subsectionSlice";
import questionReducer from "./slices/questionSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assessment: assessmentReducer,
    grade: gradeReducer,
    section: sectionReducer,
    subsection: subsectionReducer,
    question: questionReducer,
  },
});