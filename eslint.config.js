// Verificação estática (npm run lint, também no npm test): pega nomes usados sem import ou
// declaração, mesmo em trechos que os testes não executam.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'site/', 'node_modules/', '**/*.tmp.mjs'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: {
      // const { a, ...resto } = obj: tirar `a` de propósito
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  { files: ['src/renderer/**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs' } },
];
