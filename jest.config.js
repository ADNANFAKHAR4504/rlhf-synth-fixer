module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    '<rootDir>/lib/**/*.ts',
    '!<rootDir>/bin/**/*.ts',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/**/*.js',
    '!<rootDir>/**/*.test.ts',
    '!<rootDir>/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  silent: false,
  verbose: true,
  // Configuration for integration tests
  testTimeout: 30000, // 30 seconds timeout for integration tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  // Handle AWS SDK and other external dependencies
  moduleNameMapper: {
    '^@aws-sdk/(.*)$': '<rootDir>/node_modules/@aws-sdk/$1',
  },
  // Environment variables for tests
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
};
