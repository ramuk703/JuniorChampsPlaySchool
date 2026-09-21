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
