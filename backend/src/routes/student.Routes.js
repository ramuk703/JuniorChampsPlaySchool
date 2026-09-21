const express = require("express");

const router = express.Router();

// 1. Middlewares
const upload = require("../middleware/upload.Middleware");
const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");

// 2. Controller imports
const {
  createStudent,
  getStudentById,
  getStudents,
  updateStudent,
  deleteStudent,
  restoreStudent,
  getDeletedStudents,
  searchStudent,
} = require("../controllers/student.Controller");

// Global Middlewares for these routes
router.use(protect);
router.use(adminOnly);

// Routes definition
router.post("/", upload.single("studentPhoto"), createStudent);
router.get("/", getStudents);
router.get("/search", searchStudent);
router.get("/deleted", getDeletedStudents);
router.get("/:id", getStudentById); // Naya route add kiya gaya hai
router.patch("/:id/restore", restoreStudent);
router.put("/:id", upload.single("studentPhoto"), updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;