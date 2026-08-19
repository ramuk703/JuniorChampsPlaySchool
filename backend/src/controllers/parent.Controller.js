const Parent = require("../models/Parent");
const auditLog = require("../utils/auditLog");
const generateToken = require("../utils/generateToken");

const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const FeePayment = require("../models/FeePayment");

// 🔴 Redis Imports for Cache Invalidation
const redisService = require("../services/redis.service");
const redisKeys = require("../constants/redisKeys");

// 1. Register Parent (Create Event)
exports.registerParent = async (req, res) => {
  try {
    const parent = await Parent.create(req.body);

    // ==========================================
    // 👇 Parent Create hone ke baad Audit Log
    // ==========================================
    auditLog({
      req,
      action: "CREATE",
      resource: "Parent",
      resourceId: parent._id,
    });
    // ==========================================

    // 🧹 CACHE INVALIDATION: Clear dashboard stats cache on new parent creation
    await redisService.delete(redisKeys.dashboardStats());

    res.status(201).json({
      success: true,
      token: generateToken(parent._id, "parent"),
      parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Login Parent
exports.loginParent = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Parent Dashboard
exports.dashboard = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
