const express = require("express");

const router = express.Router();

const {
  registerParent,

  loginParent,

  dashboard,
} = require("../controllers/parent.Controller");

const { protect } = require("../middleware/auth.Middleware");

router.post("/register", registerParent);

router.post("/login", loginParent);

router.get("/dashboard", protect, dashboard);

module.exports = router;
