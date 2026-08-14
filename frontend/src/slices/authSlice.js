import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginApi,
  registerApi,
  verifyOtpApi,
  resendOtpApi,
  forgotPasswordApi,
  verifyResetOtpApi,
  resetPasswordApi,
} from "../api/authApi";

// ================= LOGIN =================

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await loginApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Login Failed"
      );
    }
  }
);

// ================= REGISTER =================

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await registerApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Registration Failed"
      );
    }
  }
);

// ================= VERIFY OTP =================

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await verifyOtpApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "OTP Verification Failed"
      );
    }
  }
);

// ================= RESEND OTP =================

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await resendOtpApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to resend OTP"
      );
    }
  }
);

// ================= FORGOT PASSWORD =================

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await forgotPasswordApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to send OTP"
      );
    }
  }
);

// ================= VERIFY RESET OTP =================

export const verifyResetOtp = createAsyncThunk(
  "auth/verifyResetOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await verifyResetOtpApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "OTP Verification Failed"
      );
    }
  }
);

// ================= RESET PASSWORD =================

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await resetPasswordApi(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Password Reset Failed"
      );
    }
  }
);

// ================= SLICE =================

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    forgotPasswordLoading: false,
    verifyResetOtpLoading: false,
    error: null,
  },

  reducers: {
    logout: (state) => {
      localStorage.clear();

      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;

        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;

        localStorage.setItem(
          "accessToken",
          action.payload.access
        );

        localStorage.setItem(
          "refreshToken",
          action.payload.refresh
        );
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // REGISTER

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // VERIFY OTP

      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user || state.user;
      })

      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= RESEND OTP =================

      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= FORGOT PASSWORD =================

      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
      })

      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
      })

      .addCase(forgotPassword.rejected, (state) => {
        state.forgotPasswordLoading = false;
      })

      // ================= VERIFY RESET OTP =================

      .addCase(verifyResetOtp.pending, (state) => {
        state.verifyResetOtpLoading = true;
      })

      .addCase(verifyResetOtp.fulfilled, (state) => {
        state.verifyResetOtpLoading = false;
      })

      .addCase(verifyResetOtp.rejected, (state) => {
        state.verifyResetOtpLoading = false;
      })

      // ================= RESET PASSWORD =================

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;