module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.test.js', '**/*.py'],
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    // Transform JS files (so ESM syntax in some node_modules can be transpiled)
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // allow transforming some packages that ship ESM (including kubernetes client and its deps)
    'node_modules/(?!(aws-cdk-lib|@aws-cdk|constructs|@aws-sdk|@smithy|@kubernetes/client-node|openid-client|oauth4webapi|jose)/)',
  ],
  collectCoverageFrom: [
    '<rootDir>/lib/**/*.ts',
    '<rootDir>/lib/**/*.js',
    '<rootDir>/lib/**/*.json',
    '!<rootDir>/bin/**/*.ts',
    '!<rootDir>/lib/lambda/**',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/**/*.test.ts',
    '!<rootDir>/**/*.test.js',
    '!<rootDir>/lib/PROMPT.md',
    '!<rootDir>/lib/MODEL_RESPONSE.md',
    '!<rootDir>/lib/README.md',
    '!<rootDir>/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testTimeout: 60000,
  silent: false,
  verbose: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
      },
    },
  },
};
