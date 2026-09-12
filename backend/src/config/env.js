require("dotenv").config();

const VALID_NODE_ENVS = ["development", "test", "production"];
const VALID_LOG_LEVELS = [
  "error",
  "warn",
  "info",
  "http",
  "verbose",
  "debug",
  "silly",
];

const nodeEnv = process.env.NODE_ENV || "development";

if (!VALID_NODE_ENVS.includes(nodeEnv)) {
  throw new Error(
    `NODE_ENV must be one of: ${VALID_NODE_ENVS.join(", ")}`
  );
}

const readPositiveInteger = (value, fallback, name) => {
  const resolved = value === undefined || value === "" ? fallback : value;
  const parsed = Number(resolved);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
};

const readRequired = (name) => {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is required. Set it in the environment.`);
  }

  return value.trim();
};

const jwtSecret = readRequired("JWT_SECRET");

if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}

const mongoUri = readRequired("MONGODB_URI");

const port = readPositiveInteger(process.env.PORT, 5000, "PORT");

if (port > 65535) {
  throw new Error("PORT must be between 1 and 65535.");
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN?.trim() || "7d";

const shutdownTimeoutMs = readPositiveInteger(
  process.env.SHUTDOWN_TIMEOUT_MS,
  10000,
  "SHUTDOWN_TIMEOUT_MS"
);

const frontendUrl = process.env.FRONTEND_URL?.trim();

if (nodeEnv === "production" && !frontendUrl) {
  throw new Error("FRONTEND_URL is required in production.");
}

if (process.env.REDIS_URL) {
  const redisUrl = process.env.REDIS_URL.trim();

  if (!/^rediss?:\/\/.+/i.test(redisUrl)) {
    throw new Error("REDIS_URL must be a valid redis:// or rediss:// URL.");
  }
}

const logLevel = process.env.LOG_LEVEL || "info";

if (!VALID_LOG_LEVELS.includes(logLevel)) {
  throw new Error(
    `LOG_LEVEL must be one of: ${VALID_LOG_LEVELS.join(", ")}`
  );
}

const razorpayKey = process.env.RAZORPAY_KEY_ID?.trim();
const razorpaySecret = process.env.RAZORPAY_SECRET?.trim();

if (nodeEnv === "production") {
  if (!razorpayKey) {
    throw new Error("RAZORPAY_KEY_ID is required in production.");
  }

  if (!razorpaySecret) {
    throw new Error("RAZORPAY_SECRET is required in production.");
  }
}

module.exports = {
  nodeEnv,
  port,
  mongoUri,

  jwtSecret,
  jwtExpiresIn,
  jwtAlgorithm: "HS256",
  jwtIssuer: process.env.JWT_ISSUER || "juniorchamps-api",
  jwtAudience: process.env.JWT_AUDIENCE || "juniorchamps-client",

  authFailedWindowSeconds: readPositiveInteger(
    process.env.AUTH_FAILED_WINDOW_SECONDS,
    15 * 60,
    "AUTH_FAILED_WINDOW_SECONDS"
  ),

  authFailedThreshold: readPositiveInteger(
    process.env.AUTH_FAILED_THRESHOLD,
    5,
    "AUTH_FAILED_THRESHOLD"
  ),

  authProtectionCooldownSeconds: readPositiveInteger(
    process.env.AUTH_PROTECTION_COOLDOWN_SECONDS,
    5 * 60,
    "AUTH_PROTECTION_COOLDOWN_SECONDS"
  ),

  shutdownTimeoutMs,

  frontendUrl: frontendUrl || "http://localhost:5173",
  redisUrl: process.env.REDIS_URL,
  logLevel,

  razorpayKey,
  razorpaySecret,
};
