const express = require("express");
const router = express.Router();

// 1. Middlewares ke sahi paths (Kyunki routes aur middleware dono src ke andar hain)
const upload = require("../middleware/upload.Middleware");
const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");

// 2. Controller ka sahi path (../src/ hata kar sirf ../controllers/ kiya)
const {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  searchStudent,
} = require("../controllers/student.Controller");

// Global Middlewares for these routes
router.use(protect);
router.use(adminOnly);

// Routes definition
router.post("/", upload.single("studentPhoto"), createStudent);
router.get("/", getStudents);
router.get("/search", searchStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;
