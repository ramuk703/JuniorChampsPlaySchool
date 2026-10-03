const { body } = require("express-validator");

const feeStructureValidation = [
  body("className")
    .trim()
    .notEmpty()
    .withMessage("Class name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Class name must be between 1 and 50 characters"),

  body("admissionFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Admission fee must be a non-negative number"),

  body("monthlyFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly fee must be a non-negative number"),

  body("transportFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Transport fee must be a non-negative number"),

  body("annualFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Annual fee must be a non-negative number"),

  body("examFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Exam fee must be a non-negative number"),
];

module.exports = {
  feeStructureValidation,
};
