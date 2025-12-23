module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // Prettier formatting
    'prettier/prettier': 'error',

    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-unused-vars': 'off', // Turn off base rule as it can report incorrect errors

    // Import rules - be more lenient for CDK projects
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/test/**/*.ts',
          '**/tests/**/*.ts',
          'jest.config.js',
          '**/*.config.js',
          '**/*.config.ts',
          '@types/**',
        ],
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],

    // CDK specific adjustments
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'no-new': 'off', // CDK uses 'new' for constructs
  },
  ignorePatterns: [
    'node_modules/',
    'cdk.out/',
    'coverage/',
    '*.js',
    '*.d.ts',
    'worktree/',
    'test/',
    'bin/',
    'cli/',
    '.claude/',
  ],
};