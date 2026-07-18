const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
    },

    admissionFee: {
      type: Number,
      default: 1000,
    },

    monthlyFee: {
      type: Number,
      default: 600,
    },

    transportFee: {
      type: Number,
      default: 400,
    },

    annualFee: {
      type: Number,
      default: 0,
    },

    examFee: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
