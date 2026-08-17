const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const asyncHandler = require("express-async-handler");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const totalTeachers = await Teacher.countDocuments();

  const totalStudents = await Student.countDocuments();

  const activeTeachers = await Teacher.countDocuments({
    status: "Active",
  });

  res.json({
    success: true,

    totalTeachers,

    activeTeachers,

    totalStudents,
  });
});
