// Sahi paths: Kyunki controllers folder 'src' ke andar hai, toh ek folder peeche (src/) ja kar models aur utils milenge
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// 1. Register User Function
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

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
      role,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
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
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user,
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

// 4. Sabhi functions ko perfectly export karna
module.exports = {
  registerUser,
  loginUser,
  getProfile,
};
