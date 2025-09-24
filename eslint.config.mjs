// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import pluginPromise from "eslint-plugin-promise";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".changeset/**",
      "coverage/**",
      "eslint.config.mjs",
    ],
  },

  // ✅ 리졸버는 전역 settings 한 번만
  {
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          project: ["./tsconfig.json"], // 모노레포면 여러 개 나열
          alwaysTryTypes: true,
        }),
      ],
    },
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2024 },
    },
    plugins: {
      promise: pluginPromise,
      "unused-imports": pluginUnusedImports,
      "import-x": importX,
    },
    settings: {
      "import-x/resolver": { typescript: true, node: true },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/catch-or-return": [
        "error",
        { allowFinally: true, terminationMethod: ["catch", "finally"] },
      ],
      "unused-imports/no-unused-imports": "error",
      "import-x/order": [
        "warn",
        {
          groups: [
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index"],
          ],
          "newlines-between": "always",
        },
      ],
    },
  },

  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["**/*.{ts,tsx}"],
  })),

  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ...c.languageOptions,
      parserOptions: {
        ...(c.languageOptions?.parserOptions ?? {}),
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      promise: pluginPromise,
      "unused-imports": pluginUnusedImports,
      "import-x": importX,
    },

    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/catch-or-return": [
        "error",
        { allowFinally: true, terminationMethod: ["catch", "finally"] },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreIIFE: true },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "unused-imports/no-unused-imports": "error",
      "import-x/order": [
        "warn",
        {
          groups: [
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index"],
          ],
          "newlines-between": "always",
        },
      ],
    },
  },

  prettier,
];
