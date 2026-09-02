const auditLog = require("../utils/auditLog");
const Student = require("../models/Student");

// 🟢 Centralized Invalidation Service Import
const cacheInvalidationService = require("../services/cacheInvalidation.service");

exports.createStudent = async (req, res, next) => {
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
        admissionNumber: student.admissionNo,
      },
    });

    // 🧹 CACHE INVALIDATION
    if (cacheInvalidationService && cacheInvalidationService.student) {
      await cacheInvalidationService.student(student._id);
    }

    res.status(201).json({
      success: true,
      message: "Student Created",
      student,
    });
  } catch (err) {
    next(err); // 👈 Critical: Ye Mongoose error ko central error middleware tak bhejega
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    // 🛡️ Safe Pagination Sanitization Rules
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    const students = await Student.find()
      .select(
        "_id admissionNo firstName lastName gender className section mobile status photo createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Student.countDocuments();

    res.json({
      success: true,
      page,
      limit,
      total,
      students,
    });
  } catch (err) {
    next(err);
  }
};

exports.searchStudent = async (req, res, next) => {
  try {
    // 🛡️ Search Input Sanitization & Empty Input Guardrail (Step 5.4.14.4)
    const rawInput = req.query.q || req.query.keyword || "";
    const keyword = String(rawInput).trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required",
      });
    }

    const students = await Student.find({
      $or: [
        { firstName: { $regex: keyword, $options: "i" } },
        { lastName: { $regex: keyword, $options: "i" } },
        { admissionNo: { $regex: keyword, $options: "i" } },
      ],
    })
      .select(
        "_id admissionNo firstName lastName gender className section mobile status"
      )
      .limit(20)
      .lean();

    res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
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

    if (cacheInvalidationService && cacheInvalidationService.student) {
      await cacheInvalidationService.student(student._id);
    }

    res.json(student);
  } catch (err) {
    next(err);
  }
};

exports.deleteStudent = async (req, res, next) => {
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

    if (cacheInvalidationService && cacheInvalidationService.student) {
      await cacheInvalidationService.student(studentId);
    }

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
