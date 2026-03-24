const importPlugin = require("eslint-plugin-import");
const reactPlugin = require("eslint-plugin-react");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [".next/", "node_modules/", "dist/", "build/"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2025,
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      react: reactPlugin,
    },
    rules: {
      "import/order": [
        "warn",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
        },
      ],
      "react/jsx-sort-props": [
        "warn",
        {
          ignoreCase: true,
          callbacksLast: true,
          shorthandFirst: true,
          reservedFirst: true,
        },
      ],

      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
