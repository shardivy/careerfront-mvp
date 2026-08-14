import axiosInstance from "../axiosInstance";

// ================= LOGIN =================

export const loginApi = async (payload) => {
  const response = await axiosInstance.post(
    "/auth/login/",
    payload);
  return response.data;
};

// ================= REGISTER =================

export const registerApi = async (payload) => {
  const response = await axiosInstance.post(
    "/auth/register/",
    payload
  );

  return response.data;
};

// ================= VERIFY OTP =================

export const verifyOtpApi = async (payload) => {
  const response = await axiosInstance.post(
    "/auth/verify-otp/",
    payload
  );

  return response.data;
};

// ================= RESEND OTP =================

export const resendOtpApi = async (payload) => {
  const response = await axiosInstance.post(
    "/auth/resend-otp/",
    payload
  );

  return response.data;
};

// ================= FORGOT PASSWORD =================

export const forgotPasswordApi = async (payload) => {
  const response = await axiosInstance.post(
    "/auth/forgot-password/",
    payload
  );

  return response.data;
};

// ================= VERIFY RESET OTP =================

export const verifyResetOtpApi = async (payload) => {
  const response = await axiosInstance.post(
    "/auth/verify-reset-otp/",
    payload
  );

  return response.data;
};

// ================= RESET PASSWORD =================

export const resetPasswordApi = async (payload) => {
  const response = await axiosInstance.post(
    "/auth/reset-password/",
    payload
  );

  return response.data;
};