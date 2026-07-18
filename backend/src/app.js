const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const { swaggerUi, swaggerSpec } = require("./docs/swagger");
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Junior Champs API Running",
  });
});

// Routes
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/students", require("./routes/studentRoutes"));
app.use("/api/v1/teachers", require("./routes/teacherRoutes"));
app.use("/api/v1/attendance", require("./routes/attendanceRoutes"));
app.use("/api/v1/fees", require("./routes/feeRoutes"));
app.use("/api/v1/parents", require("./routes/parentRoutes"));

app.get(
  "/api/v1/dashboard/stats",
  require("./controllers/dashboardController").getDashboardStats
);

app.get(
  "/api/v1/export/teachers",
  require("./controllers/teacherController").exportTeachersToExcel
);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// Global Error Handler
const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

module.exports = app;
