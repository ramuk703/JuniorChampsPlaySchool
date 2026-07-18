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
  getParentAttendanceView,
  exportAttendanceToExcel,
} = require("../controllers/attendanceController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post(
  "/bulk",

  bulkAttendance
);

router.post("/", markAttendance);

router.get("/", getAttendance);

router.get("/student/:id", getStudentAttendance);

router.get("/stats", attendanceStats);
router.get("/monthly", monthlyAttendance);

router.get("/percentage/:id", attendancePercentage);
router.get("/calendar/:id", getAttendanceCalendar);
router.get("/analytics", attendanceStats);
router.get("/parent/attendance", getParentAttendanceView);
router.get("/attendance/export/excel", exportAttendanceToExcel);

module.exports = router;
