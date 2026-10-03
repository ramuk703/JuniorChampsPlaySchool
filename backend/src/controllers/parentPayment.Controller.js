const { razorpayKey } = require("../config/env");

exports.getParentPaymentConfig = (req, res) => {
  if (!razorpayKey) {
    return res.status(503).json({
      success: false,
      message: "Payment service is not configured.",
    });
  }

  return res.json({
    success: true,
    keyId: razorpayKey,
  });
};
