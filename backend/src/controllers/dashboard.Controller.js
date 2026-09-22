const asyncHandler = require("express-async-handler");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

// 🟢 Cache Imports
const cacheService = require("../services/cache.service");
const redisKeys = require("../constants/redisKeys");
const cacheTtl = require("../constants/cacheTtl");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  // cacheService.remember() handle karega: Cache check, DB fallback aur Redis set
  const result = await cacheService.remember(
    redisKeys.dashboardStats(),
    async () => {
      const [
        totalTeachers,
        activeTeachers,
        inactiveTeachers,
        totalStudents,
        activeStudents,
        inactiveStudents,
      ] = await Promise.all([
        Teacher.countDocuments({
          deletedAt: null,
        }),
        Teacher.countDocuments({
          status: "Active",
          deletedAt: null,
        }),
        Teacher.countDocuments({
          status: "Inactive",
          deletedAt: null,
        }),
        Student.countDocuments({
          deletedAt: null,
        }),
        Student.countDocuments({
          status: "Active",
          deletedAt: null,
        }),
        Student.countDocuments({
          status: "Inactive",
          deletedAt: null,
        }),
      ]);

      return {
        totalTeachers,
        activeTeachers,
        inactiveTeachers,
        totalStudents,
        activeStudents,
        inactiveStudents,
      };
    },
    cacheTtl.DASHBOARD_STATS // 60s TTL from constants
  );

  return res.status(200).json({
    success: true,
    source: result.source, // Automatically "CACHE" or "DATABASE"
    data: result.data,
  });
});
