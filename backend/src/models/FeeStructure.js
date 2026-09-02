const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },

    admissionFee: {
      type: Number,
      min: 0,
      default: 1000,
    },

    monthlyFee: {
      type: Number,
      min: 0,
      default: 600,
    },

    transportFee: {
      type: Number,
      min: 0,
      default: 400,
    },

    annualFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    examFee: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
