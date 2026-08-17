const express = require("express");

const router = express.Router();

const {
  generateFee,

  getPayments,

  markPaid,
} = require("../controllers/fee.controller");

const { protect } = require("../middleware/auth.Middleware");

const adminOnly = require("../middleware/admin.Middleware");

router.use(protect);

router.use(adminOnly);

router.post("/", generateFee);

router.get("/", getPayments);

router.put("/:id/pay", markPaid);

module.exports = router;
