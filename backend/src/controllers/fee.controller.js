const auditLog = require("../utils/auditLog");
const FeePayment = require("../models/FeePayment");

// 1. Generate Fee (Fee Create Event)
exports.generateFee = async (req, res) => {
  try {
    const receipt = "JCPS-" + Date.now();

    const payment = await FeePayment.create({
      ...req.body,
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
        amount: payment.totalAmount || payment.amount,
        receiptNumber: payment.receiptNumber,
      },
    });
    // ==========================================

    res.status(201).json({
      success: true,
      message: "Fee generated successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get Payments
exports.getPayments = async (req, res) => {
  try {
    const payments = await FeePayment.find()
      .populate("student")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
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
      action: "PAYMENT_STATUS_UPDATE", // 👈 स्टेटस अपडेट के लिए सही Action
      resource: "FeePayment",
      resourceId: payment._id,
      details: {
        studentId: payment.student,
        amount: payment.totalAmount || payment.amount,
        status: payment.status,
      },
    });
    // ==========================================

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
