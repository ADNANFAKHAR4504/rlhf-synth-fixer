const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierPlugin = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  // Separate configuration for templates folder (must come first)
  {
    files: ['templates/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        // Don't use project-specific TypeScript config for templates
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

      // Basic TypeScript rules without project-specific parsing
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

      // Import rules (simplified for templates)
      'import/prefer-default-export': 'off',
      'import/no-unresolved': 'off', // Disable for templates since they might not have proper resolution

      // General rules
      'no-console': 'off',
      'class-methods-use-this': 'off',
      'no-new': 'off',
    },
  },
  // Main project configuration (excludes templates)
  {
    files: ['**/*.ts'],
    ignores: ['templates/**/*.ts', '.claude/**/*.ts'],
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
        {
          devDependencies: [
            '**/*.test.ts',
            'test/**/*.ts',
            'lib/lambda/**/*.ts',
          ],
        },
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
      'archive/**',
      'archive-localstack/**', // Exclude archive-localstack from linting
      'subcategory-references/**', // Exclude reference files from linting
      'lambda/**', // Exclude lambda folder from linting
      'cli/**', // Exclude CLI tooling scripts from linting
      'bin/**', // Exclude bin folder from linting (excluded from tsconfig.json)
      '.claude/**', // Exclude .claude folder (templates, scripts, docs) from linting
      '**/*.js',
      '**/*.d.ts',
      '**/*.test.ts', // Exclude test files from linting
      '.gen/**',
    ],
  },
];
