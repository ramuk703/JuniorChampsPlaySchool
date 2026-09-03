const mongoose = require("mongoose");
const TeacherAttendance = require("../models/TeacherAttendance");
const Teacher = require("../models/Teacher");

// Mark Teacher Attendance
exports.markTeacherAttendance = async (req, res) => {
  try {
    const { teacher, status, date } = req.body;

    // 1. Check if Teacher ID and Status exist
    if (!teacher || !status) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID and Status are required",
      });
    }

    // 2. Check if ObjectId format is valid
    if (!mongoose.isValidObjectId(teacher)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    // 3. Check if Teacher exists and is active (deletedAt: null)
    const targetTeacher = await Teacher.findOne({
      _id: teacher,
      deletedAt: null,
    }).select("_id");

    if (!targetTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or deleted",
      });
    }

    // 4. Create Teacher Attendance
    const attendance = await TeacherAttendance.create({
      teacher: targetTeacher._id,
      status,
      date: date || new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Teacher attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    // Handling Duplicate Entry (409 Conflict)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Teacher attendance for this teacher on this date has already been marked",
      });
    }

    return res.status(400).json({
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
      .populate({
        path: "teacher",
        select: "_id firstName lastName email",
        match: { deletedAt: null },
      })
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