import api from "./api";

export const getParentPaymentConfig = async () => {
  const response = await api.get("/parents/payment-config");
  return response.data;
};

let parentFeesRequest = null;

export const getParentFees = async ({ forceRefresh = false } = {}) => {
  if (parentFeesRequest && !forceRefresh) {
    return parentFeesRequest;
  }

  const request = api
    .get("/parents/fees")
    .then((response) => response.data);

  parentFeesRequest = request;

  try {
    return await request;
  } finally {
    if (parentFeesRequest === request) {
      parentFeesRequest = null;
    }
  }
};

export const getParentFeeById = async (feeId) => {
  const response = await api.get(`/parents/fees/${feeId}`);
  return response.data;
};

export const createParentPaymentOrder = async (feeId) => {
  const response = await api.post(
    `/parents/fees/${feeId}/create-order`
  );
  return response.data;
};

export const verifyParentPayment = async ({
  feeId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const response = await api.post(
    `/parents/fees/${feeId}/verify`,
    {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }
  );

  return response.data;
};
