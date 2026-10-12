const express = require("express");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const router = express.Router();

const User = require("../models/User");
const Teacher = require("../models/Teacher");
const generateToken = require("../utils/generateToken");
const { protect, teacherOnly } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const { authLimiter, sensitiveLimiter } = require("../config/rateLimiter");

// Only an admin can provision a login for an existing active teacher.
// The random temporary password is never disclosed; teacher sets a password via Forgot Password.
router.post("/provision", protect, adminOnly, sensitiveLimiter, asyncHandler(async (req, res) => {
  const { teacherId } = req.body || {};
  if (!teacherId || !/^[a-f\d]{24}$/i.test(String(teacherId))) {
    return res.status(400).json({ success: false, message: "A valid teacherId is required" });
  }

  const teacher = await Teacher.findOne({ _id: teacherId, deletedAt: null, status: "Active" });
  if (!teacher) return res.status(404).json({ success: false, message: "Active teacher not found" });
  if (!teacher.email) return res.status(400).json({ success: false, message: "Teacher must have an email address" });

  const email = teacher.email.trim().toLowerCase();
  const existing = await User.findOne({ $or: [{ email }, { teacherId: teacher._id }] });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: existing.role === "teacher" ? "A login account already exists for this teacher" : "This email is already used by another account",
    });
  }

  const randomPassword = crypto.randomBytes(48).toString("hex");
  const user = await User.create({
    name: `${teacher.firstName} ${teacher.lastName}`.trim(),
    email,
    password: randomPassword,
    role: "teacher",
    teacherId: teacher._id,
  });

  return res.status(201).json({
    success: true,
    message: "Teacher account created. Ask the teacher to use Forgot Password to set a password.",
    data: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}));

router.post("/login", authLimiter, asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password;
  if (!email || typeof password !== "string" || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email, role: "teacher" });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
  if (!user.teacherId) {
    return res.status(403).json({ success: false, message: "Teacher account is not linked to a profile" });
  }

  const teacher = await Teacher.findOne({ _id: user.teacherId, deletedAt: null, status: "Active" });
  if (!teacher) return res.status(403).json({ success: false, message: "Teacher profile is inactive or unavailable" });

  return res.json({
    success: true,
    token: generateToken(user._id, user.role, user.tokenVersion),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    teacher: {
      id: teacher._id,
      employeeId: teacher.employeeId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      classTeacher: teacher.classTeacher,
      qualification: teacher.qualification,
    },
  });
}));

router.get("/me", protect, teacherOnly, (req, res) => res.json({
  success: true,
  user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  teacher: req.teacher,
}));

module.exports = router;
