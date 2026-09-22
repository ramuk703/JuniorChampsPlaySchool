import api from "./api";

export const getParents = async ({
  page = 1,
  limit = 10,
  search = "",
} = {}) => {
  const response = await api.get("/parents", {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
    },
  });

  return response.data;
};

export const getParentById = async (parentId) => {
  const response = await api.get(`/parents/${parentId}`);
  return response.data;
};

export const createParent = async (parentData) => {
  const response = await api.post("/parents", parentData);
  return response.data;
};

export const updateParent = async ({ parentId, parentData }) => {
  const response = await api.put(`/parents/${parentId}`, parentData);
  return response.data;
};

export const deleteParent = async (parentId) => {
  const response = await api.delete(`/parents/${parentId}`);
  return response.data;
};

export const getDeletedParents = async ({
  page = 1,
  limit = 10,
  search = "",
} = {}) => {
  const response = await api.get("/parents/deleted", {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
    },
  });

  return response.data;
};

export const restoreParent = async (parentId) => {
  const response = await api.patch(`/parents/${parentId}/restore`);
  return response.data;
};
