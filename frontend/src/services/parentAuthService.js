import api from "./api";

export const loginParent = async ({ email, password }) => {
  const response = await api.post("/parents/login", {
    email,
    password,
  });

  return response.data;
};

export const getParentDashboard = async () => {
  const response = await api.get("/parents/dashboard");

  return response.data;
};

export const logoutParent = async () => {
  const response = await api.post("/parents/logout");

  return response.data;
};
