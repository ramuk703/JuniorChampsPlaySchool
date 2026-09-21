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
    next(err); 
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    // 🛡️ Safe Pagination Sanitization Rules
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    const students = await Student.find({ deletedAt: null })
      .select(
        "_id admissionNo firstName lastName gender className section mobile status photo createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Student.countDocuments({ deletedAt: null });

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
    const rawInput = req.query.q || req.query.keyword || "";
    const keyword = String(rawInput).trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required",
      });
    }

    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchTerms = escapedKeyword.split(/\s+/).filter(Boolean);

    let searchQuery;

    if (searchTerms.length === 1) {
      // Single-word search:
      // first name OR last name OR admission number
      searchQuery = {
        deletedAt: null,
        $or: [
          {
            firstName: {
              $regex: searchTerms[0],
              $options: "i",
            },
          },
          {
            lastName: {
              $regex: searchTerms[0],
              $options: "i",
            },
          },
          {
            admissionNo: {
              $regex: searchTerms[0],
              $options: "i",
            },
          },
        ],
      };
    } else {
      // Multi-word search (e.g., "Rahul Kumar" or "Kumar Rahul")
      const firstTerm = searchTerms[0];
      const remainingTerms = searchTerms.slice(1);

      searchQuery = {
        deletedAt: null,
        $or: [
          {
            $and: [
              {
                firstName: {
                  $regex: firstTerm,
                  $options: "i",
                },
              },
              ...remainingTerms.map((term) => ({
                lastName: {
                  $regex: term,
                  $options: "i",
                },
              })),
            ],
          },
          {
            $and: [
              {
                lastName: {
                  $regex: firstTerm,
                  $options: "i",
                },
              },
              ...remainingTerms.map((term) => ({
                firstName: {
                  $regex: term,
                  $options: "i",
                },
              })),
            ],
          },
          {
            admissionNo: {
              $regex: escapedKeyword,
              $options: "i",
            },
          },
        ],
      };
    }

    // 🔍 Temporary Debug Logs

    const students = await Student.find(searchQuery)
      .select(
        "_id admissionNo firstName lastName gender className section mobile status"
      )
      .limit(20)
      .lean();

    return res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findOneAndUpdate(
      {
        _id: req.params.id,
        deletedAt: null,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

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

    const student = await Student.findOneAndUpdate(
      {
        _id: studentId,
        deletedAt: null,
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

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

exports.restoreStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findOneAndUpdate(
      {
        _id: studentId,
        deletedAt: { $ne: null },
      },
      {
        $set: {
          deletedAt: null,
        },
      },
      {
        new: true,
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Deleted student not found",
      });
    }

    auditLog({
      req,
      action: "RESTORE",
      resource: "Student",
      resourceId: studentId,
    });

    if (cacheInvalidationService && cacheInvalidationService.student) {
      await cacheInvalidationService.student(studentId);
    }

    res.json({
      success: true,
      message: "Student restored successfully",
      student,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDeletedStudents = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      100
    );
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find({
        deletedAt: { $ne: null },
      })
        .select(
          "_id admissionNo firstName lastName gender className section mobile status deletedAt createdAt"
        )
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Student.countDocuments({
        deletedAt: { $ne: null },
      }),
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      students,
    });
  } catch (err) {
    next(err);
  }
};