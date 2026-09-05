// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // These React Compiler-era rules are noisy for our data-fetching hooks
      // (useEffect calling an async refresh is idiomatic here). Keep them as
      // warnings so real errors stay visible.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react/no-unescaped-entities": "off",
    },
  },
]);
