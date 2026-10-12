import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const teacherRoutes = ["/teacher-portal", "/teacher-auth/me"];
    const isTeacherRequest = teacherRoutes.some((route) => config.url === route || config.url?.startsWith(`${route}/`));

    const parentRoutes = [
      "/parents/login",
      "/parents/register",
      "/parents/forgot-password",
      "/parents/reset-password",
      "/parents/dashboard",
      "/parents/payment-config",
      "/parents/fees",
      "/parents/password",
      "/parents/logout",
      "/parents/profile/photo",
    ];

    const isParentRequest = parentRoutes.some(
      (route) =>
        config.url === route || config.url?.startsWith(`${route}/`),
    );

    const token = isTeacherRequest
      ? localStorage.getItem("teacherAccessToken")
      : isParentRequest
        ? localStorage.getItem("parentAccessToken")
        : localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url?.split("?")[0] || "";

      const publicAuthRoutes = [
        "/auth/login",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/parents/login",
        "/parents/register",
        "/parents/forgot-password",
        "/parents/reset-password",
        "/teacher-auth/login",
      ];

      const isPublicAuthRequest = publicAuthRoutes.some(
        (route) => url === route || url.startsWith(`${route}/`),
      );

      if (!isPublicAuthRequest) {
        const teacherRoutes = ["/teacher-portal", "/teacher-auth/me"];
        const isTeacherRequest = teacherRoutes.some((route) => url === route || url.startsWith(`${route}/`));

        const parentRoutes = [
          "/parents/dashboard",
          "/parents/payment-config",
          "/parents/fees",
          "/parents/password",
          "/parents/logout",
          "/parents/profile",
        ];

        const isParentRequest = parentRoutes.some(
          (route) => url === route || url.startsWith(`${route}/`),
        );

        const scope = isTeacherRequest ? "teacher" : isParentRequest ? "parent" : "admin";

        if (isTeacherRequest) {
          localStorage.removeItem("teacherAccessToken");
          localStorage.removeItem("teacherUser");
          localStorage.removeItem("teacherProfile");
        } else if (isParentRequest) {
          localStorage.removeItem("parentAccessToken");
          localStorage.removeItem("parentUser");
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("authUser");
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth:session-expired", {
              detail: { scope },
            }),
          );
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
