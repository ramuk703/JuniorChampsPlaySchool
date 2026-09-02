const TeacherAttendance = require("../models/TeacherAttendance");

// Mark Teacher Attendance
exports.markTeacherAttendance = async (req, res) => {
  try {
    const { teacher, status, date } = req.body;

    if (!teacher || !status) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID and Status are required",
      });
    }

    const attendance = await TeacherAttendance.create({
      teacher,
      status,
      date: date || new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Teacher attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Teacher Attendance Records (Optimized Query)
exports.getTeacherAttendance = async (req, res) => {
  try {
    const records = await TeacherAttendance.find()
      .select("_id teacher date status remarks createdAt")
      .populate("teacher", "_id firstName lastName email")
      .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
