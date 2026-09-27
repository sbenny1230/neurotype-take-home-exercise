import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      prettier,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    // Vitest fixtures must destructure their first argument, even when they use nothing from it.
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'no-empty-pattern': 'off' },
  },
])
