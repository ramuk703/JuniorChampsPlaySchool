require("dotenv").config();

const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
  try {
    const uri = new URL(mongoUri);

    // Never let Jest run against the normal development database.
    uri.pathname = "/juniorchamps_play_school_test";

    process.env.MONGODB_URI = uri.toString();
    process.env.NODE_ENV = "test";
  } catch (error) {
    throw new Error(
      `Invalid MONGODB_URI in test environment: ${error.message}`,
      { cause: error }
    );
  }
}
