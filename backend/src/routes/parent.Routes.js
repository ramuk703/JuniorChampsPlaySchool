const express = require("express");

const router = express.Router();

const {
  registerParent,

  loginParent,

  dashboard,
} = require("../controllers/parent.Controller");

const { protectParent } = require("../middleware/auth.Middleware");
const validate = require("../middleware/validate");
const {
  registerParentValidation,
  loginParentValidation,
} = require("../validators/authValidator");
const {
  authLimiter,
  registrationLimiter,
} = require("../config/rateLimiter");

router.post("/register", registrationLimiter, registerParentValidation, validate, registerParent);

router.post("/login", authLimiter, loginParentValidation, validate, loginParent);

router.get("/dashboard", protectParent, dashboard);

module.exports = router;
