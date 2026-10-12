const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const TeacherAttendance = require("../models/TeacherAttendance");
const { protect, teacherOnly } = require("../middleware/auth.Middleware");

router.use(protect, teacherOnly);

router.get("/profile", (req, res) => res.json({ success: true, teacher: req.teacher }));

router.get("/dashboard", asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const [month, recent, totalRecords] = await Promise.all([
    TeacherAttendance.find({ teacher: req.teacher._id, date: { $gte: start, $lt: end } })
      .select("date status remarks").sort({ date: -1 }).lean(),
    TeacherAttendance.find({ teacher: req.teacher._id })
      .select("date status remarks").sort({ date: -1 }).limit(5).lean(),
    TeacherAttendance.countDocuments({ teacher: req.teacher._id }),
  ]);
  const thisMonth = { present: 0, absent: 0, leave: 0 };
  for (const item of month) {
    const status = String(item.status || "").toLowerCase();
    if (Object.hasOwn(thisMonth, status)) thisMonth[status] += 1;
  }
  res.json({ success: true, teacher: req.teacher, attendance: { totalRecords, thisMonth, recent } });
}));

router.get("/attendance", asyncHandler(async (req, res) => {
  const parsedPage = Number.parseInt(req.query.page, 10);
  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 30;
  const filter = { teacher: req.teacher._id };
  const [data, total] = await Promise.all([
    TeacherAttendance.find(filter).select("date status remarks").sort({ date: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
    TeacherAttendance.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

module.exports = router;
