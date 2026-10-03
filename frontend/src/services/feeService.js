import api from "./api";

export const getFees = async ({
  page = 1,
  limit = 20,
  search = "",
} = {}) => {
  const response = await api.get("/fees", {
    params: {
  page,
  limit,
  ...(search.trim() ? { search: search.trim() } : {}),
},
  });

  return response.data;
};

export const generateFee = async (feeData) => {
  const response = await api.post("/fees", feeData);
  return response.data;
};

export const generateMonthlyFees = async () => {
  const response = await api.post("/fees/generate-monthly");
  return response.data;
};

export const markFeePaid = async (paymentId) => {
  const response = await api.put(`/fees/${paymentId}/pay`);
  return response.data;
};
