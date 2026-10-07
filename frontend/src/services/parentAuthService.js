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


export const changeParentPassword = async ({
  currentPassword,
  newPassword,
}) => {
  const response = await api.patch("/parents/password", {
    currentPassword,
    newPassword,
  });

  return response.data;
};

export const forgotParentPassword = async (email) => {
  const response = await api.post("/parents/forgot-password", {
    email,
  });

  return response.data;
};

export const resetParentPassword = async ({ token, newPassword }) => {
  const response = await api.post("/parents/reset-password", {
    token,
    newPassword,
  });

  return response.data;
};
