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

// --- SMTP Validation Updated ---
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPassword = process.env.SMTP_PASSWORD?.trim();
const smtpFromName =
  process.env.SMTP_FROM_NAME?.trim() || "Junior Champ's Play School";
const smtpFromEmail = process.env.SMTP_FROM_EMAIL?.trim();
const smtpPort = readPositiveInteger(
  process.env.SMTP_PORT,
  587,
  "SMTP_PORT"
);

const smtpSecureRaw = String(
  process.env.SMTP_SECURE || "false"
).toLowerCase();

if (!["true", "false"].includes(smtpSecureRaw)) {
  throw new Error("SMTP_SECURE must be either true or false.");
}
const smtpSecure = smtpSecureRaw === "true";

const smtpConnectionTimeoutMs = readPositiveInteger(
  process.env.SMTP_CONNECTION_TIMEOUT_MS,
  10000,
  "SMTP_CONNECTION_TIMEOUT_MS"
);
const smtpGreetingTimeoutMs = readPositiveInteger(
  process.env.SMTP_GREETING_TIMEOUT_MS,
  10000,
  "SMTP_GREETING_TIMEOUT_MS"
);
const smtpSocketTimeoutMs = readPositiveInteger(
  process.env.SMTP_SOCKET_TIMEOUT_MS,
  10000,
  "SMTP_SOCKET_TIMEOUT_MS"
);

if (smtpPort > 65535) {
  throw new Error("SMTP_PORT must be between 1 and 65535.");
}

const allowedSmtpPorts = [25, 465, 587, 2525];
if (!allowedSmtpPorts.includes(smtpPort)) {
  throw new Error(
    `SMTP_PORT must be one of: ${allowedSmtpPorts.join(", ")}.`
  );
}

if (smtpSecure && smtpPort !== 465) {
  throw new Error(
    "SMTP_SECURE=true requires SMTP_PORT=465."
  );
}

if (!smtpSecure && smtpPort === 465) {
  throw new Error(
    "SMTP_PORT=465 requires SMTP_SECURE=true."
  );
}

const smtpConfigured = Boolean(
  smtpHost && smtpUser && smtpPassword && smtpFromEmail
);

if (nodeEnv === "production" && !smtpConfigured) {
  throw new Error(
    "SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM_EMAIL are required in production."
  );
}

if (smtpConfigured && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpFromEmail)) {
  throw new Error("SMTP_FROM_EMAIL must be a valid email address.");
}
// ----------------------------------

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

  smtp: {
    configured: smtpConfigured,
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: smtpUser,
    password: smtpPassword,
    fromName: smtpFromName,
    fromEmail: smtpFromEmail,
    connectionTimeoutMs: smtpConnectionTimeoutMs,
    greetingTimeoutMs: smtpGreetingTimeoutMs,
    socketTimeoutMs: smtpSocketTimeoutMs,
  },
};