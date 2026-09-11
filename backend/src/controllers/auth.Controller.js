// Sahi paths: Kyunki controllers folder 'src' ke andar hai, toh ek folder peeche (src/) ja kar models aur utils milenge
const auditLog = require("../utils/auditLog");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// 1. Register User Function
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "parent",
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role, user.tokenVersion),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Login User Function
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    auditLog({
      req,
      action: "LOGIN",
      resource: "Authentication",
      details: {
        email: user.email,
      },
    });

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      success: true,
      token: generateToken(user._id, user.role, user.tokenVersion),
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Get Profile Function
const getProfile = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

// 4. Change User Password Function (Increment tokenVersion to invalidate old tokens)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await user.matchPassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = newPassword;
    user.tokenVersion += 1; // Invalidate all previous sessions
    await user.save();

    auditLog({
      req,
      action: "CHANGE_PASSWORD",
      resource: "Authentication",
      resourceId: user._id,
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Logout User (Invalidate all active sessions)
const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    user.tokenVersion += 1;
    await user.save();

    auditLog({
      req,
      action: "LOGOUT",
      resource: "Authentication",
      resourceId: user._id,
    });

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Sabhi functions ko perfectly export karna (including logoutUser)
module.exports = {
  registerUser,
  loginUser,
  getProfile,
  changePassword,
  logoutUser,
};