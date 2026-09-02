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

router.use(protect);
router.use(adminOnly);

router.post("/", generateFee);
router.post("/generate-monthly", generateMonthlyFees);
router.get("/", getPayments);
router.put("/:id/pay", markPaid);

module.exports = router;
