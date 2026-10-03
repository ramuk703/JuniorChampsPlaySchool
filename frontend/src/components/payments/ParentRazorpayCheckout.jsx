import { useMutation, useQuery } from "@tanstack/react-query";
import { FiCreditCard, FiLoader } from "react-icons/fi";

import {
  createParentPaymentOrder,
  getParentPaymentConfig,
  verifyParentPayment,
} from "../../services/parentFeeService";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

function ParentRazorpayCheckout({
  feePaymentId,
  amount,
  studentName = "Student",
  description = "JuniorChamps PlaySchool Fee Payment",
  onSuccess,
  onError,
}) {
  const {
    data: configData,
    isLoading: configLoading,
    isError: configError,
  } = useQuery({
    queryKey: ["parent-payment-config"],
    queryFn: getParentPaymentConfig,
    staleTime: 5 * 60 * 1000,
  });

  const orderMutation = useMutation({
    mutationFn: () => createParentPaymentOrder(feePaymentId),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyParentPayment,
  });

  const isProcessing =
    orderMutation.isPending || verifyMutation.isPending;

  const handlePayment = async () => {
    if (!feePaymentId) {
      onError?.("Fee payment ID is required.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      onError?.("Payment amount must be greater than zero.");
      return;
    }

    if (!configData?.keyId) {
      onError?.("Razorpay payment configuration is unavailable.");
      return;
    }

    if (!window.Razorpay) {
      onError?.(
        "Razorpay Checkout could not be loaded. Please refresh the page."
      );
      return;
    }

    try {
      const orderResponse = await orderMutation.mutateAsync();
      const order = orderResponse?.order;

      if (!order?.id) {
        throw new Error("Unable to create Razorpay order.");
      }

      const options = {
        key: configData.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "JuniorChamps PlaySchool",
        description,
        order_id: order.id,
        prefill: {
          name: studentName,
        },
        theme: {
          color: "#4f46e5",
        },

        handler: async (response) => {
          try {
            const verification = await verifyMutation.mutateAsync({
              feeId: feePaymentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verification?.success) {
              throw new Error(
                verification?.message || "Payment verification failed."
              );
            }

            onSuccess?.({
              feePaymentId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              payment: verification.payment,
            });
          } catch (error) {
            onError?.(
              error?.response?.data?.message ||
                error?.message ||
                "Payment verification failed."
            );
          }
        },

        modal: {
          ondismiss: () => {
            if (!verifyMutation.isPending) {
              onError?.("Payment was cancelled.");
            }
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        onError?.(
          response?.error?.description ||
            "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (error) {
      onError?.(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start payment."
      );
    }
  };

  if (configLoading) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white opacity-60"
      >
        <FiLoader className="h-4 w-4 animate-spin" />
        Loading payment...
      </button>
    );
  }

  if (configError || !configData?.keyId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Razorpay payment is currently unavailable.
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={isProcessing || !feePaymentId}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isProcessing ? (
        <FiLoader className="h-4 w-4 animate-spin" />
      ) : (
        <FiCreditCard className="h-4 w-4" />
      )}

      {isProcessing
        ? "Processing..."
        : `Pay ${formatCurrency(amount)}`}
    </button>
  );
}

export default ParentRazorpayCheckout;
