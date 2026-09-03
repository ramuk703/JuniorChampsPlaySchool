const express = require("express");
const upload = require("../middleware/upload.Middleware");
const validate = require("../middleware/validate");

const router = express.Router();

// 1. Controller imports
const {
  createTeacher,
  getTeachers,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  restoreTeacher,
  getDeletedTeachers,
} = require("../controllers/teacher.Controller");

const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");

// 2. Validators
const { teacherValidation } = require("../validators/teacherValidator");

router.use(protect);
router.use(adminOnly);

router.post(
  "/",
  upload.single("teacherPhoto"),
  teacherValidation,
  validate,
  createTeacher
);

// 🟢 FIX: Main GET route paginated & protected hai
router.get("/", getAllTeachers);
router.get("/all-unpaginated", getTeachers); // Optional: Unpaginated list ke liye
router.get("/deleted", getDeletedTeachers);
router.patch("/:id/restore", restoreTeacher);
router.get("/:id", getTeacherById);
router.put("/:id", teacherValidation, validate, updateTeacher);
router.delete("/:id", deleteTeacher);

module.exports = router;
