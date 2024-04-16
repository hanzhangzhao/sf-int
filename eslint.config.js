import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "module"}},
  {ignores: ["bin/", "node_modules/", "eslint.config.js", "jest.config.js", "deployment/"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
];
