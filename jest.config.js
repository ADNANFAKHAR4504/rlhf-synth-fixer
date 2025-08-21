module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.test.mjs'],
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(aws-cdk-lib|@aws-cdk|constructs)/)',
  ],
  collectCoverageFrom: [
    '<rootDir>/lib/**/*.ts',
    '<rootDir>/lib/**/*.mjs',
    '!<rootDir>/bin/**/*.ts',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/**/*.js',
    '!<rootDir>/**/*.test.ts',
    '!<rootDir>/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 30000,
  silent: false,
  verbose: true,
};
