const logger = require("../config/logger");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // 1. Winston Logger error logging
  logger.error(
    `${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );

  if (err.stack) {
    logger.error(err.stack);
  }

  // 🟢 2. Mongoose Schema Validation Error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // 🟡 3. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";

    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // 🔵 4. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}`,
    });
  }

  // 🔴 5. General Fallback Error Response
  const statusCode =
    err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  const response = {
    success: false,
    message: err.message || "Server Error",
  };

  // Stack trace sirf non-production environment mein bhejenge
  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;