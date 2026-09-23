const express = require("express");

const router = express.Router();

const {
  markAttendance,
  getAttendance,
  getStudentAttendance,
  monthlyAttendance,
  attendanceStats,
  bulkAttendance,
  attendancePercentage,
  getAttendanceCalendar,
  exportAttendanceToExcel,
} = require("../controllers/attendance.Controller");

const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const { exportLimiter } = require("../config/rateLimiter");
const validate = require("../middleware/validate");

const {
  attendanceValidation,
  bulkAttendanceValidation,
  attendanceQueryValidation,
  studentAttendanceParamValidation,
  attendanceCalendarValidation,
} = require("../validators/attendanceValidator");

router.use(protect);
router.use(adminOnly);

router.post(
  "/bulk",
  bulkAttendanceValidation,
  validate,
  bulkAttendance
);

router.post(
  "/",
  attendanceValidation,
  validate,
  markAttendance
);

router.get(
  "/",
  attendanceQueryValidation,
  validate,
  getAttendance
);

router.get(
  "/student/:id",
  studentAttendanceParamValidation,
  validate,
  getStudentAttendance
);

router.get("/stats", attendanceStats);

router.get("/monthly", attendanceQueryValidation, validate, monthlyAttendance);

router.get(
  "/percentage/:id",
  studentAttendanceParamValidation,
  validate,
  attendancePercentage
);

router.get(
  "/calendar/:id",
  attendanceCalendarValidation,
  validate,
  getAttendanceCalendar
);

router.get("/analytics", attendanceStats);

router.get(
  "/export/excel",
  exportLimiter,
  exportAttendanceToExcel
);

module.exports = router;
