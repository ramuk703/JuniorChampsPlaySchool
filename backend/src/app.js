const express = require("express");
const path = require("path");

const { swaggerUi, swaggerSpec } = require("./docs/swagger");

const configureMiddleware = require("./config/middleware");
const configureRoutes = require("./config/routes");

const errorHandler = require("./middleware/error.Middleware");

const app = express();

app.set("trust proxy", 1);

configureMiddleware(app);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Junior Champ's Play School API Running",
    version: "1.0.0",
  });
});

configureRoutes(app);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
