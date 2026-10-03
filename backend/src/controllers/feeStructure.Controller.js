const FeeStructure = require("../models/FeeStructure");

// Create fee structure
exports.createFeeStructure = async (req, res) => {
  try {
    const {
      className,
      admissionFee,
      monthlyFee,
      transportFee,
      annualFee,
      examFee,
    } = req.body;

    const existingStructure = await FeeStructure.findOne({
      className: className.trim(),
    });

    if (existingStructure) {
      return res.status(409).json({
        success: false,
        message: "Fee structure already exists for this class",
      });
    }

    const feeStructure = await FeeStructure.create({
      className: className.trim(),
      admissionFee,
      monthlyFee,
      transportFee,
      annualFee,
      examFee,
    });

    return res.status(201).json({
      success: true,
      message: "Fee structure created successfully",
      feeStructure,
    });
  } catch (error) {
    console.error("Create fee structure error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create fee structure",
    });
  }
};

// Get all fee structures
exports.getFeeStructures = async (req, res) => {
  try {
    const feeStructures = await FeeStructure.find()
      .sort({ className: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: feeStructures.length,
      feeStructures,
    });
  } catch (error) {
    console.error("Get fee structures error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee structures",
    });
  }
};
