import api from "./api";

export const getParentPaymentConfig = async () => {
  const response = await api.get("/parents/payment-config");
  return response.data;
};

export const getParentFees = async () => {
  const response = await api.get("/parents/fees");
  return response.data;
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
