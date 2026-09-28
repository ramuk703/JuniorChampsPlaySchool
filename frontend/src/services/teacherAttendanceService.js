import api from "./api";

export const getTeacherAttendance = async () => {
  const response = await api.get("/teacher-attendance");
  return response.data;
};

export const markTeacherAttendance = async (attendanceData) => {
  const response = await api.post("/teacher-attendance", attendanceData);
  return response.data;
};
