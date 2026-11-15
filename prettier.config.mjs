// @ts-check

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  arrowParens: 'avoid',
  printWidth: 80,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/styles/globals.css',
  tailwindFunctions: ['cn', 'cva'],
}

export default config
