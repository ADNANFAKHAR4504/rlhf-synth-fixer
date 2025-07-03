const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierPlugin = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettierPlugin,
      import: importPlugin,
    },
    rules: {
      // Prettier
      'prettier/prettier': 'error',

      // TypeScript specific
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Quote preferences
      quotes: ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],

      // Import rules
      'import/prefer-default-export': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/*.test.ts', 'test/**/*.ts'] },
      ],

      // General rules
      'no-console': 'off', // Allow console in CDK code
      'class-methods-use-this': 'off',
      'no-new': 'off', // CDK constructs often need 'new' without assignment
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'cdk.out/**',
      'coverage/**',
      '**/*.js',
      '**/*.d.ts',
      '**/*.test.ts', // Exclude test files from linting
    ],
  },
];
