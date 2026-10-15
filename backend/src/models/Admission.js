const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    childName: {
      type: String,
      required: [true, "Child name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator(value) {
          return value instanceof Date && !Number.isNaN(value.getTime()) && value <= new Date();
        },
        message: "Date of birth must be a valid date in the past",
      },
    },
    requestedClass: {
      type: String,
      required: [true, "Requested class is required"],
      trim: true,
      maxlength: 80,
    },
    guardianName: {
      type: String,
      required: [true, "Parent/guardian name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    relationship: {
      type: String,
      enum: ["Father", "Mother", "Guardian", "Other"],
      required: [true, "Relationship is required"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: "",
    },
    address: { type: String, trim: true, maxlength: 500, default: "" },
    message: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["New", "Contacted", "Visit Scheduled", "Admitted", "Closed"],
      default: "New",
      index: true,
    },
    adminNotes: { type: String, trim: true, maxlength: 3000, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

admissionSchema.index({ status: 1, createdAt: -1 });
admissionSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.Admission || mongoose.model("Admission", admissionSchema);
