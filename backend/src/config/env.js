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

const readPositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

module.exports = {
  port: process.env.PORT,
  mongoUri: process.env.MONGODB_URI,

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtAlgorithm: "HS256",
  jwtIssuer: process.env.JWT_ISSUER || "juniorchamps-api",
  jwtAudience: process.env.JWT_AUDIENCE || "juniorchamps-client",

  authFailedWindowSeconds: readPositiveInteger(
    process.env.AUTH_FAILED_WINDOW_SECONDS,
    15 * 60
  ),
  authFailedThreshold: readPositiveInteger(
    process.env.AUTH_FAILED_THRESHOLD,
    5
  ),
  authProtectionCooldownSeconds: readPositiveInteger(
    process.env.AUTH_PROTECTION_COOLDOWN_SECONDS,
    5 * 60
  ),

  razorpayKey: process.env.RAZORPAY_KEY_ID,
  razorpaySecret: process.env.RAZORPAY_SECRET,
};