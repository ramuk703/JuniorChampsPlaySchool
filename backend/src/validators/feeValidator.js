const { body } = require("express-validator");

const {
  FEE_TYPE_VALUES,
  PAYMENT_METHOD_VALUES,
} = require("../constants/feeTypes");

const feeValidation = [
  body("student")
    .trim()
    .notEmpty()
    .withMessage("Student ID is required")
    .isMongoId()
    .withMessage("Student ID must be a valid MongoDB ID"),

  body("month")
    .notEmpty()
    .withMessage("Month is required")
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12"),

  body("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Year must be between 2000 and 2100"),

  body("feeType")
    .notEmpty()
    .withMessage("Fee type is required")
    .isIn(FEE_TYPE_VALUES)
    .withMessage(`Fee type must be one of: ${FEE_TYPE_VALUES.join(", ")}`),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a non-negative number"),

  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a non-negative number"),

  body("lateFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Late fee must be a non-negative number"),

  body("paymentMethod")
    .optional()
    .isIn(PAYMENT_METHOD_VALUES)
    .withMessage(
      `Payment method must be one of: ${PAYMENT_METHOD_VALUES.join(", ")}`,
    ),

  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
];

module.exports = {
  feeValidation,
};