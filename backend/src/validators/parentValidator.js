const { body, query } = require("express-validator");

const parentFields = [
  body("fatherName")
    .isString()
    .withMessage("Father name must be a string")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Father name must be between 2 and 100 characters"),

  body("motherName")
    .isString()
    .withMessage("Mother name must be a string")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Mother name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("mobile")
    .isString()
    .withMessage("Mobile number must be a string")
    .matches(/^\d{10}$/)
    .withMessage("Invalid 10-digit mobile number"),

  body("address")
    .isString()
    .withMessage("Address must be a string")
    .trim()
    .isLength({ min: 2, max: 300 })
    .withMessage("Address must be between 2 and 300 characters"),

  body("student")
    .isMongoId()
    .withMessage("Invalid student ID"),
];

exports.createParentValidation = [
  ...parentFields,
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
];

exports.updateParentValidation = [
  ...parentFields,
  body("password")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
];

exports.parentListValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search must not exceed 100 characters"),
];
