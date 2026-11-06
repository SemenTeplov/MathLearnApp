// ============================================
// ESLINT.CONFIG.JS — линтер проекта (1.9.0, flat config)
// ============================================
// ESLint 10 + typescript-eslint (recommended, без type-aware правил — быстрый прогон)
// + eslint-plugin-react-hooks (правила хуков). Prettier отвечает за форматирование,
// поэтому стилевые правила ESLint не включаются: они дублировали бы `npm run format`.

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['node_modules/**', 'dist/**', 'coverage/**', '.idea/**']
    },

    js.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser },
            parserOptions: { ecmaFeatures: { jsx: true } }
        },
        rules: {
            // Параметры контракта, которые не нужны реализации, помечаются `_`.
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }
            ]
        }
    },

    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error'
        }
    },

    {
        files: ['test/**/*.{ts,tsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node }
        }
    },

    {
        files: ['scripts/**/*.mjs', '*.config.{js,ts}', 'eslint.config.js', 'vite.config.ts', 'vitest.config.ts'],
        languageOptions: {
            globals: { ...globals.node }
        }
    }
];
