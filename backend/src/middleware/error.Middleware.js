const logger = require("../config/logger"); // 1. Winston logger इंपोर्ट करें

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // 2. console.error(err) की जगह Winston logger का इस्तेमाल करें
  logger.error(
    `${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  if (err.stack) {
    logger.error(err.stack);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
