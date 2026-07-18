const mongoose = require("mongoose");
const Attendance = require("./Attendance"); // Attendance मॉडल को यहाँ इम्पोर्ट किया ताकि नीचे एरर न आए

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
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
  },
  {
    timestamps: true,
  }
);

teacherAttendanceSchema.index(
  {
    teacher: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

// attendancePercentage फंक्शन को स्कीमा के static मेथड में जोड़ दिया ताकि यह सही से एक्सपोर्ट हो सके
teacherAttendanceSchema.statics.attendancePercentage = async (req, res) => {
  const studentId = req.params.id;

  const total = await Attendance.countDocuments({
    student: studentId,
  });

  const present = await Attendance.countDocuments({
    student: studentId,
    status: "Present",
  });

  const percentage = total === 0 ? 0 : ((present / total) * 100).toFixed(2);

  return res.json({
    success: true,
    total,
    present,
    percentage,
  });
};

module.exports = mongoose.model("TeacherAttendance", teacherAttendanceSchema);
