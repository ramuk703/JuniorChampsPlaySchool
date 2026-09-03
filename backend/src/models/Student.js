const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    dob: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Date of birth must be in the past.",
      },
    },

    className: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    section: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: "A",
    },

    fatherName: {
      type: String,
      required: true,
    },

    motherName: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Please fill a valid 10-digit mobile number"],
    },

    email: {
      type: String,
      lowercase: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please fill a valid email address",
      ],
    },

    address: {
      type: String,
      required: true,
    },

    bloodGroup: String,

    transport: {
      type: Boolean,
      default: false,
    },

    photo: String,

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
studentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Student", studentSchema);