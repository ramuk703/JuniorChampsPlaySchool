const express = require("express");
const router = express.Router();

const {
  generateFee,
  getPayments,
  markPaid,
} = require("../controllers/fee.controller");
const { generateMonthlyFees } = require("../controllers/payment.Controller");
const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const { sensitiveLimiter } = require("../config/rateLimiter");
const { feeValidation } = require("../validators/feeValidator");
const validate = require("../middleware/validate");

router.use(protect);
router.use(adminOnly);

router.post(
  "/",
  sensitiveLimiter,
  feeValidation,
  validate,
  generateFee,
);
router.post("/generate-monthly", sensitiveLimiter, generateMonthlyFees);
router.get("/", getPayments);
router.put("/:id/pay", sensitiveLimiter, markPaid);

module.exports = router;