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

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
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

    const parent = await Parent.findById(decoded.id).select("-password");

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: "Parent account not found",
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

module.exports = {
  protect,
  protectParent,
};