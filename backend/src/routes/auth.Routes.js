const express = require("express");
const router = express.Router();

// Controllers import (Added changePassword)
const {
  registerUser,
  loginUser,
  getProfile,
  changePassword,
} = require("../controllers/auth.Controller");

// Sahi path (Kyunki folder ka naam 'middleware' hai, 'middlewares' nahi)
const { protect } = require("../middleware/auth.Middleware");
const validate = require("../middleware/validate");

// Validators import (Added changePasswordValidation)
const {
  registerUserValidation,
  loginValidation,
  changePasswordValidation,
} = require("../validators/authValidator");

// Rate limiters import (Added sensitiveLimiter)
const {
  authLimiter,
  registrationLimiter,
  sensitiveLimiter,
} = require("../config/rateLimiter");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Samay Singh
 *               email:
 *                 type: string
 *                 example: admin@juniorchamps.com
 *               password:
 *                 type: string
 *                 example: Abc12345
 *     responses:
 *       201:
 *         description: User registered successfully
 */

router.post("/register", registrationLimiter, registerUserValidation, validate, registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@juniorchamps.com
 *               password:
 *                 type: string
 *                 example: Abc12345
 *     responses:
 *       200:
 *         description: Login successful
 */

router.post("/login", authLimiter, loginValidation, validate, loginUser);
router.get("/profile", protect, getProfile);

// New Password Change Route (User)
router.patch(
  "/password",
  protect,
  sensitiveLimiter,
  changePasswordValidation,
  validate,
  changePassword
);

module.exports = router;