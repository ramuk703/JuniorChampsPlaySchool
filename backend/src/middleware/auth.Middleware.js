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

      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }
  } catch {
    // यहाँ से (error) हटा दिया गया है क्योंकि यह कहीं यूज़ नहीं हो रहा था
    res.status(401).json({
      success: false,
      message: "Token failed",
    });
  }
};

module.exports = { protect };
