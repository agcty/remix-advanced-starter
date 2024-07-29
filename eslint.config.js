import eslint from "@eslint/js"
import globals from "globals"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import jsxA11y from "eslint-plugin-jsx-a11y"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import tseslint from "typescript-eslint"
import importPlugin from "eslint-plugin-import"
import prettier from "eslint-plugin-prettier/recommended"

export default [
  eslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    files: ["/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      "jsx-a11y": jsxA11y,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: true,
          fixStyle: "inline-type-imports",
        },
      ],
      "react/no-unescaped-entities": "warn",
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            ["^\u0000", "^(react|react-dom)", "^node:", "^@?w", "^", "^."],
          ],
        },
      ],
      "simple-import-sort/exports": "warn",
      "import/no-duplicates": ["warn", { "prefer-inline": true }],
    },
    settings: {
      react: {
        version: "detect",
      },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
      "import/resolver": {
        typescript: {
          debug: true,
          alwaysTryTypes: true,
          project: ".",
        },
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...tseslint.config(tseslint.configs.recommended, {
      plugins: {
        "@typescript-eslint": tseslint.plugin,
        import: importPlugin,
      },
      languageOptions: {
        parser: tseslint.parser,
      },
      settings: {
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            debug: true,
            alwaysTryTypes: true,
            project: ".",
          },
        },
      },
    }),
  },
  {
    files: ["eslint.config.js", "server.js", "other/sentry-create-release.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  prettier,
]
