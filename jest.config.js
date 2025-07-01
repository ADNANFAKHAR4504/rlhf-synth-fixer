module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test", "<rootDir>/lib", "<rootDir>/bin"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  collectCoverageFrom: [
    "<rootDir>/lib/**/*.ts",
    "!<rootDir>/lib/**/*.d.ts",
    "!<rootDir>/lib/index.ts",
    "!<rootDir>/lib/cli.ts",
    "!<rootDir>/lib/utils/*.ts",
  ],
  coverageReporters: ["text", "lcov"],
  silent: false,
  verbose: true,
};
