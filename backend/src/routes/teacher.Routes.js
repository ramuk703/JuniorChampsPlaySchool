const express = require("express");
const upload = require("../middleware/upload.Middleware");
const validate = require("../middleware/validate");
const router = express.Router();

// 1. Controller ka sahi path (../src/ hata diya)
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacher.Controller");

const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");

// 2. Validators ka sahi path (Kyunki validators bhi ab src/ ke andar hai)
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
router.get("/", getTeachers);
router.get("/:id", getTeacherById);
router.put("/:id", teacherValidation, validate, updateTeacher);
router.delete("/:id", deleteTeacher);

module.exports = router;
