import api from "./api";

export const getStudents = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get("/students", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
};

// Naya function: Single student ka data laane ke liye
export const getStudent = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

export const searchStudents = async (keyword) => {
  const response = await api.get("/students/search", {
    params: {
      q: keyword,
    },
  });

  return response.data;
};

export const createStudent = async (formData) => {
  const response = await api.post("/students", formData);

  return response.data;
};

// Naya function: Student ka data update karne ke liye
export const updateStudent = async (id, formData) => {
  const response = await api.put(`/students/${id}`, formData);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

export const getDeletedStudents = async () => {
  const response = await api.get("/students/deleted");
  return response.data;
};

export const restoreStudent = async (id) => {
  const response = await api.patch(`/students/${id}/restore`);
  return response.data;
};
