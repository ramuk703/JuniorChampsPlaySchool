const dotenv = require("dotenv");
dotenv.config();

const { connectRedis } = require("./src/config/redis");
const connectDB = require("./src/config/db");
const logger = require("./src/config/logger");
const gracefulShutdown = require("./src/config/shutdown");

// Fix 1: Typo fixed (process.process -> process.env)
const PORT = process.env.PORT || 5000;

let server;

// Synchronous errors catch karne ke liye
process.on("uncaughtException", (error) => {
  logger.error("UNCAUGHT EXCEPTION: " + (error.stack || error.message));
  gracefulShutdown(server, "UNCAUGHT_EXCEPTION");
});

// Asynchronous Promise Rejections catch karne ke liye
process.on("unhandledRejection", (reason) => {
  logger.error(
    "UNHANDLED REJECTION: " + (reason?.stack || reason?.message || reason)
  );
  gracefulShutdown(server, "UNHANDLED_REJECTION");
});

const startServer = async () => {
  try {
    // Redis must be connected before loading the app because
    // Redis-backed rate limiters initialize during app import.
    await connectRedis();

    const app = require("./src/app");

    // Start HTTP server after infrastructure initialization.
    server = app.listen(PORT, "0.0.0.0", () => {
      logger.info("Server running on port " + PORT);
    });

    await connectDB();
  } catch (error) {
    logger.error("Server startup failed: " + (error.stack || error.message));
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  gracefulShutdown(server, "SIGTERM");
});

process.on("SIGINT", () => {
  gracefulShutdown(server, "SIGINT");
});

startServer();
