import api from "./api";

export const getPublicGalleries = async (params = {}) => {
  const response = await api.get("/public/galleries", {
    params,
  });

  return response.data;
};

export const getPublicGalleryById = async (id) => {
  const response = await api.get(`/public/galleries/${id}`);

  return response.data;
};
