const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const ExcelJS = require("exceljs");
const auditLog = require("../utils/auditLog");
const cacheInvalidationService = require("../services/cacheInvalidation.service");
const withTransaction = require("../utils/withTransaction");

// 1. Mark Attendance (Hardened)
const markAttendance = async (req, res) => {
  try {
    const { studentId, student, date, status, className } = req.body;
    const targetStudentId = studentId || student;

    // 1. Check if Student ID is provided (Step 5.6.3-B)
    if (!targetStudentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // 2. Check if ObjectId format is valid (Step 5.6.3-B)
    if (!mongoose.isValidObjectId(targetStudentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    // 3. Check if Student exists and is active (Step 5.6.3-A)
    const targetStudent = await Student.findOne({
      _id: targetStudentId,
      deletedAt: null,
    }).select("_id className");

    if (!targetStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found or deleted",
      });
    }

    // 4. Create Attendance Record
    const newAttendance = await Attendance.create({
      student: targetStudent._id,
      className: className || targetStudent.className,
      date: date || new Date(),
      status: status,
      markedBy: req.user?._id,
    });

    auditLog({
      req,
      action: "CREATE",
      resource: "Attendance",
      details: {
        studentId: targetStudent._id,
        date: date || new Date(),
        status: status,
      },
    });

    await cacheInvalidationService.attendance(targetStudent._id);

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: newAttendance,
    });
  } catch (error) {
    // Handling Duplicate Key Error -> Production Standard (409 Conflict)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance for this student on this date has already been marked",
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Get Attendance (Fixed with Aggregation for Pagination Consistency)
const getAttendance = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100,
    );

    const { date, studentId, status, className } = req.query;

    const filter = {};

    if (date) {
      const startDate = new Date(date);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date",
        });
      }

      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      filter.date = {
        $gte: startDate,$lt: endDate,
      };
    }

    if (studentId) {
      filter.student = new mongoose.Types.ObjectId(studentId);
    }

    if (status) {
      filter.status = status;
    }

    if (className) {
      filter.className = {
        $regex: className.trim(),$options: "i",
      };
    }

    const pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "student.deletedAt": null,
        },
      },
    ];

    const countPipeline = [...pipeline, { $count: "total" }];

    const dataPipeline = [
      ...pipeline,
      {
        $lookup: {
          from: "users",
          localField: "markedBy",
          foreignField: "_id",
          as: "markedBy",
        },
      },
      {
        $unwind: {
          path: "$markedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {           date: -1,           createdAt: -1,         },       },       {$skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          student: {
            _id: "$student._id",
            admissionNo: "$student.admissionNo",
            firstName: "$student.firstName",
            lastName: "$student.lastName",
            className: "$student.className",
            section: "$student.section",
            photo: "$student.photo",
            status: "$student.status",
          },
          className: 1,
          date: 1,
          status: 1,
          markedBy: {
            _id: "$markedBy._id",
            name: "$markedBy.name",
            email: "$markedBy.email",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const [countResult, attendance] = await Promise.all([
      Attendance.aggregate(countPipeline),
      Attendance.aggregate(dataPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
};

// 3. Get Student Attendance
const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100,
    );

    const { date, status } = req.query;

    const student = await Student.findOne({
      _id: id,
      deletedAt: null,
    }).select(
      "_id admissionNo firstName lastName gender className section mobile status photo",
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const filter = {
      student: id,
    };

    if (date) {
      const startDate = new Date(date);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date",
        });
      }

      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      filter.date = {
        $gte: startDate,$lt: endDate,
      };
    }

    if (status) {
      filter.status = status;
    }

    const [total, attendance] = await Promise.all([
      Attendance.countDocuments(filter),

      Attendance.find(filter)
        .populate(
          "student",
          "_id admissionNo firstName lastName gender className section mobile status photo",
        )
        .populate("markedBy", "_id name email")
        .sort({
          date: -1,
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      student,
      attendance,
    });
  } catch (error) {
    console.error("Get student attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch student attendance",
    });
  }
};

// 4. Monthly Attendance
const monthlyAttendance = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100,
    );

    const { month, year, studentId, status, className } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const monthNumber = parseInt(month, 10);
    const yearNumber = parseInt(year, 10);

    if (
      !Number.isInteger(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    if (
      !Number.isInteger(yearNumber) ||
      yearNumber < 2000 ||
      yearNumber > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Year must be between 2000 and 2100",
      });
    }

    const startOfMonth = new Date(
      yearNumber,
      monthNumber - 1,
      1,
      0,
      0,
      0,
      0,
    );

    const startOfNextMonth = new Date(
      yearNumber,
      monthNumber,
      1,
      0,
      0,
      0,
      0,
    );

    const filter = {
      date: {
        $gte: startOfMonth,$lt: startOfNextMonth,
      },
    };

    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: "Student ID must be a valid MongoDB ID",
        });
      }

      filter.student = new mongoose.Types.ObjectId(studentId);
    }

    if (status) {
      filter.status = status;
    }

    if (className) {
      filter.className = {
        $regex: className.trim(),$options: "i",
      };
    }

    const pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "student.deletedAt": null,
        },
      },
    ];

    const countPipeline = [...pipeline, { $count: "total" }];

    const dataPipeline = [
      ...pipeline,
      {
        $lookup: {
          from: "users",
          localField: "markedBy",
          foreignField: "_id",
          as: "markedBy",
        },
      },
      {
        $unwind: {
          path: "$markedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {           date: -1,           createdAt: -1,         },       },       {$skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          student: {
            _id: "$student._id",
            admissionNo: "$student.admissionNo",
            firstName: "$student.firstName",
            lastName: "$student.lastName",
            gender: "$student.gender",
            className: "$student.className",
            section: "$student.section",
            mobile: "$student.mobile",
            status: "$student.status",
            photo: "$student.photo",
          },
          className: 1,
          date: 1,
          status: 1,
          markedBy: {
            _id: "$markedBy._id",
            name: "$markedBy.name",
            email: "$markedBy.email",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const [countResult, attendance] = await Promise.all([
      Attendance.aggregate(countPipeline),
      Attendance.aggregate(dataPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json({
      success: true,
      month: monthNumber,
      year: yearNumber,
      page,
      limit,
      total,
      totalPages,
      attendance,
    });
  } catch (error) {
    console.error("Monthly attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly attendance",
    });
  }
};

// 5. Bulk Attendance
const bulkAttendance = async (req, res) => {
  try {
    const { date: requestedDate, attendanceData } = req.body;

    const attendanceDate = requestedDate
      ? new Date(requestedDate)
      : new Date();

    if (Number.isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    attendanceDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(attendanceDate);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const studentIds = attendanceData.map((item) => item.studentId);

    const uniqueStudentIds = new Set(studentIds);

    if (uniqueStudentIds.size !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate student IDs are not allowed in attendance data",
      });
    }

    const validObjectIds = studentIds.every((studentId) =>
      mongoose.Types.ObjectId.isValid(studentId),
    );

    if (!validObjectIds) {
      return res.status(400).json({
        success: false,
        message: "Each student ID must be a valid MongoDB ID",
      });
    }

    const students = await Student.find({
      _id: {
        $in: studentIds.map(
          (studentId) => new mongoose.Types.ObjectId(studentId),
        ),
      },
      deletedAt: null,
    })
      .select("_id className")
      .lean();

    if (students.length !== studentIds.length) {
      const foundStudentIds = new Set(
        students.map((student) => student._id.toString()),
      );

      const missingStudentIds = studentIds.filter(
        (studentId) => !foundStudentIds.has(studentId),
      );

      return res.status(404).json({
        success: false,
        message: "One or more students were not found or are inactive",
        missingStudentIds,
      });
    }

    const studentMap = new Map(
      students.map((student) => [student._id.toString(), student]),
    );

    const result = await withTransaction(async (session) => {
      const existingAttendance = await Attendance.find({
        student: {
          $in: studentIds.map(
            (studentId) => new mongoose.Types.ObjectId(studentId),
          ),
        },
        date: {
          $gte: startOfDay,$lt: endOfDay,
        },
      })
        .select("student")
        .session(session)
        .lean();

      if (existingAttendance.length > 0) {
        const duplicateStudentIds = existingAttendance.map(
          (record) => record.student.toString(),
        );

        return {
          duplicateStudentIds,
        };
      }

      const documents = attendanceData.map((item) => {
        const student = studentMap.get(item.studentId);

        return {
          student: student._id,
          className: student.className,
          date: attendanceDate,
          status: item.status,
          markedBy: req.user._id,
        };
      });

      const createdAttendance = await Attendance.insertMany(documents, {
        session,
        ordered: true,
      });

      return {
        createdAttendance,
      };
    });

    if (result.duplicateStudentIds?.length) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance already exists for one or more students on this date",
        duplicateStudentIds: result.duplicateStudentIds,
      });
    }

    auditLog({
      req,
      action: "BULK_CREATE",
      resource: "Attendance",
      details: {
        type: "BULK_ATTENDANCE",
        date: attendanceDate,
        totalStudents: result.createdAttendance.length,
      },
    });

    await cacheInvalidationService.attendance();

    const attendance = await Attendance.find({
      _id: {
        $in: result.createdAttendance.map((record) => record._id),
      },
    })
      .populate(
        "student",
        "_id admissionNo firstName lastName gender className section mobile status photo",
      )
      .populate("markedBy", "_id name email")
      .sort({ student: 1 })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Bulk attendance marked successfully",
      total: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Bulk attendance error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance already exists for one or more students on this date",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to mark bulk attendance",
    });
  }
};

