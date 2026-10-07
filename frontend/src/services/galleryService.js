import api from "./api";

export const getGalleries = async ({ page = 1, limit = 10, status = "" } = {}) => {
  const response = await api.get("/galleries", {
    params: { page, limit, ...(status ? { status } : {}) },
  });
  return response.data;
};

export const getGalleryById = async (id) => {
  const response = await api.get(`/galleries/${id}`);
  return response.data;
};

export const createGallery = async (formData) => {
  const response = await api.post("/galleries", formData);
  return response.data;
};

export const updateGallery = async (id, data) => {
  const response = await api.put(`/galleries/${id}`, data);
  return response.data;
};

export const addGalleryImages = async (id, formData) => {
  const response = await api.post(`/galleries/${id}/images`, formData);
  return response.data;
};

export const updateGalleryImage = async (galleryId, imageId, data) => {
  const response = await api.patch(
    `/galleries/${galleryId}/images/${imageId}`,
    data,
  );
  return response.data;
};

export const deleteGalleryImage = async (galleryId, imageId) => {
  const response = await api.delete(
    `/galleries/${galleryId}/images/${imageId}`,
  );
  return response.data;
};

export const deleteGallery = async (id) => {
  const response = await api.delete(`/galleries/${id}`);
  return response.data;
};
