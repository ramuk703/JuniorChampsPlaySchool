const express = require("express");
const router = express.Router();

const {
  createOrder,
  verifyPayment,
} = require("../controllers/payment.Controller");

const { razorpayKey } = require("../config/env");

const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const { sensitiveLimiter } = require("../config/rateLimiter");
const {
  createOrderValidation,
  verifyPaymentValidation,
} = require("../validators/paymentValidator");
const validate = require("../middleware/validate");

router.use(protect);
router.use(adminOnly);

router.get("/config", (req, res) => {
  return res.json({
    success: true,
    keyId: razorpayKey || null,
  });
});

router.post(
  "/create-order",
  sensitiveLimiter,
  createOrderValidation,
  validate,
  createOrder
);

router.post(
  "/verify",
  sensitiveLimiter,
  verifyPaymentValidation,
  validate,
  verifyPayment
);

module.exports = router;
