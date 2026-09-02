const auditLog = require("../utils/auditLog");
const Teacher = require("../models/Teacher");
const ApiResponse = require("../utils/ApiResponse");
const fs = require("fs-extra");
const ExcelJS = require("exceljs");

// 🟢 Centralized Invalidation Service Import
const cacheInvalidationService = require("../services/cacheInvalidation.service");
const asyncHandler = require("../middleware/async.Handler");

const TEACHER_SELECT_FIELDS =
  "_id employeeId firstName lastName gender email mobile qualification experience classTeacher joiningDate salary photo status createdAt";

exports.createTeacher = async (req, res) => {
  try {
    const teacherData = req.body;

    if (req.file) {
      teacherData.photo = req.file.path;
    }

    const teacher = await Teacher.create(teacherData);

    auditLog({
      req,
      action: "CREATE",
      resource: "Teacher",
      resourceId: teacher._id,
    });

    // 🧹 CACHE INVALIDATION: Clears both Teacher & Dashboard stats caches
    await cacheInvalidationService.teacher(teacher._id);

    ApiResponse.created(res, "Teacher created successfully", teacher);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 1. Basic List (Optimized Query)
exports.getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find({ deletedAt: null })
    .select(TEACHER_SELECT_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  ApiResponse.success(res, "Teachers fetched successfully", teachers);
});

// 2. Teacher By ID (Fixed to exclude soft-deleted records)
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Paginated List (Optimized Query with Safe Pagination & Protected Sorting - Step 5.4.14)
exports.getAllTeachers = async (req, res) => {
  try {
    // 🛡️ Safe Pagination Sanitization Rules
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    // 🔒 Sorting Whitelist & Protection Logic
    const allowedSortFields = [
      "createdAt",
      "firstName",
      "lastName",
      "employeeId",
      "joiningDate",
      "salary",
    ];
    const requestedSort = req.query.sort || "-createdAt";
    const sortField = requestedSort.replace(/^-/, "");

    if (!allowedSortFields.includes(sortField)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field",
      });
    }

    const sortDirection = requestedSort.startsWith("-") ? -1 : 1;
    const sort = {
      [sortField]: sortDirection,
    };

    const [teachers, totalRecords] = await Promise.all([
      Teacher.find({ deletedAt: null })
        .select(TEACHER_SELECT_FIELDS)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Teacher.countDocuments({ deletedAt: null }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      success: true,
      message: "Teachers fetched successfully",
      page,
      limit,
      totalRecords,
      totalPages,
      data: teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Update Teacher (Hardened against soft-deleted records)
exports.updateTeacher = async (req, res) => {
  try {
    // 🛡️ Filter lookup to only active teachers
    const existingTeacher = await Teacher.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      if (existingTeacher.photo) {
        await fs.remove(existingTeacher.photo);
      }
      updateData.photo = req.file.path;
    }

    // 🛡️ Hardened update query
    const teacher = await Teacher.findOneAndUpdate(
      {
        _id: req.params.id,
        deletedAt: null,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    auditLog({
      req,
      action: "UPDATE",
      resource: "Teacher",
      resourceId: teacher._id,
    });

    // 🧹 CACHE INVALIDATION: Clears both Teacher & Dashboard stats caches
    await cacheInvalidationService.teacher(teacher._id);

    res.json({
      success: true,
      message: "Teacher updated successfully",
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Delete Teacher (Soft Delete Implementation)
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      {
        _id: req.params.id,
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

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    auditLog({
      req,
      action: "DELETE",
      resource: "Teacher",
      resourceId: teacher._id,
    });

    // 🧹 CACHE INVALIDATION: Clears both Teacher & Dashboard stats caches
    await cacheInvalidationService.teacher(teacher._id);

    res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.restoreTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      {
        _id: req.params.id,
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

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Deleted teacher not found",
      });
    }

    auditLog({
      req,
      action: "RESTORE",
      resource: "Teacher",
      resourceId: teacher._id,
    });

    await cacheInvalidationService.teacher(teacher._id);

    res.json({
      success: true,
      message: "Teacher restored successfully",
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDeletedTeachers = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      100
    );
    const skip = (page - 1) * limit;

    const [teachers, total] = await Promise.all([
      Teacher.find({
        deletedAt: { $ne: null },
      })
        .select(
          "_id employeeId firstName lastName gender email mobile qualification experience classTeacher joiningDate salary status deletedAt createdAt"
        )
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Teacher.countDocuments({
        deletedAt: { $ne: null },
      }),
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.searchTeachers = asyncHandler(async (req, res) => {
  const { keyword, status, qualification } = req.query;

  const filter = {
    deletedAt: null,
  };

  if (keyword) {
    filter.$or = [
      { firstName: { $regex: keyword, $options: "i" } },
      { lastName: { $regex: keyword, $options: "i" } },
      { employeeId: { $regex: keyword, $options: "i" } },
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (qualification) {
    filter.qualification = qualification;
  }

  const teachers = await Teacher.find(filter)
    .select(TEACHER_SELECT_FIELDS)
    .limit(20)
    .lean();

  res.json({
    success: true,
    total: teachers.length,
    teachers,
  });
});

exports.exportTeachersToExcel = async (req, res) => {
  try {
    const teachers = await Teacher.find({ deletedAt: null }).sort("-createdAt");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Teachers");

    worksheet.columns = [
      { header: "ID", key: "_id", width: 30 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Created At", key: "createdAt", width: 25 },
    ];

    teachers.forEach((teacher) => {
      worksheet.addRow({
        _id: teacher._id.toString(),
        name: teacher.name,
        email: teacher.email,
        status: teacher.status || "N/A",
        createdAt: teacher.createdAt,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=teachers.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTeacher: exports.createTeacher,
  getTeachers: exports.getTeachers,
  getTeacherById: exports.getTeacherById,
  getAllTeachers: exports.getAllTeachers,
  updateTeacher: exports.updateTeacher,
  deleteTeacher: exports.deleteTeacher,
  restoreTeacher: exports.restoreTeacher,
  getDeletedTeachers: exports.getDeletedTeachers,
  searchTeachers: exports.searchTeachers,
  exportTeachersToExcel: exports.exportTeachersToExcel,
};