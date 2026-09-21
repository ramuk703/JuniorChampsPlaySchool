const helmet = require("helmet");
const cors = require("cors");
const corsOptions = require("./cors");
const compression = require("compression");
const hpp = require("hpp");
const morgan = require("morgan");
const logger = require("./logger");
const express = require("express");
const sanitizeMiddleware = require("../middleware/sanitize.Middleware");
const { globalApiLimiter } = require("./rateLimiter");
// const requestLogger = require("../middleware/request.Logger");
const requestIdMiddleware = require("../middleware/requestId.middleware");

module.exports = (app) => {
  // 1. Security Headers
  app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

  // 3. CORS Settings
  app.use(cors(corsOptions));

  // 4. Response Compression
  app.use(compression());

  // 5. Prevent HTTP Parameter Pollution
  app.use(hpp());

  // 6. Request Body Parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb", parameterLimit: 100 }));

  // 6.5 request ID Middleware
  app.use(requestIdMiddleware);

  // 7. Mongo Sanitize Middleware
  app.use(sanitizeMiddleware);

  // 8. Request Logging
  app.use(
    morgan(
      ":remote-addr :method :url :status :response-time ms :res[x-request-id]",
      {
        stream: logger.stream,
      }
    )
  );
  // app.use(requestLogger);

  // 9. Apply Global Rate Limiting on API Routes
  app.use("/api/", globalApiLimiter);
};
