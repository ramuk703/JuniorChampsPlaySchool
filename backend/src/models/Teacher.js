const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    employeeId: {
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

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please fill a valid email address",
      ],
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Please fill a valid 10-digit mobile number"],
    },

    qualification: {
      type: String,
      required: true,
    },

    experience: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },

    classTeacher: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      required: true,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    salary: {
      type: Number,
      min: 0,
      default: 0,
    },

    photo: {
      type: String,
      default: "",
    },

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
teacherSchema.index({ createdAt: -1 });
module.exports = mongoose.model("Teacher", teacherSchema);
