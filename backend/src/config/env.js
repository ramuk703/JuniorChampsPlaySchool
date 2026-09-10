require("dotenv").config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is required. Set a strong JWT_SECRET in the environment."
  );
}

if (jwtSecret.length < 32) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters long."
  );
}

module.exports = {
  port: process.env.PORT,
  mongoUri: process.env.MONGODB_URI,

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtAlgorithm: "HS256",
  jwtIssuer: process.env.JWT_ISSUER || "juniorchamps-api",
  jwtAudience: process.env.JWT_AUDIENCE || "juniorchamps-client",

  razorpayKey: process.env.RAZORPAY_KEY_ID,
  razorpaySecret: process.env.RAZORPAY_SECRET,
};