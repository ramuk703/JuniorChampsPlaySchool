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
      const totalTeachers = await Teacher.countDocuments({ deletedAt: null });
      const totalStudents = await Student.countDocuments({ deletedAt: null });
      const activeTeachers = await Teacher.countDocuments({
        status: "Active",
        deletedAt: null,
      });

      return {
        totalTeachers,
        activeTeachers,
        totalStudents,
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
