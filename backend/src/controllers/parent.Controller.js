const mongoose = require("mongoose");
const Parent = require("../models/Parent");
const auditLog = require("../utils/auditLog");
const generateToken = require("../utils/generateToken");
const authProtection = require("../services/authProtection.service");

const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const FeePayment = require("../models/FeePayment");

// 🟢 Centralized Invalidation Service Import
const cacheInvalidationService = require("../services/cacheInvalidation.service");

// Helper function for multi-word safe regex search
const buildMultiFieldSearch = (search = "", fields = []) => {
  const terms = search
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (!terms.length) {
    return {};
  }

  return {
    $and: terms.map((term) => ({
      $or: fields.map((field) => ({
        [field]: {
          $regex: term,
          $options: "i",
        },
      })),
    })),
  };
};

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
      token: generateToken(parent._id, "parent", parent.tokenVersion),
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

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const sourceIp = req.ip || req.socket?.remoteAddress || "unknown";

    // Check protection status using email + IP combination
    const protectionStatus = await authProtection.getProtectionStatus(
      "parent",
      normalizedEmail,
      sourceIp
    );

    if (protectionStatus.blocked) {
      if (protectionStatus.retryAfter > 0) {
        res.set(
          "Retry-After",
          String(protectionStatus.retryAfter)
        );
      }

      return res.status(429).json({
        success: false,
        message:
          "Too many failed login attempts. Please try again later.",
      });
    }

    const parent = await Parent.findOne({ email: normalizedEmail });

    if (!parent) {
      await authProtection.recordFailure(
        "parent",
        normalizedEmail,
        sourceIp
      );

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const match = await parent.matchPassword(password);

    if (!match) {
      await authProtection.recordFailure(
        "parent",
        normalizedEmail,
        sourceIp
      );

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Clear failures on successful login
    await authProtection.clearFailures(
      "parent",
      normalizedEmail,
      sourceIp
    );

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
      token: generateToken(parent._id, "parent", parent.tokenVersion),
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
    parent.tokenVersion += 1; // Invalidate all previous parent sessions
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

// 5. Logout Parent (Invalidate all active sessions)
exports.logoutParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user._id);

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: "Parent account not found",
      });
    }

    parent.tokenVersion += 1;
    await parent.save();

    auditLog({
      req,
      action: "LOGOUT",
      resource: "Parent Authentication",
      resourceId: parent._id,
    });

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ============================================================
 * ADMIN PARENT MANAGEMENT
 * ============================================================
 */

const PARENT_SELECT_FIELDS =
  "_id fatherName motherName email mobile address student createdAt updatedAt";

const ADMIN_PARENT_SELECT_FIELDS =
  "_id fatherName motherName email mobile address student createdAt updatedAt deletedAt";

/**
 * Get all active parents with pagination/search.
 */
