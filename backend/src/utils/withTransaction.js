const mongoose = require("mongoose");
const logger = require("../config/logger");

const withTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    });

    return result;
  } catch (error) {
    logger.error(`MongoDB transaction failed: ${error.message}`);
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = withTransaction;
