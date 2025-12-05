module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'cdk.out/',
    'coverage/',
    '**/*.js',
    '**/*.d.ts',
    'worktree/',
  ],
};
