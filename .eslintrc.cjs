/**
 * This is intended to be a basic starting point for linting in your app.
 * It relies on recommended configs out of the box for simplicity, but you can
 * and should modify this configuration to best suit your team's needs.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },

  // Base config
  extends: ["eslint:recommended"],
  rules: {
    "prettier/prettier": "error",
  },

  overrides: [
    // React
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: ["react", "jsx-a11y", "simple-import-sort"],
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
              [
                "^\\u0000",
                "^(react|react-dom)",
                "^node:",
                "^@?\\w",
                "^",
                "^\\.",
              ],
            ],
          },
        ],
        "simple-import-sort/exports": "warn",
        "import/no-duplicates": ["warn", { "prefer-inline": true }],
      },
      extends: [
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
        "plugin:jsx-a11y/recommended",
        "plugin:prettier/recommended",
      ],
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
            // TODO: put packages into packages folder and fix monorepo setup
            project: ".",
          },
        },
      },
    },

    // Typescript
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint", "import"],
      parser: "@typescript-eslint/parser",
      settings: {
        // "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            debug: true,
            alwaysTryTypes: true,
            // TODO: put packages into packages folder and fix monorepo setup
            project: ".",
          },
        },
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "plugin:prettier/recommended",
      ],
    },

    // Node
    {
      files: [".eslintrc.cjs", "server.js", "other/sentry-create-release.js"],
      env: {
        node: true,
      },
    },
  ],
}
