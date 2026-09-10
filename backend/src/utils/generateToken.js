const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  jwtSecret,
  jwtExpiresIn,
  jwtAlgorithm,
  jwtIssuer,
  jwtAudience,
} = require("../config/env");

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    jwtSecret,
    {
      expiresIn: jwtExpiresIn,
      algorithm: jwtAlgorithm,
      issuer: jwtIssuer,
      audience: jwtAudience,
      jwtid: crypto.randomUUID(),
    }
  );
};

module.exports = generateToken;