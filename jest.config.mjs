export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/lib'],
  testPathIgnorePatterns: ['/node_modules/', '/archive/', '/dist/', '/build/'],
  testMatch: [
    '**/*.unit.test.mjs',
    '**/*.int.test.mjs'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  collectCoverageFrom: [
    'lib/**/*.json',
    '!lib/PROMPT.md',
    '!lib/MODEL_RESPONSE.md',
    '!lib/README.md',
    '!lib/IDEAL_RESPONSE.md',
    '!lib/MODEL_FAILURES.md'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  transform: {},
  testTimeout: 30000
};
