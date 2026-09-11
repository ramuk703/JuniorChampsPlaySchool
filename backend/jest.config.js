module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    "^uuid$": "<rootDir>/tests/mocks/uuid.js"
  }
};
