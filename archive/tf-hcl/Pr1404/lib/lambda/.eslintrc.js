module.exports = {
    env: {
        node: true,
        es2022: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'commonjs'
    },
    rules: {
        'no-console': 'off', // Allow console for Lambda logging
        'no-unused-vars': 'error',
        'prefer-const': 'error',
        'no-var': 'error'
    }
};