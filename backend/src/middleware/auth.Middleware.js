const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      // Integrity Check: Ensure user exists in database
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User account not found",
        });
      }

      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }
  } catch {
    res.status(401).json({
      success: false,
      message: "Token failed",
    });
  }
};

module.exports = { protect };