module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  setupFiles: [
    "<rootDir>/tests/setup.js"
  ],
  testMatch: [
    "<rootDir>/tests/**/*.test.js"
  ],
  moduleNameMapper: {
    "^uuid$": "<rootDir>/tests/mocks/uuid.js"
  }
};
