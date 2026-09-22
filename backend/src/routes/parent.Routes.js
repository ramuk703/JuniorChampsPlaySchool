const express = require("express");

const router = express.Router();

const {
  registerParent,
  loginParent,
  dashboard,
  changePassword,
  logoutParent,
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  getDeletedParents,
  restoreParent,
} = require("../controllers/parent.Controller");

const { protectParent, protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const validate = require("../middleware/validate");

const {
  registerParentValidation,
  loginParentValidation,
  changePasswordValidation,
} = require("../validators/authValidator");

const {
  createParentValidation,
  updateParentValidation,
  parentListValidation,
} = require("../validators/parentValidator");

const {
  authLimiter,
  registrationLimiter,
  sensitiveLimiter,
} = require("../config/rateLimiter");

/*
 * ============================================================
 * PARENT AUTHENTICATION
 * ============================================================
 */

router.post(
  "/register",
  registrationLimiter,
  registerParentValidation,
  validate,
  registerParent
);

router.post(
  "/login",
  authLimiter,
  loginParentValidation,
  validate,
  loginParent
);

router.get("/dashboard", protectParent, dashboard);

router.patch(
  "/password",
  protectParent,
  sensitiveLimiter,
  changePasswordValidation,
  validate,
  changePassword
);

router.post(
  "/logout",
  protectParent,
  sensitiveLimiter,
  logoutParent
);

/*
 * ============================================================
 * ADMIN PARENT MANAGEMENT
 * ============================================================
 */

router.use(protect);
router.use(adminOnly);

router.get(
  "/",
  parentListValidation,
  validate,
  getAllParents
);

router.get(
  "/deleted",
  parentListValidation,
  validate,
  getDeletedParents
);

router.post(
  "/",
  createParentValidation,
  validate,
  createParent
);

router.patch(
  "/:id/restore",
  restoreParent
);

router.get(
  "/:id",
  getParentById
);

router.put(
  "/:id",
  updateParentValidation,
  validate,
  updateParent
);

router.delete(
  "/:id",
  deleteParent
);

module.exports = router;