// 6. Attendance Percentage (Hardened)
const attendancePercentage = async (req, res) => {
  try {
    const { id: studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Student ID must be a valid MongoDB ID",
      });
    }

    const student = await Student.findOne({
      _id: studentId,
      deletedAt: null,
    })
      .select("_id")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    const [total, present] = await Promise.all([
      Attendance.countDocuments({
        student: studentObjectId,
      }),
      Attendance.countDocuments({
        student: studentObjectId,
        status: "Present",
      }),
    ]);

    const percentage =
      total === 0 ? 0 : parseFloat(((present / total) * 100).toFixed(2));

    return res.status(200).json({
      success: true,
      total,
      present,
      percentage,
    });
  } catch (error) {
    console.error("Attendance percentage error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate attendance percentage",
    });
  }
};

// 7. Get Attendance Calendar (Optimized Query with Validation & Debugging)
const getAttendanceCalendar = async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const { month, year } = req.query;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Student ID must be a valid MongoDB ID",
      });
    }

    const parsedMonth = Number(month);
    const parsedYear = Number(year);

    if (
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      !Number.isInteger(parsedYear) ||
      parsedYear < 2000 ||
      parsedYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Month must be 1-12 and year must be between 2000 and 2100",
      });
    }

    const student = await Student.findOne({
      _id: studentId,
      deletedAt: null,
    })
      .select("_id")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    const startOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
    const startOfNextMonth = new Date(Date.UTC(parsedYear, parsedMonth, 1));

    // Step 7C - Diagnose calendar date boundary
    console.log("CALENDAR DEBUG", {
      parsedMonth,
      parsedYear,
      startOfMonth,
      startOfNextMonth,
    });

    const attendanceRecords = await Attendance.find({
      student: studentObjectId,
      date: {
        $gte: startOfMonth,$lt: startOfNextMonth,
      },
    })
      .select("_id date status")
      .sort({ date: 1 })
      .lean();

    const attendance = attendanceRecords.map((record) => ({
      date: new Date(record.date).toISOString().split("T")[0],
      status: record.status,
    }));

    return res.status(200).json({
      success: true,
      month: parsedMonth,
      year: parsedYear,
      attendance,
    });
  } catch (error) {
    console.error("Attendance calendar error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance calendar",
    });
  }
};

