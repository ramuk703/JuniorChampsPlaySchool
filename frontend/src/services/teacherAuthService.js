import api from "./api";
export const loginTeacher = async (credentials) => (await api.post("/teacher-auth/login", credentials)).data;
export const getTeacherMe = async () => (await api.get("/teacher-auth/me")).data;
export const getTeacherDashboard = async () => (await api.get("/teacher-portal/dashboard")).data;
export const getTeacherProfile = async () => (await api.get("/teacher-portal/profile")).data;
export const getMyTeacherAttendance = async (params = {}) => (await api.get("/teacher-portal/attendance", { params })).data;
