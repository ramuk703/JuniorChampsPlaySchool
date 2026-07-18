const express = require("express");

const router = express.Router();

const {
  generateFee,

  getPayments,

  markPaid,
} = require("../controllers/feeController");

const { protect } = require("../middleware/authMiddleware");

const adminOnly = require("../middleware/adminMiddleware");

router.use(protect);

router.use(adminOnly);

router.post("/", generateFee);

router.get("/", getPayments);

router.put("/:id/pay", markPaid);

module.exports = router;
