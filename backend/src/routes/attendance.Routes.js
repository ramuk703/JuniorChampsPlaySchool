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

router.use(protect);
router.use(adminOnly);

router.post("/bulk", bulkAttendance);
router.post("/", markAttendance);

router.get("/", getAttendance);
router.get("/student/:id", getStudentAttendance);
router.get("/stats", attendanceStats);
router.get("/monthly", monthlyAttendance);
router.get("/percentage/:id", attendancePercentage);
router.get("/calendar/:id", getAttendanceCalendar);
router.get("/analytics", attendanceStats);

router.get(
  "/export/excel",
  exportLimiter,
  exportAttendanceToExcel
);

module.exports = router;
