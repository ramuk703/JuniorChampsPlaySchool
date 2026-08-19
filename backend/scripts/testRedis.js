const { connectRedis, redisClient } = require("../src/config/redis");
const redisService = require("../src/services/redis.service");

const testRedis = async () => {
  try {
    console.log("Connecting to Redis...");

    await connectRedis();

    console.log("Redis connected.");

    const testData = {
      name: "Junior Champs",
      type: "Play School",
      active: true,
    };

    console.log("Setting test data...");

    await redisService.set("test:school", testData, 60);

    console.log("Getting test data...");

    const result = await redisService.get("test:school");

    console.log("Redis result:");
    console.log(result);

    console.log("Checking key...");

    const exists = await redisService.exists("test:school");

    console.log("Key exists:", exists);

    console.log("Deleting key...");

    await redisService.delete("test:school");

    console.log("Checking key after delete...");

    const existsAfterDelete = await redisService.exists("test:school");

    console.log("Key exists after delete:", existsAfterDelete);

    console.log("Redis service test completed.");

    await redisClient.quit();

    process.exit(0);
  } catch (error) {
    console.error("Redis test failed:", error.message);

    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    process.exit(1);
  }
};

testRedis();
