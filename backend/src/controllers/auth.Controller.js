const crypto = require("crypto");
// Sahi paths: Kyunki controllers folder 'src' ke andar hai, toh ek folder peeche (src/) ja kar models aur utils milenge
const auditLog = require("../utils/auditLog");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const authProtection = require("../services/authProtection.service");
const emailService = require("../services/email.service");
const { welcomeEmail, passwordResetEmail } = require("../templates/email");

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

    // Send Welcome Email
    const welcome = welcomeEmail({
      name: user.name,
      email: user.email,
    });

    try {
      await emailService.sendEmail({
        to: user.email,
        subject: welcome.subject,
        text: welcome.text,
        html: welcome.html,
      });
    } catch (emailError) {
      // Email delivery must not make successful registration fail.
      auditLog({
        req,
        action: "EMAIL_DELIVERY_FAILED",
        resource: "Authentication",
        resourceId: user._id,
      });
    }

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

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const sourceIp = req.ip || req.socket?.remoteAddress || "unknown";

    // Check protection status using email + IP combination
    const protectionStatus = await authProtection.getProtectionStatus(
      "user",
      normalizedEmail,
      sourceIp
    );

    if (protectionStatus.blocked) {
      if (protectionStatus.retryAfter > 0) {
        res.set(
          "Retry-After",
          String(protectionStatus.retryAfter)
        );
      }

      return res.status(429).json({
        success: false,
        message:
          "Too many failed login attempts. Please try again later.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      await authProtection.recordFailure(
        "user",
        normalizedEmail,
        sourceIp
      );

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      await authProtection.recordFailure(
        "user",
        normalizedEmail,
        sourceIp
      );

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Clear failures on successful login
    await authProtection.clearFailures(
      "user",
      normalizedEmail,
      sourceIp
    );

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

// 5. Request Password Reset
const forgotPassword = async (req, res) => {
  const genericResponse = {
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };

  try {
    const normalizedEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Do not reveal whether the email exists.
    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires =
      new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;

    const email = passwordResetEmail({
      name: user.name,
      resetUrl,
      expiresIn: "15 minutes",
    });

    try {
      await emailService.sendEmail({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
    } catch (emailError) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      auditLog({
        req,
        action: "PASSWORD_RESET_EMAIL_FAILED",
        resource: "Authentication",
        resourceId: user._id,
      });

      return res.json(genericResponse);
    }

    auditLog({
      req,
      action: "PASSWORD_RESET_REQUEST",
      resource: "Authentication",
      resourceId: user._id,
    });

    return res.json(genericResponse);
  } catch (error) {
    return res.json(genericResponse);
  }
};


// 6. Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    user.password = newPassword;

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Invalidate all existing sessions.
    user.tokenVersion += 1;

    await user.save();

    auditLog({
      req,
      action: "PASSWORD_RESET",
      resource: "Authentication",
      resourceId: user._id,
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
};