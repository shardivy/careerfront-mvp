import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  generateQuestionCodeApi,
  createQuestionApi,
  getQuestionsApi,
  getQuestionByIdApi,
  updateQuestionApi,
} from "../api/questionApi";

// ================= GENERATE QUESTION CODE =================

export const generateQuestionCode = createAsyncThunk(
  "question/generateQuestionCode",
  async (subsectionId, { rejectWithValue }) => {
    try {
      const data = await generateQuestionCodeApi(subsectionId);

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to generate question code"
      );
    }
  }
);

// ================= CREATE QUESTION =================

export const createQuestion = createAsyncThunk(
  "question/createQuestion",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await createQuestionApi(payload);

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to publish question"
      );
    }
  }
);

// ================= GET ALL QUESTIONS ================= 
export const getQuestions = createAsyncThunk( 
  "question/getQuestions",
  async (_, { rejectWithValue }) => { 
    try { 
      const data = await getQuestionsApi(); 
      
      return data; 
    } catch (error) { 
      return rejectWithValue( 
        error.response?.data || "Failed to fetch questions"
      ); 
    } 
  }
 );

 // ================= GET QUESTION BY ID =================

export const getQuestionById = createAsyncThunk(
    "question/getQuestionById",
    async (questionId, { rejectWithValue }) => {
        try {
            const data = await getQuestionByIdApi(questionId);

            console.log("GET QUESTION BY ID RESPONSE:", data);

            return data;
        } catch (error) {
            console.error(
                "GET QUESTION BY ID ERROR:",
                error.response?.data || error
            );

            return rejectWithValue(
                error.response?.data ||
                "Failed to fetch question details"
            );
        }
    }
);

export const updateQuestion = createAsyncThunk(
  "question/updateQuestion",
  async ({ questionId, payload }, { rejectWithValue }) => {
    try {
      const data = await updateQuestionApi(questionId, payload);
 
      return data;
    } catch (error) {
      console.error(
        "UPDATE QUESTION ERROR:",
        error.response?.data || error
      );
 
      return rejectWithValue(
        error.response?.data || "Failed to update question"
      );
    }
  }
);

// ================= SLICE =================

