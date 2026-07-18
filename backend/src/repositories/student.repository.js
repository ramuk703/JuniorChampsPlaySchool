const Student = require("../models/Student");

exports.findAll = async ({ page = 1, limit = 10 }) => {
  return Student.find()
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
};