// 8. Attendance Analytics (Hardened with Aggregation)
const attendanceStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const pipeline = [
      {
        $match: {
          date: {
            $gte: startOfToday,$lt: startOfTomorrow,
          },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "student.deletedAt": null,
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ];

    const results = await Attendance.aggregate(pipeline);

    const counts = {
      Present: 0,
      Absent: 0,
      Leave: 0,
    };

    results.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(counts, item._id)) {
        counts[item._id] = item.count;
      }
    });

    const totalStudentsToday = counts.Present + counts.Absent + counts.Leave;

    const attendancePercentage =
      totalStudentsToday === 0
        ? 0
        : parseFloat(
            ((counts.Present / totalStudentsToday) * 100).toFixed(1),
          );

    return res.status(200).json({
      success: true,
      todayPresent: counts.Present,
      todayAbsent: counts.Absent,
      todayLeave: counts.Leave,
      attendancePercentage,
    });
  } catch (error) {
    console.error("Attendance stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance statistics",
    });
  }
};

// 9. Get Parent Attendance View (Optimized Query)
const getParentAttendanceView = async (req, res) => {
  try {
    const studentId = req.user.student;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "No student linked to this parent account",
      });
    }

    const student = await Student.findOne({
      _id: studentId,
      deletedAt: null,
    })
      .select("_id firstName lastName")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const total = await Attendance.countDocuments({ student: studentId });
    const present = await Attendance.countDocuments({
      student: studentId,
      status: "Present",
    });
    const attendancePercentage =
      total === 0 ? 0 : parseFloat(((present / total) * 100).toFixed(1));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const currentMonthRecords = await Attendance.find({
      student: studentId,
      date: { $gte: startOfMonth,$lte: endOfMonth },
    })
      .select("_id date status")
      .lean();

    const formattedThisMonth = currentMonthRecords.map((record) => ({
      date: new Date(record.date).toISOString().split("T")[0],
      status: record.status,
    }));

    res.status(200).json({
      student: `${student.firstName} ${student.lastName}`.trim(),
      attendancePercentage,
      thisMonth: formattedThisMonth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 10. Export Attendance to Excel (Using Aggregation Pipeline)
const exportAttendanceToExcel = async (req, res) => {
  try {
    const attendanceRecords = await Attendance.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "student.deletedAt": null,
        },
      },
      {
        $sort: {           date: -1,         },       },       {$project: {
          date: 1,
          status: 1,
          admissionNo: "$student.admissionNo",
          firstName: "$student.firstName",
          lastName: "$student.lastName",
        },
      },
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    worksheet.columns = [
      {
        header: "Date",
        key: "date",
        width: 15,
      },
      {
        header: "Admission No",
        key: "admissionNo",
        width: 20,
      },
      {
        header: "Student Name",
        key: "studentName",
        width: 30,
      },
      {
        header: "Status",
        key: "status",
        width: 15,
      },
    ];

    worksheet.getRow(1).font = {
      bold: true,
    };

    attendanceRecords.forEach((record) => {
      const studentName = `${record.firstName || ""} ${
        record.lastName || ""
      }`.trim();

      worksheet.addRow({
        date: record.date
          ? new Date(record.date).toISOString().split("T")[0]
          : "N/A",
        admissionNo: record.admissionNo || "N/A",
        studentName: studentName || "N/A",
        status: record.status || "N/A",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance-report.xlsx",
    );

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error("Attendance Excel export error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to export attendance report",
    });
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getStudentAttendance,
  monthlyAttendance,
  bulkAttendance,
  attendancePercentage,
  getAttendanceCalendar,
  attendanceStats,
  getParentAttendanceView,
  exportAttendanceToExcel,
};