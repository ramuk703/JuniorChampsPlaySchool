import api from "./api";

export const getTeachers = async (params = {}) => {
  const response = await api.get("/teachers", { params });
  return response.data;
};

export const getAllTeachers = async () => {
  const response = await api.get("/teachers/all-unpaginated");
  return response.data;
};

export const getTeacher = async (id) => {
  const response = await api.get(`/teachers/${id}`);
  return response.data;
};

export const createTeacher = async (formData) => {
  const response = await api.post("/teachers", formData);
  return response.data;
};

export const updateTeacher = async (id, formData) => {
  const response = await api.put(`/teachers/${id}`, formData);
  return response.data;
};

export const deleteTeacher = async (id) => {
  const response = await api.delete(`/teachers/${id}`);
  return response.data;
};

export const getDeletedTeachers = async (params = {}) => {
  const response = await api.get("/teachers/deleted", { params });
  return response.data;
};

export const restoreTeacher = async (id) => {
  const response = await api.patch(`/teachers/${id}/restore`);
  return response.data;
};

export const exportTeachers = async () => {
  const response = await api.get("/teachers/export", {
    responseType: "blob",
  });

  return response.data;
};
