const otpService = require("../services/otp.service");
const { redisClient } = require("../config/redis");

const test = async () => {
  try {
    const identifier = "test@example.com";
    const purpose = "login";

    const otp = await otpService.create(identifier, purpose);
    console.log("OTP created successfully.");

    const valid = await otpService.verify(identifier, purpose, otp);
    console.log("First verification:", valid);

    const reused = await otpService.verify(identifier, purpose, otp);
    console.log("Second verification:", reused);

    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
    process.exit(0);
  } catch (error) {
    console.error("OTP test failed:", error.message);
    process.exit(1);
  }
};

test();
