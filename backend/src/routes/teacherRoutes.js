const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const validate = require("../middleware/validate");
const router = express.Router();

// 1. Controller ka sahi path (../src/ hata diya)
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");

const { protect } = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

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
