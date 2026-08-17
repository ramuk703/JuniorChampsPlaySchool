const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Student = require("../../models/Student");
const FeePayment = require("../../models/FeePayment");

exports.createOrder = async (req, res) => {
  const options = {
    amount: req.body.amount * 100,
    currency: "INR",
    receipt: "JCPS-" + Date.now(),
  };

  const order = await razorpay.orders.create(options);

  res.json({
    success: true,
    order,
  });
};

exports.verifyPayment = async (req, res) => {
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

  res.json({
    success: true,
    message: "Payment Verified",
  });
};

exports.generateMonthlyFees = async (req, res) => {
  const students = await Student.find();
  const dueDate = 10;
  const today = new Date().getDate();

  let lateFee = 0;
  if (today > dueDate) {
    lateFee = 100;
  }

  const baseAmount = 600;
  const totalAmount = baseAmount + lateFee; // यहाँ टोटल अमाउंट कैलकुलेट हो रहा है

  for (const student of students) {
    await FeePayment.create({
      student: student._id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      feeType: "Monthly",
      amount: baseAmount, // 600 की जगह वेरिएबल का नाम रखा
      totalAmount: totalAmount, // यहाँ अब totalAmount वेरिएबल का सही इस्तेमाल हो रहा है
      receiptNumber: "AUTO-" + Date.now() + student._id,
    });
  }

  res.json({
    success: true,
    message: "Monthly fees generated",
  });
};
