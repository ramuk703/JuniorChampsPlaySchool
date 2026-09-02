const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    className: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Leave"],
      default: "Present",
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index(
  {
    student: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
