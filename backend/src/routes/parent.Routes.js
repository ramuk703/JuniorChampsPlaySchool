const express = require("express");

const router = express.Router();

const {
  registerParent,
  loginParent,
  dashboard,
  changePassword,
} = require("../controllers/parent.Controller");

const { protectParent } = require("../middleware/auth.Middleware");
const validate = require("../middleware/validate");
const {
  registerParentValidation,
  loginParentValidation,
  changePasswordValidation,
} = require("../validators/authValidator");
const {
  authLimiter,
  registrationLimiter,
  sensitiveLimiter,
} = require("../config/rateLimiter");

router.post("/register", registrationLimiter, registerParentValidation, validate, registerParent);

router.post("/login", authLimiter, loginParentValidation, validate, loginParent);

router.get("/dashboard", protectParent, dashboard);

// New Password Change Route (Parent)
router.patch(
  "/password",
  protectParent,
  sensitiveLimiter,
  changePasswordValidation,
  validate,
  changePassword
);

module.exports = router;