const express = require("express");
const router = express.Router();

const {
  createFeeStructure,
  getFeeStructures,
} = require("../controllers/feeStructure.Controller");

const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const { sensitiveLimiter } = require("../config/rateLimiter");
const { feeStructureValidation } = require("../validators/feeStructureValidator");
const validate = require("../middleware/validate");

router.use(protect);
router.use(adminOnly);

router.post(
  "/",
  sensitiveLimiter,
  feeStructureValidation,
  validate,
  createFeeStructure
);

router.get("/", getFeeStructures);

module.exports = router;
