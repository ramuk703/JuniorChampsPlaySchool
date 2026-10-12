import api from "./api";

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;

  return (
    data?.students ||
    data?.teachers ||
    data?.parents ||
    data?.payments ||
    data?.fees ||
    data?.data ||
    []
  );
};

export const searchStudents = async (search) => {
  const response = await api.get("/students", {
    params: { page: 1, limit: 5, search: search.trim() },
  });

  return normalizeList(response.data);
};

export const searchTeachers = async (search) => {
  const response = await api.get("/teachers", {
    params: { page: 1, limit: 5, search: search.trim() },
  });

  return normalizeList(response.data);
};

export const searchParents = async (search) => {
  const response = await api.get("/parents", {
    params: { page: 1, limit: 5, search: search.trim() },
  });

  return normalizeList(response.data);
};

export const searchFees = async (search) => {
  const response = await api.get("/fees", {
    params: { page: 1, limit: 5, search: search.trim() },
  });

  return normalizeList(response.data);
};

export const globalSearch = async (search) => {
  const keyword = search.trim();

  if (!keyword) {
    return {
      students: [],
      teachers: [],
      parents: [],
      fees: [],
    };
  }

  const [students, teachers, parents, fees] = await Promise.all([
    searchStudents(keyword),
    searchTeachers(keyword),
    searchParents(keyword),
    searchFees(keyword),
  ]);

  return {
    students,
    teachers,
    parents,
    fees,
  };
};
