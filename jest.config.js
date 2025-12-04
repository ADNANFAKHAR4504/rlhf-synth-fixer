module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.mjs', '**/*.py'],
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    // Transform JS files (so ESM syntax in some node_modules can be transpiled)
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // allow transforming some packages that ship ESM (including kubernetes client and its deps)
    'node_modules/(?!(aws-cdk-lib|@aws-cdk|constructs|@aws-sdk|@smithy|@kubernetes/client-node|openid-client|oauth4webapi|jose)/)',
  ],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/lambda/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 100,
      lines: 97,
      statements: 97,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          moduleResolution: 'node',
          esModuleInterop: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  testTimeout: 30000,
};
