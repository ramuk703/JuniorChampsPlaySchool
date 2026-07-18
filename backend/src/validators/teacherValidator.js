const { body } = require("express-validator");

exports.teacherValidation = [
  body("employeeId").notEmpty(),

  body("firstName").notEmpty(),

  body("lastName").notEmpty(),

  body("email").isEmail(),

  body("mobile").isLength({
    min: 10,

    max: 10,
  }),
];
