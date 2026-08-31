const auditLog = require("../utils/auditLog");
const Student = require("../models/Student");

// 🟢 NEW: Centralized Invalidation Service Import
const cacheInvalidationService = require("../services/cacheInvalidation.service");

exports.createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    if (req.file) {
      studentData.studentPhoto = req.file.path;
    }

    const student = await Student.create(studentData);

    auditLog({
      req,
      action: "CREATE",
      resource: "Student",
      resourceId: student._id,
      details: {
        admissionNumber: student.admissionNumber,
      },
    });

    // 🧹 CACHE INVALIDATION: Clears both Student & Dashboard stats caches
    await cacheInvalidationService.student(student._id);

    res.status(201).json({
      success: true,
      message: "Student Created",
      student,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const students = await Student.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments();

    res.json({
      success: true,
      page,
      total,
      students,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.searchStudent = async (req, res) => {
  try {
    const keyword = req.query.q;

    const students = await Student.find({
      $or: [
        { firstName: { $regex: keyword, $options: "i" } },
        { lastName: { $regex: keyword, $options: "i" } },
        { admissionNo: { $regex: keyword, $options: "i" } },
      ],
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    auditLog({
      req,
      action: "UPDATE",
      resource: "Student",
      resourceId: student._id,
    });

    // 🧹 CACHE INVALIDATION: Clears both Student & Dashboard stats caches
    await cacheInvalidationService.student(student._id);

    res.json(student);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findByIdAndDelete(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    auditLog({
      req,
      action: "DELETE",
      resource: "Student",
      resourceId: studentId,
    });

    // 🧹 CACHE INVALIDATION: Clears both Student & Dashboard stats caches
    await cacheInvalidationService.student(studentId);

    res.json({
      success: true,
      message: "Student Deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
