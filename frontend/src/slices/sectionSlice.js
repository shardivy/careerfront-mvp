import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createSectionApi,
  getSectionsApi,
  updateSectionApi,
  deleteSectionApi,
} from "../api/sectionApi";

// ================= CREATE =================

export const createSection = createAsyncThunk(
  "section/createSection",
  async (payload, { rejectWithValue }) => {
    try {
      return await createSectionApi(payload);
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= GET =================

export const fetchSections = createAsyncThunk(
  "section/fetchSections",
  async (_, { rejectWithValue }) => {
    try {
      return await getSectionsApi();
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= UPDATE =================

export const updateSection = createAsyncThunk(
  "section/updateSection",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateSectionApi(id, payload);
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= DELETE =================

export const deleteSection = createAsyncThunk(
  "section/deleteSection",
  async (id, { rejectWithValue }) => {
    try {
      await deleteSectionApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  loading: false,
  success: false,
  section: null,

  sections: [],
  sectionsLoading: false,
  sectionsError: null,

  error: null,
};

const sectionSlice = createSlice({
  name: "section",
  initialState,

  reducers: {
    resetSectionState: (state) => {
      state.loading = false;
      state.success = false;
      state.section = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // CREATE

      .addCase(createSection.pending, (state) => {
        state.loading = true;
        state.success = false;
      })

      .addCase(createSection.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.section = action.payload;
      })

      .addCase(createSection.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // GET

      .addCase(fetchSections.pending, (state) => {
        state.sectionsLoading = true;
        state.sectionsError = null;
      })

     .addCase(fetchSections.fulfilled, (state, action) => {
  state.sectionsLoading = false;

  const payload = action.payload;

  if (Array.isArray(payload)) {
    state.sections = payload;
  } else if (Array.isArray(payload?.results)) {
    state.sections = payload.results;
  } else if (Array.isArray(payload?.data)) {
    state.sections = payload.data;
  } else if (Array.isArray(payload?.data?.results)) {
    state.sections = payload.data.results;
  } else {
    state.sections = [];
  }
})

      .addCase(fetchSections.rejected, (state, action) => {
        state.sectionsLoading = false;
        state.sectionsError = action.payload;
      })

      // UPDATE

      .addCase(updateSection.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateSection.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.section = action.payload;
      })

      .addCase(updateSection.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // DELETE

      .addCase(deleteSection.pending, (state) => {
        state.loading = true;
      })

      .addCase(deleteSection.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.sections = state.sections.filter(
          (item) => item.id !== action.payload
        );
      })

      .addCase(deleteSection.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { resetSectionState } = sectionSlice.actions;

export default sectionSlice.reducer;