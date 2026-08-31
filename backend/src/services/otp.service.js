const crypto = require("crypto");

const redisService = require("./redis.service");
const redisKeys = require("../constants/redisKeys");
const cacheTtl = require("../constants/cacheTtl");

/**
 * Generates a cryptographically secure 6-digit OTP
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const otpService = {
  /**
   * Create and store a temporary single-use OTP
   */
  async create(identifier, purpose) {
    const otp = generateOtp();

    const key = redisKeys.otp(purpose, identifier);

    await redisService.setTemporary(key, otp, cacheTtl.OTP);

    // Security Rule: Never log OTP values anywhere
    return otp;
  },

  /**
   * Verify and consume OTP (Single-use atomic operation)
   */
  async verify(identifier, purpose, enteredOtp) {
    if (!enteredOtp) {
      return false;
    }

    const key = redisKeys.otp(purpose, identifier);

    const storedOtp = await redisService.getAndDelete(key);

    if (!storedOtp) {
      return false;
    }

    // Convert both to String to avoid Type-Mismatch bug
    const strStored = String(storedOtp);
    const strEntered = String(enteredOtp);

    // Buffer conversion for Timing-Safe comparison
    const a = Buffer.from(strStored);
    const b = Buffer.from(strEntered);

    if (a.length !== b.length) {
      return false;
    }

    // Prevents Timing Attacks
    return crypto.timingSafeEqual(a, b);
  },

  /**
   * Manually invalidate an existing OTP
   */
  async invalidate(identifier, purpose) {
    const key = redisKeys.otp(purpose, identifier);

    return redisService.delete(key);
  },
};

module.exports = otpService;