exports.getAllParents = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const searchKeyword = String(req.query.search || req.query.q || "").trim();
    const searchFilter = buildMultiFieldSearch(searchKeyword, [
      "fatherName",
      "motherName",
      "email",
      "mobile",
    ]);

    const filter = {
      deletedAt: null,
      ...searchFilter,
    };

    const [parents, totalRecords] = await Promise.all([
      Parent.find(filter)
        .select(PARENT_SELECT_FIELDS)
        .populate(
          "student",
          "_id admissionNo firstName lastName className section"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Parent.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      message: "Parents fetched successfully",
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit) || 1,
      data: parents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get single active parent.
 */
exports.getParentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent ID",
      });
    }

    const parent = await Parent.findOne({
      _id: req.params.id,
      deletedAt: null,
    })
      .select(PARENT_SELECT_FIELDS)
      .populate(
        "student",
        "_id admissionNo firstName lastName className section"
      )
      .lean();

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    return res.json({
      success: true,
      parent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create parent from Admin Portal.
 */
exports.createParent = async (req, res) => {
  try {
    const { student: studentId } = req.body;

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

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

    const existingParent = await Parent.findOne({
      email: String(req.body.email).trim().toLowerCase(),
    });

    if (existingParent) {
      return res.status(409).json({
        success: false,
        message: "A parent with this email already exists",
      });
    }

    const parent = await Parent.create({
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
      email: req.body.email,
      mobile: req.body.mobile,
      password: req.body.password,
      address: req.body.address,
      student: student._id,
    });

    auditLog({
      req,
      action: "CREATE",
      resource: "Parent",
      resourceId: parent._id,
    });

    await cacheInvalidationService.parent(parent._id);

    const safeParent = await Parent.findById(parent._id)
      .select(PARENT_SELECT_FIELDS)
      .populate(
        "student",
        "_id admissionNo firstName lastName className section"
      )
      .lean();

    return res.status(201).json({
      success: true,
      message: "Parent created successfully",
      parent: safeParent,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A parent with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update parent from Admin Portal.
 */
exports.updateParent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent ID",
      });
    }

    const existingParent = await Parent.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!existingParent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const student = await Student.findOne({
      _id: req.body.student,
      deletedAt: null,
    }).select("_id");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found or deleted",
      });
    }

    const duplicateEmail = await Parent.findOne({
      email: String(req.body.email).trim().toLowerCase(),
      _id: { $ne: req.params.id },
    }).select("_id");

    if (duplicateEmail) {
      return res.status(409).json({
        success: false,
        message: "A parent with this email already exists",
      });
    }

    const updateData = {
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
      email: req.body.email,
      mobile: req.body.mobile,
      address: req.body.address,
      student: student._id,
    };

    if (req.body.password) {
      updateData.password = req.body.password;
    }

    Object.assign(existingParent, updateData);

    const parent = await existingParent.save();

    auditLog({
      req,
      action: "UPDATE",
      resource: "Parent",
      resourceId: parent._id,
    });

    await cacheInvalidationService.parent(parent._id);

    const safeParent = await Parent.findById(parent._id)
      .select(PARENT_SELECT_FIELDS)
      .populate(
        "student",
        "_id admissionNo firstName lastName className section"
      )
      .lean();

    return res.json({
      success: true,
      message: "Parent updated successfully",
      parent: safeParent,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A parent with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Soft-delete parent.
 */
exports.deleteParent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent ID",
      });
    }

    const parent = await Parent.findOneAndUpdate(
      {
        _id: req.params.id,
        deletedAt: null,
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    auditLog({
      req,
      action: "DELETE",
      resource: "Parent",
      resourceId: parent._id,
    });

    await cacheInvalidationService.parent(parent._id);

    return res.json({
      success: true,
      message: "Parent deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get deleted parents with search support.
 */
exports.getDeletedParents = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const searchKeyword = String(req.query.search || req.query.q || "").trim();
    const searchFilter = buildMultiFieldSearch(searchKeyword, [
      "fatherName",
      "motherName",
      "email",
      "mobile",
    ]);

    const filter = {
      deletedAt: { $ne: null },
      ...searchFilter,
    };

    const [parents, total] = await Promise.all([
      Parent.find(filter)
        .select(ADMIN_PARENT_SELECT_FIELDS)
        .populate(
          "student",
          "_id admissionNo firstName lastName className section"
        )
        .sort({ deletedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Parent.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      parents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Restore deleted parent.
 */
exports.restoreParent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent ID",
      });
    }

    const parent = await Parent.findOneAndUpdate(
      {
        _id: req.params.id,
        deletedAt: { $ne: null },
      },
      {
        $set: {
          deletedAt: null,
        },
      },
      {
        new: true,
      }
    );

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Deleted parent not found",
      });
    }

    auditLog({
      req,
      action: "RESTORE",
      resource: "Parent",
      resourceId: parent._id,
    });

    await cacheInvalidationService.parent(parent._id);

    const safeParent = await Parent.findById(parent._id)
      .select(PARENT_SELECT_FIELDS)
      .populate(
        "student",
        "_id admissionNo firstName lastName className section"
      )
      .lean();

    return res.json({
      success: true,
      message: "Parent restored successfully",
      parent: safeParent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};