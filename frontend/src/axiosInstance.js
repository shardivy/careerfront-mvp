// import axios from "axios";

// const axiosInstance = axios.create({
//     baseURL: "http://10.253.15.38:8000/api/v1/",
// });

// const publicEndpoints = [
//     "/auth/login/",
//     "/auth/register/",
//     "/auth/verify-otp/",
//     "/auth/resend-otp/",
//     "/auth/forgot-password/",
//     "/auth/reset-password/",
//     "/auth/refresh/", // Refresh API should also be public
// ];

// // ==================== REQUEST INTERCEPTOR ====================

// axiosInstance.interceptors.request.use(
//     (config) => {

//         const token = localStorage.getItem("accessToken");

//         const isPublic = publicEndpoints.some((url) =>
//             config.url?.includes(url)
//         );

//         if (token && !isPublic) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }

//         if (config.data instanceof FormData) {
//             delete config.headers["Content-Type"];
//         } else {
//             config.headers["Content-Type"] = "application/json";
//         }

//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// // ==================== RESPONSE INTERCEPTOR ====================

// axiosInstance.interceptors.response.use(
//     (response) => response,

//     async (error) => {

//         const originalRequest = error.config;

//         if (
//             error.response?.status === 401 &&
//             !originalRequest._retry &&
//             !originalRequest.url.includes("/auth/refresh/")
//         ) {

//             originalRequest._retry = true;

//             const refreshToken = localStorage.getItem("refreshToken");

//             if (!refreshToken) {
//                 localStorage.clear();
//                 window.location.href = "/";
//                 return Promise.reject(error);
//             }

//             try {

//                 const response = await axios.post(
//                     "http://10.253.15.38:8000/api/v1/auth/refresh/",
//                     {
//                         refresh: refreshToken,
//                     }
//                 );

//                 // Backend returns BOTH access & refresh
//                 const { access, refresh } = response.data;

//                 localStorage.setItem("accessToken", access);
//                 localStorage.setItem("refreshToken", refresh);

//                 originalRequest.headers.Authorization = `Bearer ${access}`;

//                 return axiosInstance(originalRequest);

//             } catch (refreshError) {

//                 localStorage.clear();
//                 window.location.href = "/";

//                 return Promise.reject(refreshError);
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default axiosInstance;


import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "https://careerfront-apt.ramsolutions.in/api/",
    // baseURL: "http://192.168.247.38:8000/api/",
});

const publicEndpoints = [
    "/auth/login/",
    "/auth/register/",
    "/auth/verify-otp/",
    "/auth/resend-otp/",
    "/auth/forgot-password/",
    "/auth/reset-password/",
    "/auth/refresh/", // Refresh API should also be public
];

// ==================== REQUEST INTERCEPTOR ====================

axiosInstance.interceptors.request.use(
    (config) => {

        // TEMP: backend isn't expecting the Authorization header yet —
        // commented out for now. Re-enable once the backend is ready.
        // const token = localStorage.getItem("accessToken");

        // const isPublic = publicEndpoints.some((url) =>
        //     config.url?.includes(url)
        // );

        // if (token && !isPublic) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }

        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        } else {
            config.headers["Content-Type"] = "application/json";
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================

axiosInstance.interceptors.response.use(
    (response) => response,

    async (error) => {

        const originalRequest = error.config;

        // TEMP: token refresh-on-401 retry flow disabled along with the
        // Authorization header above. Re-enable both together.
        // if (
        //     error.response?.status === 401 &&
        //     !originalRequest._retry &&
        //     !originalRequest.url.includes("/auth/refresh/")
        // ) {

        //     originalRequest._retry = true;

        //     const refreshToken = localStorage.getItem("refreshToken");

        //     if (!refreshToken) {
        //         localStorage.clear();
        //         window.location.href = "/";
        //         return Promise.reject(error);
        //     }

        //     try {

        //         const response = await axios.post(
        //             "http://10.253.15.38:8000/api/v1/auth/refresh/",
        //             {
        //                 refresh: refreshToken,
        //             }
        //         );

        //         // Backend returns BOTH access & refresh
        //         const { access, refresh } = response.data;

        //         localStorage.setItem("accessToken", access);
        //         localStorage.setItem("refreshToken", refresh);

        //         originalRequest.headers.Authorization = `Bearer ${access}`;

        //         return axiosInstance(originalRequest);

        //     } catch (refreshError) {

        //         localStorage.clear();
        //         window.location.href = "/";

        //         return Promise.reject(refreshError);
        //     }
        // }

        return Promise.reject(error);
    }
);

export default axiosInstance;