const express = require("express");
const router = express.Router();

// Controllers import
const {
  registerUser,
  loginUser,
  getProfile,
} = require("../controllers/authController");

// Sahi path (Kyunki folder ka naam 'middleware' hai, 'middlewares' nahi)
const { protect } = require("../middleware/authMiddleware");

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
 *                 example: 123456
 *               role:
 *                 type: string
 *                 example: admin
 *     responses:
 *       201:
 *         description: User registered successfully
 */

router.post("/register", registerUser);

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
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 */

router.post("/login", loginUser);
router.get("/profile", protect, getProfile);

module.exports = router;
