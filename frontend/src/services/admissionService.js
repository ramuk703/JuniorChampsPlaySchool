import api from "./api";

export const submitAdmissionEnquiry = async (payload) => {
  const response = await api.post("/admissions/public", payload);
  return response.data;
};

export const getAdmissionEnquiries = async (params = {}) => {
  const response = await api.get("/admissions", { params });
  return response.data;
};

export const getAdmissionEnquiry = async (id) => {
  const response = await api.get(`/admissions/${id}`);
  return response.data;
};

export const updateAdmissionEnquiry = async (id, payload) => {
  const response = await api.patch(`/admissions/${id}`, payload);
  return response.data;
};
