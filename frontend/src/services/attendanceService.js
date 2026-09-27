import api from "./api";

export const getAttendance = async ({
  page = 1,
  limit = 10,
  studentId = "",
  status = "",
  className = "",
  date = "",
} = {}) => {
  const response = await api.get("/attendance", {
    params: {
      page,
      limit,
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
      ...(className.trim() ? { className: className.trim() } : {}),
      ...(date ? { date } : {}),
    },
  });

  return response.data;
};

export const markAttendance = async (attendanceData) => {
  const response = await api.post("/attendance", attendanceData);
  return response.data;
};

export const bulkAttendance = async (attendanceData) => {
  const response = await api.post("/attendance/bulk", attendanceData);
  return response.data;
};

export const getStudentAttendance = async (
  studentId,
  {
    page = 1,
    limit = 10,
    status = "",
    date = "",
  } = {},
) => {
  const response = await api.get(`/attendance/student/${studentId}`, {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(date ? { date } : {}),
    },
  });

  return response.data;
};

export const getAttendanceStats = async () => {
  const response = await api.get("/attendance/stats");
  return response.data;
};

export const getMonthlyAttendance = async ({
  month,
  year,
  page = 1,
  limit = 10,
  studentId = "",
  status = "",
  className = "",
} = {}) => {
  const response = await api.get("/attendance/monthly", {
    params: {
      month,
      year,
      page,
      limit,
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
      ...(className.trim() ? { className: className.trim() } : {}),
    },
  });

  return response.data;
};

export const getAttendancePercentage = async (studentId) => {
  const response = await api.get(`/attendance/percentage/${studentId}`);
  return response.data;
};

export const getAttendanceCalendar = async (studentId, { month, year } = {}) => {
  const response = await api.get(`/attendance/calendar/${studentId}`, {
    params: {
      month,
      year,
    },
  });

  return response.data;
};

export const getAttendanceAnalytics = async () => {
  const response = await api.get("/attendance/analytics");
  return response.data;
};

export const exportAttendanceExcel = async () => {
  const response = await api.get("/attendance/export/excel", {
    responseType: "blob",
  });

  return response.data;
};
