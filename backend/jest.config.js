module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  testMatch: [
    "<rootDir>/tests/security.test.js"
  ],
  moduleNameMapper: {
    "^uuid$": "<rootDir>/tests/mocks/uuid.js"
  }
};
