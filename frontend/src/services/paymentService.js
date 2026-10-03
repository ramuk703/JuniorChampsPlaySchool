import api from "./api";

export const getPaymentConfig = async () => {
  const response = await api.get("/payments/config");
  return response.data;
};

export const createPaymentOrder = async (feePaymentId) => {
  const response = await api.post("/payments/create-order", {
    feePaymentId,
  });

  return response.data;
};

export const verifyPayment = async ({
  feePaymentId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const response = await api.post("/payments/verify", {
    feePaymentId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  return response.data;
};
