const express = require("express");

const router = express.Router();

const {
  registerParent,

  loginParent,

  dashboard,
} = require("../controllers/parentController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerParent);

router.post("/login", loginParent);

router.get("/dashboard", protect, dashboard);

module.exports = router;
