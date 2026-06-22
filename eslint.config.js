const eslintPluginPrettier = require('eslint-config-prettier');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        node: true,
      },
    },
  },
  {
    files: ['**/*.js'],
  },
  {
    ignores: ['node_modules/', 'coverage/', 'dist/', 'build/', 'data/', '*.log'],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-debugger': 'error',
    },
  },
  eslintPluginPrettier,
];
