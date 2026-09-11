const express = require("express");

const router = express.Router();

const {
  registerParent,
  loginParent,
  dashboard,
  changePassword,
  logoutParent,
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

// Password Change Route (Parent)
router.patch(
  "/password",
  protectParent,
  sensitiveLimiter,
  changePasswordValidation,
  validate,
  changePassword
);

// Logout Route (Parent)
router.post(
  "/logout",
  protectParent,
  sensitiveLimiter,
  logoutParent
);

module.exports = router;