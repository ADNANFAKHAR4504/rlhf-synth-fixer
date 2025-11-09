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
        varsIgnorePattern: '^_', // Added this line
      },
    ],

    // Import rules - be more lenient for CDK projects
    // Disable completely for CDK since aws-cdk-lib and constructs should be in dependencies
    'import/no-extraneous-dependencies': 0,

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
  ],
};
