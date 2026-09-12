const express = require("express");
const {
  getLiveness,
  getReadiness,
} = require("../controllers/health.Controller");

const router = express.Router();

router.get("/live", getLiveness);
router.get("/ready", getReadiness);

module.exports = router;
