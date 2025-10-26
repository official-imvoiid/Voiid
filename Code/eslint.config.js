import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^(motion|[A-Z_])' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // ESLint config specifically for tailwind.config.js
    files: ['tailwind.config.js'],
    env: {
      node: true,  // Enable Node.js environment
    },
    rules: {
      // Disable 'no-undef' for this file since `module` is a Node.js global
      'no-undef': 'off',
    },
  },
  {
    // ESLint config for server.js (Node environment)
    files: ['server.js'],
    env: {
      node: true,
    },
    rules: {
      // Disable 'no-undef' so that Node globals like require and process are allowed
      'no-undef': 'off',
    },
  },
];
