const mongoose = require("mongoose");
const razorpay = require("../config/razorpay");
const { razorpaySecret, razorpayKey } = require("../config/env");
const crypto = require("crypto");
const Parent = require("../models/Parent");
const auditLog = require("../utils/auditLog");
const generateToken = require("../utils/generateToken");
const authProtection = require("../services/authProtection.service");
const emailService = require("../services/email.service");
const { passwordResetEmail } = require("../templates/email");

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


// Parent Password Reset Request
exports.forgotPassword = async (req, res) => {
  const genericResponse = {
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };

  try {
    const normalizedEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const parent = await Parent.findOne({
      email: normalizedEmail,
      deletedAt: null,
    });

    // Do not reveal whether the email exists.
    if (!parent) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    parent.resetPasswordToken = hashedToken;
    parent.resetPasswordExpires =
      new Date(Date.now() + 15 * 60 * 1000);

    await parent.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/parent/reset-password?token=${encodeURIComponent(rawToken)}`;

    const email = passwordResetEmail({
      name: parent.fatherName,
      resetUrl,
      expiresIn: "15 minutes",
    });

    try {
      await emailService.sendEmail({
        to: parent.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
    } catch (emailError) {
      parent.resetPasswordToken = null;
      parent.resetPasswordExpires = null;
      await parent.save();

      auditLog({
        req,
        action: "PASSWORD_RESET_EMAIL_FAILED",
        resource: "Parent",
        resourceId: parent._id,
      });

      return res.json(genericResponse);
    }

    auditLog({
      req,
      action: "PASSWORD_RESET_REQUEST",
      resource: "Parent",
      resourceId: parent._id,
    });

    return res.json(genericResponse);
  } catch (error) {
    return res.json(genericResponse);
  }
};


// Parent Password Reset
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    const parent = await Parent.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
      deletedAt: null,
    });

    if (!parent) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    parent.password = newPassword;

    parent.resetPasswordToken = null;
    parent.resetPasswordExpires = null;

    // Invalidate all existing sessions.
    parent.tokenVersion += 1;

    await parent.save();

    auditLog({
      req,
      action: "PASSWORD_RESET",
      resource: "Parent",
      resourceId: parent._id,
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
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
    const parent = await Parent.findOne({
      _id: req.user._id,
      deletedAt: null,
    })
      .select("_id fatherName motherName email mobile address student")
      .lean();

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const student = await Student.findOne({
      _id: parent.student,
      deletedAt: null,
    })
      .select(
        "_id admissionNo firstName lastName gender dob className section photo status"
      )
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found or inactive",
      });
    }

    const [attendanceSummary, feeSummary, recentPayments] =
      await Promise.all([
        Attendance.aggregate([
          {
            $match: {
              student: student._id,
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),

        FeePayment.aggregate([
          {
            $match: {
              student: student._id,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              paid: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Paid"] }, 1, 0],
                },
              },
              pending: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
                },
              },
              totalAmount: { $sum: "$totalAmount" },
              paidAmount: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "Paid"] },
                    "$totalAmount",
                    0,
                  ],
                },
              },
              pendingAmount: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "Pending"] },
                    "$totalAmount",
                    0,
                  ],
                },
              },
            },
          },
        ]),

        FeePayment.find({
          student: student._id,
          status: "Paid",
        })
          .select(
            "_id month year feeType totalAmount paymentMethod receiptNumber paymentDate razorpayPaymentId"
          )
          .sort({ paymentDate: -1, createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    const attendance = {
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      percentage: 0,
    };

    for (const item of attendanceSummary) {
      attendance.total += item.count;

      if (item._id === "Present") {
        attendance.present = item.count;
      } else if (item._id === "Absent") {
        attendance.absent = item.count;
      } else if (item._id === "Leave") {
        attendance.leave = item.count;
      }
    }

    if (attendance.total > 0) {
      attendance.percentage = Number(
        ((attendance.present / attendance.total) * 100).toFixed(2)
      );
    }

    const fees = {
      total: 0,
      paid: 0,
      pending: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };

    if (feeSummary[0]) {
      fees.total = feeSummary[0].total;
      fees.paid = feeSummary[0].paid;
      fees.pending = feeSummary[0].pending;
      fees.totalAmount = feeSummary[0].totalAmount;
      fees.paidAmount = feeSummary[0].paidAmount;
      fees.pendingAmount = feeSummary[0].pendingAmount;
    }

    fees.recentPayments = recentPayments;

    return res.json({
      success: true,
      parent: {
        _id: parent._id,
        fatherName: parent.fatherName,
        motherName: parent.motherName,
        email: parent.email,
        mobile: parent.mobile,
        address: parent.address,
      },
      student,
      attendance,
      fees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * ============================================================
 * PARENT FEES & PAYMENTS
 * ============================================================
 */

/**
 * Get all fee payments belonging only to the logged-in parent's child.
 */
exports.getParentFees = async (req, res) => {
  try {
    const parent = await Parent.findOne({
      _id: req.user._id,
      deletedAt: null,
    })
      .select("_id student")
      .lean();

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found",
      });
    }

    if (!parent.student) {
      return res.status(404).json({
        success: false,
        message: "No student is linked to this parent account",
      });
    }

    const fees = await FeePayment.find({
      student: parent.student,
    })
      .select(
        "_id student month year feeType amount discount lateFee totalAmount paymentMethod status receiptNumber paymentDate razorpayOrderId razorpayPaymentId remarks createdAt updatedAt"
      )
      .sort({ year: -1, month: -1, createdAt: -1 })
      .lean();

    const summary = {
      total: fees.length,
      paid: 0,
      pending: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };

    for (const fee of fees) {
      const amount = Number(fee.totalAmount) || 0;

      summary.totalAmount += amount;

      if (fee.status === "Paid") {
        summary.paid += 1;
        summary.paidAmount += amount;
      } else if (fee.status === "Pending") {
        summary.pending += 1;
        summary.pendingAmount += amount;
      }
    }

    return res.json({
      success: true,
      fees,
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * Get one fee payment only when it belongs to the parent's child.
 */
exports.getParentFeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee payment ID",
      });
    }

    const parent = await Parent.findOne({
      _id: req.user._id,
      deletedAt: null,
    })
      .select("_id student")
      .lean();

    if (!parent || !parent.student) {
      return res.status(404).json({
        success: false,
        message: "Parent or linked student not found",
      });
    }

    const fee = await FeePayment.findOne({
      _id: id,
      student: parent.student,
    })
      .select(
        "_id student month year feeType amount discount lateFee totalAmount paymentMethod status receiptNumber paymentDate razorpayOrderId razorpayPaymentId remarks createdAt updatedAt"
      )
      .lean();

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee payment not found",
      });
    }

    return res.json({
      success: true,
      fee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * Create a Razorpay order for a fee belonging to the parent's child.
 */
exports.createParentPaymentOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured.",
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee payment ID",
      });
    }

    const parent = await Parent.findOne({
      _id: req.user._id,
      deletedAt: null,
    })
      .select("_id student")
      .lean();

    if (!parent || !parent.student) {
      return res.status(404).json({
        success: false,
        message: "Parent or linked student not found",
      });
    }

    const payment = await FeePayment.findOne({
      _id: id,
      student: parent.student,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Fee payment not found",
      });
    }

    if (payment.status === "Paid") {
      return res.status(409).json({
        success: false,
        message: "Fee payment is already marked as paid",
      });
    }

    const amount = Number(payment.totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee payment amount",
      });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `JCPS-${payment._id}`,
    };

    const order = await razorpay.orders.create(options);

    payment.razorpayOrderId = order.id;
    payment.paymentMethod = "Razorpay";

    await payment.save();

    return res.json({
      success: true,
      order,
      payment: {
        id: payment._id,
        amount: payment.totalAmount,
      },
      keyId: razorpayKey || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * Verify a parent Razorpay payment and mark only the linked child's
 * fee payment as Paid.
 */
exports.verifyParentPayment = async (req, res) => {
  try {
    if (!razorpaySecret) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured.",
      });
    }

    const { id } = req.params;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee payment ID",
      });
    }

    const parent = await Parent.findOne({
      _id: req.user._id,
      deletedAt: null,
    })
      .select("_id student")
      .lean();

    if (!parent || !parent.student) {
      return res.status(404).json({
        success: false,
        message: "Parent or linked student not found",
      });
    }

    const payment = await FeePayment.findOne({
      _id: id,
      student: parent.student,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Fee payment not found",
      });
    }

    if (payment.status === "Paid") {
      return res.status(409).json({
        success: false,
        message: "Fee payment is already marked as paid",
      });
    }

    if (
      !payment.razorpayOrderId ||
      payment.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match this fee payment",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment",
      });
    }

    payment.status = "Paid";
    payment.paymentMethod = "Razorpay";
    payment.razorpayOrderId = razorpay_order_id;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentDate = new Date();

    await payment.save();

    return res.json({
      success: true,
      message: "Payment Verified",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
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