const questionSlice = createSlice({
  name: "question",

  initialState: {
    // Generate question code
    questionCode: "",
    generateCodeLoading: false,
    generateCodeError: null,

    // Create question
    createQuestionLoading: false,
    createQuestionError: null,
    createdQuestion: null,

    // Get questions
    questions: [],
    getQuestionsLoading: false,
    getQuestionsError: null,

     // GET QUESTION BY ID
    selectedQuestion: null,
    getQuestionByIdLoading: false,
    getQuestionByIdError: null,

    //  UPDATE QUESTION 
    updateQuestionLoading: false,
    updateQuestionError: null,
    updatedQuestion: null,
  },

  reducers: {
    resetQuestionCode: (state) => {
      state.questionCode = "";
      state.generateCodeLoading = false;
      state.generateCodeError = null;
    },

    resetCreateQuestionStatus: (state) => {
      state.createQuestionLoading = false;
      state.createQuestionError = null;
      state.createdQuestion = null;
    },

    resetQuestions: (state) => { 
      state.questions = []; 
      state.getQuestionsLoading = false; 
      state.getQuestionsError = null; 
    },

    resetSelectedQuestion: (state) => {
        state.selectedQuestion = null;
        state.getQuestionByIdLoading = false;
        state.getQuestionByIdError = null;
    },

      resetUpdateQuestionStatus: (state) => {
      state.updateQuestionLoading = false;
      state.updateQuestionError = null;
      state.updatedQuestion = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ================= GENERATE QUESTION CODE =================

      .addCase(generateQuestionCode.pending, (state) => {
        state.generateCodeLoading = true;
        state.generateCodeError = null;
        state.questionCode = "";
      })

      .addCase(generateQuestionCode.fulfilled, (state, action) => {
        state.generateCodeLoading = false;

        state.questionCode =
          action.payload.question_code ||
          action.payload.code ||
          "";
      })

      .addCase(generateQuestionCode.rejected, (state, action) => {
        state.generateCodeLoading = false;
        state.generateCodeError = action.payload;

        state.questionCode = "";
      })

      // ================= CREATE QUESTION =================

      .addCase(createQuestion.pending, (state) => {
        state.createQuestionLoading = true;
        state.createQuestionError = null;
      })

      .addCase(createQuestion.fulfilled, (state, action) => {
        state.createQuestionLoading = false;
        state.createdQuestion = action.payload;
      })

      .addCase(createQuestion.rejected, (state, action) => {
        state.createQuestionLoading = false;
        state.createQuestionError = action.payload;
      })

      // ================= GET ALL QUESTIONS =================
      .addCase(getQuestions.pending, (state) => {
        state.getQuestionsLoading = true; 
        state.getQuestionsError = null; 
      }) 
      
 .addCase(getQuestions.fulfilled, (state, action) => {
  state.getQuestionsLoading = false;

  const data = action.payload?.results?.data || [];

  state.questions = data.map((item) => ({
    // ================= BASIC =================
    id: item.id,

    // ================= QUESTION =================
    questionCode: item.question_code,
    prompt: item.question_text,
    type: item.question_type,

    // ================= QUESTION DETAILS =================
    subsection: item.subsection || "",
    difficulty: item.difficulty_level,
    status: item.question_status,
    mediaType: item.media_type ?? null,
    mediaUrl: item.media_url ?? item.media_file ?? null,
    mediaFile: item.media_file ?? null,

    // ================= GRADES =================
    grades: item.grades || [],

    // Convert:
    // [{ grade_name: "11" }, { grade_name: "12" }]
    // into:
    // "11, 12"
    grade: (item.grades || [])
      .map((grade) => grade.grade_name)
      .filter(Boolean)
      .join(", "),

    // ================= DATE =================
    modifiedAt: item.updated_at,

    // ================= DEFAULT VALUES =================
    section: item.section || "",
    usages: item.usages || 0,
    createdBy: item.created_by || "-",
  }));

  // console.log("QUESTIONS FROM API:", data);
  // console.log("QUESTIONS FOR UI:", state.questions);
})
      
      .addCase(getQuestions.rejected, (state, action) => {
        state.getQuestionsLoading = false; 
        state.getQuestionsError = action.payload; 
        state.questions = []; 
      })

    // ================= GET QUESTION BY ID  for draft view =================

.addCase(getQuestionById.pending, (state) => {
    state.getQuestionByIdLoading = true;
    state.getQuestionByIdError = null;
    state.selectedQuestion = null;
})

.addCase(getQuestionById.fulfilled, (state, action) => {
    state.getQuestionByIdLoading = false;

    const response = action.payload;

    console.log("QUESTION DETAIL RESPONSE:", response);

    // Handle possible response structures
    if (response?.results?.data) {
        state.selectedQuestion = response.results.data;
    } else if (response?.data) {
        state.selectedQuestion = response.data;
    } else {
        state.selectedQuestion = response;
    }

    console.log(
        "SELECTED QUESTION STORED:",
        state.selectedQuestion
    );
})

.addCase(getQuestionById.rejected, (state, action) => {
    state.getQuestionByIdLoading = false;
    state.getQuestionByIdError = action.payload;
    state.selectedQuestion = null;
})

// ================= UPDATE QUESTION =================
 
      .addCase(updateQuestion.pending, (state) => {
        state.updateQuestionLoading = true;
        state.updateQuestionError = null;
      })
 
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.updateQuestionLoading = false;
        state.updatedQuestion = action.payload;
 
        // Keep selectedQuestion in sync in case the wizard stays mounted
        // (e.g. after a draft-save on "Next") so a later hydrate pass sees
        // fresh data rather than the pre-update snapshot.
        const response = action.payload;
        if (response?.results?.data) {
          state.selectedQuestion = response.results.data;
        } else if (response?.data) {
          state.selectedQuestion = response.data;
        } else if (response) {
          state.selectedQuestion = response;
        }
      })
 
      .addCase(updateQuestion.rejected, (state, action) => {
        state.updateQuestionLoading = false;
        state.updateQuestionError = action.payload;
      });
  },
});

export const {
  resetQuestionCode,
  resetCreateQuestionStatus,
  resetQuestions,
  resetUpdateQuestionStatus,
  resetSelectedQuestion,
} = questionSlice.actions;

export default questionSlice.reducer;

