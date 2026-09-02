const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },

    feeType: {
      type: String,
      enum: ["Admission", "Monthly", "Transport", "Annual", "Exam"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    lateFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Razorpay"],
      default: "Cash",
    },

    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    receiptNumber: {
      type: String,
      trim: true,
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpaySignature: {
      type: String,
    },

    paymentDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Payment date cannot be in the future.",
      },
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

feePaymentSchema.index(
  { receiptNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      receiptNumber: { $type: "string" },
    },
  }
);

// Compound Unique Index: Prevents duplicate Monthly fee generation for the same student, month, and year
feePaymentSchema.index(
  {
    student: 1,
    month: 1,
    year: 1,
    feeType: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      feeType: "Monthly",
    },
  }
);

feePaymentSchema.index({ createdAt: -1 });
feePaymentSchema.index({ status: 1 });

module.exports = mongoose.model("FeePayment", feePaymentSchema);
