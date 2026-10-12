const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Parent = require("../models/Parent");
const {
  jwtSecret,
  jwtAlgorithm,
  jwtIssuer,
  jwtAudience,
} = require("../config/env");

const extractToken = (req) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const [, token] = authorization.split(" ");

  return token || null;
};

const verifyToken = (token) => {
  return jwt.verify(token, jwtSecret, {
    algorithms: [jwtAlgorithm],
    issuer: jwtIssuer,
    audience: jwtAudience,
  });
};

// Authenticate User accounts
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const decoded = verifyToken(token);

    // Verify tokenVersion claim exists and is valid
    if (
      !Number.isInteger(decoded.tokenVersion) ||
      decoded.tokenVersion < 0
    ) {
      return res.status(401).json({
        success: false,
        message: "Token failed",
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    // Check if token's version matches database version (Invalidate if password changed)
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Token has been invalidated",
      });
    }

    req.user = user;

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token failed",
    });
  }
};

// Authenticate Parent accounts
const protectParent = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const decoded = verifyToken(token);

    // Verify tokenVersion claim exists and is valid
    if (
      !Number.isInteger(decoded.tokenVersion) ||
      decoded.tokenVersion < 0
    ) {
      return res.status(401).json({
        success: false,
        message: "Token failed",
      });
    }

    const parent = await Parent.findById(decoded.id).select("-password");

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: "Parent account not found",
      });
    }

    // Check if token's version matches database version (Invalidate if password changed)
    if (parent.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Token has been invalidated",
      });
    }

    req.user = {
      ...parent.toObject(),
      role: "parent",
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token failed",
    });
  }
};


// Restrict a valid User token to a linked, active teacher account.
// Teacher identity is derived from the authenticated User, never request input.
const teacherOnly = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "teacher" || !req.user.teacherId) {
      return res.status(403).json({ success: false, message: "Teacher access only" });
    }

    const Teacher = require("../models/Teacher");
    const teacher = await Teacher.findOne({
      _id: req.user.teacherId,
      deletedAt: null,
      status: "Active",
    }).select("-salary");

    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: "Teacher profile is inactive or unavailable",
      });
    }

    req.teacher = teacher;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  protect,
  protectParent,
  teacherOnly,
};