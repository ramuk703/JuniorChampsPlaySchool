const { body } = require("express-validator");

const createOrderValidation = [
  body("feePaymentId")
    .trim()
    .notEmpty()
    .withMessage("Fee payment ID is required")
    .isMongoId()
    .withMessage("Invalid fee payment ID"),
];

const verifyPaymentValidation = [
  body("feePaymentId")
    .trim()
    .notEmpty()
    .withMessage("Fee payment ID is required")
    .isMongoId()
    .withMessage("Invalid fee payment ID"),
  body("razorpay_order_id")
    .trim()
    .notEmpty()
    .withMessage("Razorpay order ID is required"),
  body("razorpay_payment_id")
    .trim()
    .notEmpty()
    .withMessage("Razorpay payment ID is required"),
  body("razorpay_signature")
    .trim()
    .notEmpty()
    .withMessage("Razorpay signature is required"),
];

module.exports = {
  createOrderValidation,
  verifyPaymentValidation,
};
