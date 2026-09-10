const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("./redis");

const DEFAULTS = {
  globalWindowMs: 15 * 60 * 1000,
  globalMax: 100,
  authWindowMs: 15 * 60 * 1000,
  authMax: 10,
  registerWindowMs: 60 * 60 * 1000,
  registerMax: 5,
  sensitiveWindowMs: 15 * 60 * 1000,
  sensitiveMax: 20,
  exportWindowMs: 15 * 60 * 1000,
  exportMax: 10,
};

const readPositiveInteger = (name, fallback) => {
  const value = Number(process.env[name] || fallback);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
};

const getConfig = () => ({
  globalWindowMs: readPositiveInteger(
    "RATE_LIMIT_GLOBAL_WINDOW_MS",
    DEFAULTS.globalWindowMs
  ),
  globalMax: readPositiveInteger(
    "RATE_LIMIT_GLOBAL_MAX",
    DEFAULTS.globalMax
  ),
  authWindowMs: readPositiveInteger(
    "RATE_LIMIT_AUTH_WINDOW_MS",
    DEFAULTS.authWindowMs
  ),
  authMax: readPositiveInteger("RATE_LIMIT_AUTH_MAX", DEFAULTS.authMax),
  registerWindowMs: readPositiveInteger(
    "RATE_LIMIT_REGISTER_WINDOW_MS",
    DEFAULTS.registerWindowMs
  ),
  registerMax: readPositiveInteger(
    "RATE_LIMIT_REGISTER_MAX",
    DEFAULTS.registerMax
  ),
  sensitiveWindowMs: readPositiveInteger(
    "RATE_LIMIT_SENSITIVE_WINDOW_MS",
    DEFAULTS.sensitiveWindowMs
  ),
  sensitiveMax: readPositiveInteger(
    "RATE_LIMIT_SENSITIVE_MAX",
    DEFAULTS.sensitiveMax
  ),
  exportWindowMs: readPositiveInteger(
    "RATE_LIMIT_EXPORT_WINDOW_MS",
    DEFAULTS.exportWindowMs
  ),
  exportMax: readPositiveInteger(
    "RATE_LIMIT_EXPORT_MAX",
    DEFAULTS.exportMax
  ),
});

const getRetryAfterSeconds = (req, windowMs) => {
  const resetTime = req.rateLimit?.resetTime;

  if (resetTime instanceof Date) {
    return Math.max(
      1,
      Math.ceil((resetTime.getTime() - Date.now()) / 1000)
    );
  }

  return Math.max(1, Math.ceil(windowMs / 1000));
};

const createRedisStore = (name) =>
  new RedisStore({
    prefix: `rate-limit:${name}:`,
    sendCommand: (...args) => redisClient.sendCommand(args),
  });

const createLimiter = ({ name, windowMs, max, keyGenerator }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    passOnStoreError: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    store: createRedisStore(name),
    handler: (req, res) => {
      const retryAfter = getRetryAfterSeconds(req, windowMs);

      res.set("Retry-After", String(retryAfter));

      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter,
      });
    },
  });

const config = getConfig();

const globalApiLimiter = createLimiter({
  name: "global",
  windowMs: config.globalWindowMs,
  max: config.globalMax,
});

const authLimiter = createLimiter({
  name: "auth",
  windowMs: config.authWindowMs,
  max: config.authMax,
});

const registrationLimiter = createLimiter({
  name: "register",
  windowMs: config.registerWindowMs,
  max: config.registerMax,
});

const sensitiveLimiter = createLimiter({
  name: "sensitive",
  windowMs: config.sensitiveWindowMs,
  max: config.sensitiveMax,
  keyGenerator: (req) =>
    req.user?._id
      ? `user:${req.user._id}:ip:${ipKeyGenerator(req.ip)}`
      : `ip:${ipKeyGenerator(req.ip)}`,
});

const exportLimiter = createLimiter({
  name: "export",
  windowMs: config.exportWindowMs,
  max: config.exportMax,
  keyGenerator: (req) =>
    req.user?._id
      ? `user:${req.user._id}:ip:${ipKeyGenerator(req.ip)}`
      : `ip:${ipKeyGenerator(req.ip)}`,
});

module.exports = {
  globalApiLimiter,
  authLimiter,
  registrationLimiter,
  sensitiveLimiter,
  exportLimiter,
};
