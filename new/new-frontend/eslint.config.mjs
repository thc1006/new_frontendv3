// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'

export default withNuxt(
  {
    plugins: { vue: vuePlugin },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue']
      }
    },
    rules: {
      'vue/html-indent': ['error', 2],
      'vue/script-indent': ['error', 2, { baseIndent: 1 }],
      '@typescript-eslint/no-explicit-any': 'warn',
      indent: ['error', 2]
    }
  },
  {
    files: ['**/*.vue'],    // 只針對 .vue 檔
    rules: { indent: 'off' } // 關閉其餘 .vue 檔的全域 indent
  }
);
