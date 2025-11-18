export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'test/**/*.mjs',
    '!test/**/*.int.test.mjs',
    '!**/node_modules/**',
  ],
  moduleFileExtensions: ['js', 'mjs', 'json'],
  testMatch: [
    '**/test/**/*.unit.test.mjs',
    '**/test/**/*.unit.test.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/archive/',
    '/local/',
  ],
  modulePathIgnorePatterns: [
    '/archive/',
    '/local/',
  ],
  transform: {},
  coverageReporters: ['text', 'lcov', 'json-summary'],
};
