const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  jwtSecret,
  jwtExpiresIn,
  jwtAlgorithm,
  jwtIssuer,
  jwtAudience,
} = require("../config/env");

const generateToken = (id, role, tokenVersion) => {
  return jwt.sign(
    { id, role, tokenVersion },
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