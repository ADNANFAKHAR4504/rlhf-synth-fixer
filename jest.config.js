module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverage: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        esModuleInterop: true,
        skipLibCheck: true,
        resolveJsonModule: true
      }
    }]
  },
  collectCoverageFrom: [
    '<rootDir>/lib/**/*.ts',
    '!<rootDir>/lib/**/*.d.ts',
    '!<rootDir>/lib/**/*.test.ts'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/archive/',
    '<rootDir>/templates/',
    '<rootDir>/cli/',
    '<rootDir>/scripts/',
    '<rootDir>/node_modules/',
    '<rootDir>/cdk.out/'
  ]
};
