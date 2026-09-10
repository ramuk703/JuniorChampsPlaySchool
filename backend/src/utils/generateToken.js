const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn, jwtAlgorithm } = require("../config/env");

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    jwtSecret,
    {
      expiresIn: jwtExpiresIn,
      algorithm: jwtAlgorithm,
    }
  );
};

module.exports = generateToken;
