const express = require("express");

const router = express.Router();

const {
  markTeacherAttendance,
  getTeacherAttendance,
} = require("../controllers/teacherAttendance.Controller");

const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");

router.use(protect);
router.use(adminOnly);

router.post("/", markTeacherAttendance);
router.get("/", getTeacherAttendance);

module.exports = router;
