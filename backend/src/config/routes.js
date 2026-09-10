const { exportLimiter } = require("./rateLimiter");
const {
  protect,
  protectParent,
} = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");

module.exports = (app) => {
  app.use("/api/v1/auth", require("../routes/auth.Routes"));
  app.use("/api/v1/students", require("../routes/student.Routes"));
  app.use("/api/v1/teachers", require("../routes/teacher.Routes"));
  app.get(
    "/api/v1/attendance/parent/attendance",
    protectParent,
    require("../controllers/attendance.Controller").getParentAttendanceView
  );

  app.use("/api/v1/attendance", require("../routes/attendance.Routes"));
  app.use("/api/v1/fees", require("../routes/fee.Routes"));
  app.use("/api/v1/parents", require("../routes/parent.Routes"));
  app.use(
    "/api/v1/teacher-attendance",
    require("../routes/teacherAttendance.Routes")
  );

  // 👇 REDIS ROUTE HERE 👇
  app.use("/api/v1/redis", require("../routes/redis.Routes"));

  app.get(
    "/api/v1/dashboard/stats",
    protect,
    adminOnly,
    require("../controllers/dashboard.Controller").getDashboardStats
  );

  app.get(
    "/api/v1/export/teachers",
    protect,
    adminOnly,
    exportLimiter,
    require("../controllers/teacher.Controller").exportTeachersToExcel
  );
};
