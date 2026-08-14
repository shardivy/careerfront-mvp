import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import assessmentReducer from "./slices/assessmentSlice";
import gradeReducer from "./slices/gradeSlice";
import sectionReducer from "./slices/sectionSlice";
import subsectionReducer from "./slices/subsectionSlice";
import questionReducer from "./slices/questionSlice";

// student imports
import studentSectionReducer from "./slices/student-slices/studentSectionSlice";
import studentSubsectionReducer from "./slices/student-slices/studentSubsectionSlice";
import studentQuestionReducer from "./slices/student-slices/studentQuestionSlice";


export const store = configureStore({
  reducer: {
    // old one
    auth: authReducer,
    assessment: assessmentReducer,
    grade: gradeReducer,
    section: sectionReducer,
    subsection: subsectionReducer,
    question: questionReducer,

    // new one for aptitude test
    studentSection: studentSectionReducer,
    studentSubsection: studentSubsectionReducer,
    studentQuestion: studentQuestionReducer,
  },
});