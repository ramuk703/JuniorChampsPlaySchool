const dotenv = require("dotenv");
dotenv.config();

const { connectRedis } = require("./src/config/redis");
const app = require("./src/app");
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
    // Fix 2: HTTP Server ko pehle start karo taaki healthcheck fail na ho
    server = app.listen(PORT, "0.0.0.0", () => {
      logger.info("Server running on port " + PORT);
    });

    // Connections bad me establish karo
    await connectDB();
    await connectRedis();
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
