module.exports = {
    env: {
      es6: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:jsdoc/recommended',
      'plugin:unicorn/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: ['tsconfig.eslint.json'],
      sourceType: 'module',
    },
    rules: {
      'unicorn/filename-case': [
        'warn',
        {
          cases: {
            camelCase: true,
            pascalCase: true,
          },
        },
      ],
    },
    plugins: ['@typescript-eslint', 'jsdoc', 'import', 'prefer-arrow', 'unicorn'],
  }
