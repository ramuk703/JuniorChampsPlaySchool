const auditLogger = require("../config/auditLogger");

const SENSITIVE_KEYS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "otp",
  "secret",
  "jwt",
]);

const normalizeKey = (key) =>
  String(key).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEYS.has(normalizeKey(key))
          ? "[REDACTED]"
          : sanitizeValue(nestedValue),
      ])
    );
  }

  return value;
};

const audit = ({
  req,
  action,
  resource,
  resourceId = null,
  details = {},
}) => {
  const user = req?.user || {};

  const event = {
    timestamp: new Date().toISOString(),
    requestId: req?.requestId || null,
    userId: user.id || user._id ? String(user.id || user._id) : null,
    userRole: user.role || null,
    action,
    resource,
    resourceId: resourceId ? String(resourceId) : null,
    ip: req?.ip || req?.socket?.remoteAddress || null,
    method: req?.method || null,
    path: req?.originalUrl || req?.url || null,
    details: sanitizeValue(details),
  };

  auditLogger.info(JSON.stringify(event));

  return event;
};

module.exports = {
  audit,
  sanitizeValue,
};