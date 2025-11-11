module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(aws-cdk-lib|@aws-cdk|constructs|@aws-sdk|@smithy)/)',
  ],
  collectCoverageFrom: [
    '<rootDir>/lib/**/*.ts',
    '<rootDir>/lib/**/*.mjs',
    '<rootDir>/lib/**/*.js',
    '!<rootDir>/bin/**/*.ts',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/**/*.test.ts',
    '!<rootDir>/**/*.test.js',
    '!<rootDir>/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testTimeout: 30000,
  silent: false,
  verbose: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        allowJs: true,
        esModuleInterop: true
      }
    }
  }
};