const auditLog = require("../utils/auditLog");
const Teacher = require("../models/Teacher");
const ApiResponse = require("../utils/ApiResponse");
const fs = require("fs-extra");
const ExcelJS = require("exceljs");

exports.createTeacher = async (req, res) => {
  try {
    const teacherData = req.body;

    if (req.file) {
      teacherData.photo = req.file.path;
    }

    // टीचर डेटाबेस में सेव हुआ
    const teacher = await Teacher.create(teacherData);

    // ==========================================
    // 👇 यहाँ Audit Log दर्ज करें
    // ==========================================
    auditLog({
      req,
      action: "CREATE",
      resource: "Teacher",
      resourceId: teacher._id,
    });
    // ==========================================

    const apiResponse = require("../utils/ApiResponse");
    apiResponse.created(res, "Teacher created successfully", teacher);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const asyncHandler = require("../middleware/async.Handler");

exports.getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find();

  ApiResponse.success(
    res,

    "Teachers fetched successfully",

    teachers
  );
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
    // 1. Query se page aur limit nikaalein (Default: page 1, limit 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Skip calculate karein (Maan lo page 2 hai, toh pehle 10 records skip honge)
    const skip = (page - 1) * limit;

    // 2. Sorting ka logic (Jo pehle kiya tha)
    const sort = req.query.sort || "-createdAt";

    const totalRecords = await Teacher.countDocuments();
    const totalPages = Math.ceil(totalRecords / limit);

    // 4. Database se limited aur sorted data nikalna
    const teachers = await Teacher.find().sort(sort).skip(skip).limit(limit);

    // 5. Sahi format mein response bhejna (Jaisa aapko chahiye)
    res.json({
      success: true,
      page,
      limit,
      totalRecords,
      totalPages,
      teachers, // Isme aapka saara data array ke roop mein chala jayega
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
    // 1. Pehle database se bina update kiye teacher ka data nikaalein
    let teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // 2. [NEW LOGIC] Agar nayi photo aayi hai aur purani pehle se hai, toh purani delete karein
    if (req.file && teacher.photo) {
      await fs.remove(teacher.photo);
    }

    // 3. Form se aaya hua baaki data body se lekar update karein
    Object.assign(teacher, req.body);

    // 4. Agar nayi photo upload hui hai, toh uska path set karein
    if (req.file) {
      teacher.photo = req.file.path;
    }

    // 5. Badlaav ko database mein save karein
    await teacher.save();

    // ==========================================
    // 👇 यहाँ पर Audit Log दर्ज करें 👇
    // ==========================================
    auditLog({
      req,
      action: "UPDATE",
      resource: "Teacher",
      resourceId: teacher._id,
    });
    // ==========================================

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

    // ==========================================
    // 👇 यहाँ पर Audit Log दर्ज करें 👇
    // ==========================================
    auditLog({
      req,
      action: "DELETE",
      resource: "Teacher",
      resourceId: teacher._id, // या req.params.id
    });
    // ==========================================

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
      {
        firstName: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        lastName: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        employeeId: {
          $regex: keyword,
          $options: "i",
        },
      },
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

// Teachers ko Excel mein export karne ka function
exports.exportTeachersToExcel = async (req, res) => {
  try {
    // 1. Database se saare teachers ka data fetch karna
    const teachers = await Teacher.find().sort("-createdAt");

    // 2. Nayi Excel Workbook banana
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Teachers");

    // 3. Columns set karna
    worksheet.columns = [
      { header: "ID", key: "_id", width: 30 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Created At", key: "createdAt", width: 25 },
    ];

    // 4. Rows data insert karna
    teachers.forEach((teacher) => {
      worksheet.addRow({
        _id: teacher._id.toString(),
        name: teacher.name,
        email: teacher.email,
        status: teacher.status || "N/A",
        createdAt: teacher.createdAt,
      });
    });

    // Header row ko bold styling dena
    worksheet.getRow(1).font = { bold: true };

    // 5. Response headers set karna taaki file browser me automatic download ho sake
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    // 🔹 Yahan file ka naam teachers.xlsx rakha hai jaisa image me manga hai
    res.setHeader("Content-Disposition", "attachment; filename=teachers.xlsx");

    // Excel file response stream me write karna
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
