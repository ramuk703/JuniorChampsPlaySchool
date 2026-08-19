const redisService = require("../services/redis.service");
const redisKeys = require("../constants/redisKeys");
const logger = require("../config/logger");

const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const asyncHandler = require("express-async-handler");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const cacheKey = redisKeys.dashboardStats();

  // 1. PEHLE REDIS CACHE MEIN CHECK KAREIN
  const cachedStats = await redisService.get(cacheKey);

  if (cachedStats) {
    logger.info(`Dashboard cache HIT - key: ${cacheKey}`);
    return res.status(200).json({
      success: true,
      source: "cache",
      data: cachedStats,
    });
  }

  // 2. CACHE MISS -> MONGODB SE QUERY KAREIN
  logger.info(`Dashboard cache MISS - key: ${cacheKey}`);

  const totalTeachers = await Teacher.countDocuments();
  const totalStudents = await Student.countDocuments();
  const activeTeachers = await Teacher.countDocuments({
    status: "Active",
  });

  const statsData = {
    totalTeachers,
    activeTeachers,
    totalStudents,
  };

  // 3. MONGODB SE AAYA DATA REDIS MEIN 60 SECONDS KE LIYE SAVE KAREIN
  await redisService.set(cacheKey, statsData, 60);

  res.status(200).json({
    success: true,
    source: "database",
    data: statsData,
  });
});
