const FeePayment = require("../models/FeePayment");

exports.generateFee = async (req, res) => {
  try {
    const receipt = "JCPS-" + Date.now();

    const payment = await FeePayment.create({
      ...req.body,

      receiptNumber: receipt,
    });

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

exports.getPayments = async (req, res) => {
  const payments = await FeePayment.find()

    .populate("student")

    .sort({ createdAt: -1 });

  res.json({
    success: true,

    payments,
  });
};

exports.markPaid = async (req, res) => {
  const payment = await FeePayment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({
      success: false,

      message: "Payment not found",
    });
  }

  payment.status = "Paid";

  await payment.save();

  res.json({
    success: true,

    message: "Fee marked as paid",

    payment,
  });
};

exports.feeStats = async (req, res) => {
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
};

module.exports = {
  generateFee: exports.generateFee,

  getPayments: exports.getPayments,

  markPaid: exports.markPaid,
  feeStats: exports.feeStats,
};
