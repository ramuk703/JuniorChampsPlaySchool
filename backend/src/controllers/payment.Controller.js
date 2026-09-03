const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Student = require("../models/Student");
const FeePayment = require("../models/FeePayment");
const withTransaction = require("../utils/withTransaction");

exports.createOrder = async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "JCPS-" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      order,
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment",
      });
    }

    return res.json({
      success: true,
      message: "Payment Verified",
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
      // 1. Only active non-deleted students are eligible for monthly fees
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

      // 2. Find students who already have this month's fee
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

      // 3. Only create fees for students who don't already have one
      const studentsToBill = students.filter(
        (student) => !existingStudentIds.has(student._id.toString())
      );

      if (studentsToBill.length === 0) {
        return {
          generated: 0,
          skipped: students.length,
        };
      }

      // 4. Prepare new fee documents
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

      // 5. Insert all new fees atomically
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
