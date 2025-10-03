module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.mjs'],
  moduleFileExtensions: ['js', 'mjs', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/',
  ],
  collectCoverageFrom: [
    '<rootDir>/lib/**/*.js',
    '<rootDir>/lib/**/*.mjs',
    '<rootDir>/lib/**/*.py',
    '!<rootDir>/bin/**',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/**/*.test.*',
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