const razorpay = require("../config/razorpay");
const { razorpaySecret } = require("../config/env");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const FeePayment = require("../models/FeePayment");
const withTransaction = require("../utils/withTransaction");

exports.createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured.",
      });
    }

    const { feePaymentId } = req.body;

    if (!mongoose.isValidObjectId(feePaymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee payment ID",
      });
    }

    const payment = await FeePayment.findById(feePaymentId);

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
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    if (!razorpaySecret) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured.",
      });
    }

    const {
      feePaymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!mongoose.isValidObjectId(feePaymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee payment ID",
      });
    }

    const payment = await FeePayment.findById(feePaymentId);

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
      payment.razorpayOrderId &&
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

    const student = await Student.findOne({
      _id: payment.student,
      deletedAt: null,
    }).select("_id firstName lastName email");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Associated student not found or deleted",
      });
    }

    payment.status = "Paid";
    payment.paymentMethod = "Razorpay";
    payment.razorpayOrderId = razorpay_order_id;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentDate = new Date();

    if (req.user?._id) {
      payment.paidBy = req.user._id;
    }

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

exports.generateMonthlyFees = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const dueDate = 10;
    const lateFee = currentDate.getDate() > dueDate ? 100 : 0;

    const baseAmount = 600;
    const totalAmount = baseAmount + lateFee;

    const result = await withTransaction(async (session) => {
      const students = await Student.find({
        status: "Active",
        deletedAt: null,
      })
        .select("_id")
        .session(session)
        .lean();

      if (students.length === 0) {
        return {
          generated: 0,
          skipped: 0,
        };
      }

      const studentIds = students.map((student) => student._id);

      const existingFees = await FeePayment.find({
        student: { $in: studentIds },
        month,
        year,
        feeType: "Monthly",
      })
        .select("student")
        .session(session)
        .lean();

      const existingStudentIds = new Set(
        existingFees.map((fee) => fee.student.toString())
      );

      const studentsToBill = students.filter(
        (student) => !existingStudentIds.has(student._id.toString())
      );

      if (studentsToBill.length === 0) {
        return {
          generated: 0,
          skipped: students.length,
        };
      }

      const feeDocuments = studentsToBill.map((student) => ({
        student: student._id,
        month,
        year,
        feeType: "Monthly",
        amount: baseAmount,
        discount: 0,
        lateFee,
        totalAmount,
        status: "Pending",
        receiptNumber: `AUTO-${year}-${month}-${student._id}`,
      }));

      const createdFees = await FeePayment.insertMany(feeDocuments, {
        session,
        ordered: true,
      });

      return {
        generated: createdFees.length,
        skipped: existingFees.length,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Monthly fee generation completed",
      month,
      year,
      generated: result.generated,
      skipped: result.skipped,
    });
  } catch (error) {
    next(error);
  }
};
