const auditLog = require("../utils/auditLog");
const FeePayment = require("../models/FeePayment");
const AppError = require("../utils/AppError");

// 🟢 Centralized Invalidation Service Import
const cacheInvalidationService = require("../services/cacheInvalidation.service");

// 1. Generate Fee (Fee Create Event)
exports.generateFee = async (req, res) => {
  try {
    const { amount, discount = 0, lateFee = 0 } = req.body;

    // 🔒 Strict Financial Input Validation
    const numericAmount = Number(amount);
    const numericDiscount = Number(discount);
    const numericLateFee = Number(lateFee);

    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      throw new AppError("Amount must be a valid non-negative number", 400);
    }

    if (!Number.isFinite(numericDiscount) || numericDiscount < 0) {
      throw new AppError("Discount must be a valid non-negative number", 400);
    }

    if (!Number.isFinite(numericLateFee) || numericLateFee < 0) {
      throw new AppError("Late fee must be a valid non-negative number", 400);
    }

    // 🔒 Server-Side Calculation (Never trust client total)
    const calculatedTotal = numericAmount - numericDiscount + numericLateFee;

    if (calculatedTotal < 0) {
      throw new AppError("Total amount cannot be negative", 400);
    }

    const receipt = "JCPS-" + Date.now();

    const payment = await FeePayment.create({
      ...req.body,
      amount: numericAmount,
      discount: numericDiscount,
      lateFee: numericLateFee,
      totalAmount: calculatedTotal,
      receiptNumber: receipt,
    });

    // ==========================================
    // 👇 Fee Generate होने पर Audit Log
    // ==========================================
    auditLog({
      req,
      action: "CREATE",
      resource: "FeePayment",
      resourceId: payment._id,
      details: {
        studentId: payment.student,
        amount: payment.totalAmount,
        receiptNumber: payment.receiptNumber,
      },
    });
    // ==========================================

    // 🧹 CACHE INVALIDATION: Clears Fee & Dashboard stats caches
    await cacheInvalidationService.fee(payment._id);

    res.status(201).json({
      success: true,
      message: "Fee generated successfully",
      payment,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get Payments (Optimized Parallel Query & Pagination - Step 5.4.14.5)
exports.getPayments = async (req, res) => {
  try {
    // 🛡️ Safe Pagination Rules
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    // ⚡ Parallel Execution for Data + Count
    const [payments, total] = await Promise.all([
      FeePayment.find()
        .select(
          "_id student month year feeType amount discount lateFee totalAmount status receiptNumber paymentMethod paymentDate createdAt"
        )
        .populate(
          "student",
          "_id admissionNo firstName lastName className section"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      FeePayment.countDocuments(),
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Mark Paid (Payment Status Update Event)
exports.markPaid = async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    payment.status = "Paid";
    await payment.save();

    // ==========================================
    // 👇 Status Update होने पर Audit Log
    // ==========================================
    auditLog({
      req,
      action: "PAYMENT_STATUS_UPDATE",
      resource: "FeePayment",
      resourceId: payment._id,
      details: {
        studentId: payment.student,
        amount: payment.totalAmount || payment.amount,
        status: payment.status,
      },
    });
    // ==========================================

    // 🧹 CACHE INVALIDATION: Clears Fee & Dashboard stats caches
    await cacheInvalidationService.fee(payment._id);

    res.json({
      success: true,
      message: "Fee marked as paid",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Fee Stats
exports.feeStats = async (req, res) => {
  try {
    const totalPaid = await FeePayment.aggregate([
      {
        $match: {
          status: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const pending = await FeePayment.countDocuments({
      status: "Pending",
    });

    res.json({
      success: true,
      totalCollection: totalPaid[0]?.amount || 0,
      pendingPayments: pending,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateFee: exports.generateFee,
  getPayments: exports.getPayments,
  markPaid: exports.markPaid,
  feeStats: exports.feeStats,
};
