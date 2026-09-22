const { body } = require("express-validator");

exports.teacherValidation = [
  body("employeeId")
    .trim()
    .notEmpty()
    .withMessage("Employee ID is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Employee ID must be between 2 and 50 characters"),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^\d{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),

  body("qualification")
    .trim()
    .notEmpty()
    .withMessage("Qualification is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Qualification must be between 2 and 100 characters"),

  body("experience")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 60 })
    .withMessage("Experience must be between 0 and 60 years"),

  body("classTeacher")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Class teacher value must not exceed 100 characters"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Address must be between 5 and 500 characters"),

  body("joiningDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Joining date must be a valid date"),

  body("salary")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Salary cannot be negative"),

  body("status")
    .optional({ checkFalsy: true })
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
];
