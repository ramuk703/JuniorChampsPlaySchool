const express = require("express");
const { admissionLimiter } = require("../config/rateLimiter");
const { validationResult } = require("express-validator");
const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const {
  publicAdmissionRules, listAdmissionRules, admissionIdRules, updateAdmissionRules,
} = require("../validators/admissionValidator");
const {
  createPublicAdmission, listAdmissions, getAdmission, updateAdmission,
} = require("../controllers/admission.Controller");

const router = express.Router();



const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please correct the submitted fields",
      errors: result.array().map(({ path, param, msg }) => ({ field: path || param, message: msg })),
    });
  }
  return next();
};

// Public endpoint must be declared before admin authentication.
router.post(
  "/public",
  admissionLimiter,
  publicAdmissionRules,
  validate,
  createPublicAdmission
);

router.use(protect);
router.use(adminOnly);

router.get("/", listAdmissionRules, validate, listAdmissions);
router.get("/:id", admissionIdRules, validate, getAdmission);
router.patch("/:id", updateAdmissionRules, validate, updateAdmission);

module.exports = router;
