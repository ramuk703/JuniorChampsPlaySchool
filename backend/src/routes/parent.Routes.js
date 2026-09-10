const express = require("express");

const router = express.Router();

const {
  registerParent,

  loginParent,

  dashboard,
} = require("../controllers/parent.Controller");

const { protect } = require("../middleware/auth.Middleware");
const {
  authLimiter,
  registrationLimiter,
} = require("../config/rateLimiter");

router.post("/register", registrationLimiter, registerParent);

router.post("/login", authLimiter, loginParent);

router.get("/dashboard", protect, dashboard);

module.exports = router;
