/**
 * Root ESLint config for this repo (TypeScript + Node).
 * - Uses Airbnb base + TypeScript + Prettier
 * - Ignores archived and generated folders so CI doesn't scan them
 */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  ignorePatterns: [
    // large or generated directories
    'node_modules/',
    'archive/',
    'cdk.out/',
    'cdktf.out/',
    'coverage/',
    'dist/',
    'worktree/',
    'templates/',
    // generated artifacts
    '**/*.d.ts',
    'lib/*.yml',
    'lib/*.yaml',
    'lib/*.json',
    // CI/meta files
    '*.config.js',
  ],
  overrides: [
    {
      files: ['*.js', '*.cjs'],
      parser: null,
      extends: ['airbnb-base', 'plugin:prettier/recommended'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['test/**/*.ts', '**/*.test.ts'],
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off',
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
    {
      files: ['bin/**/*.ts', 'cli/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  rules: {
    'prettier/prettier': 'error',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
      },
    ],
    // NodeNext + TS resolver can make this noisy; TS handles it
    'import/no-unresolved': 'off',
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
  },
};
