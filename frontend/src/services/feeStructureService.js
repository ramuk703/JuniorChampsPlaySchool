import api from "./api";

export const getFeeStructures = async () => {
  const response = await api.get("/fee-structures");
  return response.data;
};

export const createFeeStructure = async (feeStructureData) => {
  const response = await api.post("/fee-structures", feeStructureData);
  return response.data;
};
