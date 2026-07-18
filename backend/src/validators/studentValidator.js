const { body } = require("express-validator");

exports.studentValidation = [
  body("admissionNo").notEmpty().withMessage("Admission number required"),

  body("firstName").notEmpty().withMessage("First name required"),

  body("lastName").notEmpty().withMessage("Last name required"),

  body("fatherName").notEmpty(),

  body("motherName").notEmpty(),

  body("mobile").isLength({ min: 10, max: 10 }).withMessage("Invalid Mobile"),

  body("className").notEmpty(),
];
