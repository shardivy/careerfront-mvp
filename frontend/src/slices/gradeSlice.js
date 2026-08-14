import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createGradeApi,
  getGradesApi,
  updateGradeApi,
  deleteGradeApi
} from "../api/gradeApi";

// ================= CREATE GRADE =================

export const createGrade = createAsyncThunk(
  "grade/createGrade",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await createGradeApi(payload);
      return data;
    } catch (error) {
      console.log("API Error:", error.response);
      console.log("Response Data:", error.response?.data);

      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= GET GRADES =================

export const fetchGrades = createAsyncThunk(
  "grade/fetchGrades",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getGradesApi();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= UPDATE GRADE =================

export const updateGrade = createAsyncThunk(
  "grade/updateGrade",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await updateGradeApi(id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= DELETE GRADE =================

export const deleteGrade = createAsyncThunk(
  "grade/deleteGrade",
  async (id, { rejectWithValue }) => {
    try {
      const data = await deleteGradeApi(id);
      return { id, data };
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  loading: false,
  success: false,
  grade: null,
  grades: [],
  gradesLoading: false,
  gradesError: null,
  error: null,
};

const gradeSlice = createSlice({
  name: "grade",
  initialState,

  reducers: {
    resetGradeState: (state) => {
      state.loading = false;
      state.success = false;
      state.grade = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(createGrade.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })

      .addCase(createGrade.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.grade = action.payload;
      })

      .addCase(createGrade.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ================= GET GRADES =================

      .addCase(fetchGrades.pending, (state) => {
        state.gradesLoading = true;
        state.gradesError = null;
      })

      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.gradesLoading = false;

        const payload = action.payload;
        const nestedData =
          payload?.results?.data ??
          payload?.data?.data ??
          payload?.data ??
          payload?.results;

        if (Array.isArray(payload)) {
          state.grades = payload;
        } else if (Array.isArray(nestedData)) {
          state.grades = nestedData;
        } else {
          state.grades = [];
        }
      })

      .addCase(fetchGrades.rejected, (state, action) => {
        state.gradesLoading = false;
        state.gradesError = action.payload;
      })

      // ================= UPDATE GRADE =================

.addCase(updateGrade.pending, (state) => {
  state.loading = true;
  state.success = false;
  state.error = null;
})

.addCase(updateGrade.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;
  state.grade = action.payload;
})

.addCase(updateGrade.rejected, (state, action) => {
  state.loading = false;
  state.success = false;
  state.error = action.payload;
})

// ================= DELETE GRADE =================

.addCase(deleteGrade.pending, (state) => {
  state.loading = true;
  state.success = false;
  state.error = null;
})

.addCase(deleteGrade.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;

  state.grades = state.grades.filter(
    (grade) => grade.id !== action.payload.id
  );
})

.addCase(deleteGrade.rejected, (state, action) => {
  state.loading = false;
  state.success = false;
  state.error = action.payload;
})

  },
});

export const { resetGradeState } = gradeSlice.actions;

export default gradeSlice.reducer;