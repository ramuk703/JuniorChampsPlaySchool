const { body } = require("express-validator");

const passwordRules = () =>
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters");

exports.registerUserValidation = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  passwordRules(),
];

exports.loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 1, max: 128 })
    .withMessage("Invalid password"),
];

exports.registerParentValidation = [
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

  passwordRules(),

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

exports.loginParentValidation = exports.loginValidation;
