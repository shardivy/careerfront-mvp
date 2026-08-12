import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getSubsectionsApi,
  createSubsectionApi,
  updateSubsectionApi,
  deleteSubsectionApi,
} from "../api/subsectionApi";

// ================= GET =================

export const fetchSubsections = createAsyncThunk(
  "subsection/fetchSubsections",
  async (_, { rejectWithValue }) => {
    try {
      return await getSubsectionsApi();
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= CREATE =================

export const createSubsection = createAsyncThunk(
  "subsection/createSubsection",
  async (payload, { rejectWithValue }) => {
    try {
      return await createSubsectionApi(payload);
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= UPDATE =================

export const updateSubsection = createAsyncThunk(
  "subsection/updateSubsection",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateSubsectionApi(id, payload);
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= DELETE =================

export const deleteSubsection = createAsyncThunk(
  "subsection/deleteSubsection",
  async (id, { rejectWithValue }) => {
    try {
      await deleteSubsectionApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  loading: false,
  success: false,
  subsection: null,

  subsections: [],
  subsectionsLoading: false,
  subsectionsError: null,

  error: null,
};

const subsectionSlice = createSlice({
  name: "subsection",
  initialState,

  reducers: {
    resetSubsectionState: (state) => {
      state.loading = false;
      state.success = false;
      state.subsection = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ================= CREATE =================

      .addCase(createSubsection.pending, (state) => {
        state.loading = true;
        state.success = false;
      })

      .addCase(createSubsection.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.subsection = action.payload;
      })

      .addCase(createSubsection.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ================= GET =================

      .addCase(fetchSubsections.pending, (state) => {
        state.subsectionsLoading = true;
        state.subsectionsError = null;
      })

      .addCase(fetchSubsections.fulfilled, (state, action) => {
        state.subsectionsLoading = false;

        const payload = action.payload;

        if (Array.isArray(payload)) {
          state.subsections = payload;
        } else if (Array.isArray(payload?.results)) {
          state.subsections = payload.results;
        } else if (Array.isArray(payload?.data)) {
          state.subsections = payload.data;
        } else if (Array.isArray(payload?.data?.results)) {
          state.subsections = payload.data.results;
        } else {
          state.subsections = [];
        }
      })

      .addCase(fetchSubsections.rejected, (state, action) => {
        state.subsectionsLoading = false;
        state.subsectionsError = action.payload;
      })

      // ================= UPDATE =================

      .addCase(updateSubsection.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateSubsection.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.subsection = action.payload;
      })

      .addCase(updateSubsection.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ================= DELETE =================

      .addCase(deleteSubsection.pending, (state) => {
        state.loading = true;
      })

      .addCase(deleteSubsection.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.subsections = state.subsections.filter(
          (item) => item.id !== action.payload
        );
      })

      .addCase(deleteSubsection.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { resetSubsectionState } = subsectionSlice.actions;

export default subsectionSlice.reducer;