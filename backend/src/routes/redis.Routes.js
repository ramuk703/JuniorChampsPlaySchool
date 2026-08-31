const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const {
  getRedisHealth,
  getRedisMetrics,
} = require("../controllers/redis.Controller");

// Extract auth middleware (handles both default export and named export 'protect')
const protect =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware.protect || authMiddleware.authMiddleware;

router.get("/health", protect, adminOnly, getRedisHealth);
router.get("/metrics", protect, adminOnly, getRedisMetrics);

module.exports = router;
