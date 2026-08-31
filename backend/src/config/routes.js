module.exports = (app) => {
  app.use("/api/v1/auth", require("../routes/auth.Routes"));
  app.use("/api/v1/students", require("../routes/student.Routes"));
  app.use("/api/v1/teachers", require("../routes/teacher.Routes"));
  app.use("/api/v1/attendance", require("../routes/attendance.Routes"));
  app.use("/api/v1/fees", require("../routes/fee.Routes"));
  app.use("/api/v1/parents", require("../routes/parent.Routes"));

  // 👇 REDIS ROUTE HERE 👇
  app.use("/api/v1/redis", require("../routes/redis.Routes"));

  app.get(
    "/api/v1/dashboard/stats",
    require("../controllers/dashboard.Controller").getDashboardStats
  );

  app.get(
    "/api/v1/export/teachers",
    require("../controllers/teacher.Controller").exportTeachersToExcel
  );
};
