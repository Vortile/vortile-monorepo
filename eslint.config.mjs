import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import turboConfig from "eslint-config-turbo/flat";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import ts from "typescript-eslint";
import preferArrow from "eslint-plugin-prefer-arrow";
import globals from "globals";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  // Global ignores MUST be a standalone object in flat config
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/build/**",
      "**/out/**",
      "**/public/**",
      "**/*.d.ts",
      "**/.git/**",
      "**/.vercel/**",
      "**/vortile-delivery.db*",
    ],
  },

  ...turboConfig,
  js.configs.recommended,
  ...ts.configs.recommended,

  // React
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],

  // Next.js and Hooks
  {
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // Prettier
  ...compat.extends("prettier"),

  // Custom Rules and Overrides
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      next: {
        rootDir: ["apps/admin/"],
      },
    },
    plugins: {
      "prefer-arrow": preferArrow,
    },
    rules: {
      // ESLint overrides
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],

      // Typescript overrides
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-object-type": "off",

      // React overrides
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/function-component-definition": [
        "warn",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],

      // Next.js overrides
      "@next/next/no-img-element": "off",

      // React hooks overrides
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Turbo overrides
      "turbo/no-undeclared-env-vars": [
        "warn",
        { allowList: ["^ENV_[A-Z]+$", "^NEXT_PUBLIC_[A-Z_]+$"] },
      ],

      // Prefer-arrow overrides
      "prefer-arrow/prefer-arrow-functions": [
        "warn",
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
        },
      ],

      "arrow-body-style": "off",
    },
  },
];

export default eslintConfig;
