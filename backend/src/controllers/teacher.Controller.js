const auditLog = require("../utils/auditLog");
const Teacher = require("../models/Teacher");
const ApiResponse = require("../utils/ApiResponse");
const fs = require("fs-extra");
const ExcelJS = require("exceljs");

// 🟢 NEW: Centralized Invalidation Service Import
const cacheInvalidationService = require("../services/cacheInvalidation.service");
const asyncHandler = require("../middleware/async.Handler");

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

exports.getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find();

  ApiResponse.success(res, "Teachers fetched successfully", teachers);
});

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

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

exports.getAllTeachers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "-createdAt";

    const totalRecords = await Teacher.countDocuments();
    const totalPages = Math.ceil(totalRecords / limit);

    const teachers = await Teacher.find().sort(sort).skip(skip).limit(limit);

    res.json({
      success: true,
      page,
      limit,
      totalRecords,
      totalPages,
      teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    let teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    if (req.file && teacher.photo) {
      await fs.remove(teacher.photo);
    }

    Object.assign(teacher, req.body);

    if (req.file) {
      teacher.photo = req.file.path;
    }

    await teacher.save();

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

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);

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

exports.searchTeachers = asyncHandler(async (req, res) => {
  const { keyword, status, qualification } = req.query;

  const filter = {};

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

  const teachers = await Teacher.find(filter);

  res.json({
    success: true,
    total: teachers.length,
    teachers,
  });
});

exports.exportTeachersToExcel = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort("-createdAt");

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
