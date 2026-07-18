const Parent = require("../models/Parent");
const generateToken = require("../utils/generateToken");

exports.registerParent = async (req, res) => {
  const parent = await Parent.create(req.body);

  res.status(201).json({
    success: true,

    token: generateToken(parent._id, "parent"),

    parent,
  });
};

exports.loginParent = async (req, res) => {
  const { email, password } = req.body;

  const parent = await Parent.findOne({ email });

  if (!parent) {
    return res.status(404).json({
      success: false,

      message: "Parent not found",
    });
  }

  const match = await parent.matchPassword(password);

  if (!match) {
    return res.status(401).json({
      success: false,

      message: "Invalid password",
    });
  }

  res.json({
    success: true,

    token: generateToken(parent._id, "parent"),

    parent,
  });
};

const Student = require("../models/Student");

const Attendance = require("../models/Attendance");

const FeePayment = require("../models/FeePayment");

exports.dashboard = async (req, res) => {
  const parent = await Parent.findById(req.user._id);

  const student = await Student.findById(parent.student);

  const attendance = await Attendance.countDocuments({
    student: student._id,

    status: "Present",
  });

  const pendingFees = await FeePayment.countDocuments({
    student: student._id,

    status: "Pending",
  });

  res.json({
    success: true,

    student,

    attendance,

    pendingFees,
  });
};
