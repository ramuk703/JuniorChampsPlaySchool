const mongoose = require("mongoose");
const Parent = require("../models/Parent");
const auditLog = require("../utils/auditLog");
const generateToken = require("../utils/generateToken");

const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const FeePayment = require("../models/FeePayment");

// 🟢 Centralized Invalidation Service Import
const cacheInvalidationService = require("../services/cacheInvalidation.service");

// 1. Register Parent (Create Event)
exports.registerParent = async (req, res) => {
  try {
    const { student: studentId } = req.body;

    // 1. Check if ObjectId format is valid (Step 5.6.2-B)
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    // 2. Check if student exists and is active (Step 5.6.2-A)
    const student = await Student.findOne({
      _id: studentId,
      deletedAt: null,
    }).select("_id");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found or deleted",
      });
    }

    // 3. Create Parent
    const parent = await Parent.create({
      ...req.body,
      student: student._id,
    });

    // Audit Log
    auditLog({
      req,
      action: "CREATE",
      resource: "Parent",
      resourceId: parent._id,
    });

    // CACHE INVALIDATION
    await cacheInvalidationService.parent(parent._id);

    const safeParent = {
      _id: parent._id,
      fatherName: parent.fatherName,
      motherName: parent.motherName,
      email: parent.email,
      mobile: parent.mobile,
      address: parent.address,
      student: parent.student,
      createdAt: parent.createdAt,
      updatedAt: parent.updatedAt,
    };

    res.status(201).json({
      success: true,
      token: generateToken(parent._id, "parent"),
      parent: safeParent,
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
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const match = await parent.matchPassword(password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const safeParent = {
      _id: parent._id,
      fatherName: parent.fatherName,
      motherName: parent.motherName,
      email: parent.email,
      mobile: parent.mobile,
      address: parent.address,
      student: parent.student,
      createdAt: parent.createdAt,
      updatedAt: parent.updatedAt,
    };

    res.json({
      success: true,
      token: generateToken(parent._id, "parent"),
      parent: safeParent,
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

    // Defensive check if parent doesn't exist (Step 5.6.2-D)
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const student = await Student.findOne({
      _id: parent.student,
      deletedAt: null,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found or inactive",
      });
    }

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

// 4. Change Parent Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const parent = await Parent.findById(req.user._id);

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: "Parent account not found",
      });
    }

    const isMatch = await parent.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await parent.matchPassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    parent.password = newPassword;
    await parent.save();

    auditLog({
      req,
      action: "CHANGE_PASSWORD",
      resource: "Parent Authentication",
      resourceId: parent._id,
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};