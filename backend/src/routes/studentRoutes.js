const express = require("express");
const router = express.Router();

// 1. Middlewares ke sahi paths (Kyunki routes aur middleware dono src ke andar hain)
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// 2. Controller ka sahi path (../src/ hata kar sirf ../controllers/ kiya)
const {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  searchStudent,
} = require("../controllers/studentController");

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
