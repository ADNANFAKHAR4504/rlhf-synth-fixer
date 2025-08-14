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
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testTimeout: 30000,
  silent: false,
  verbose: true,
};
