import studio from '@sanity/eslint-config-studio'
import globals from 'globals'

export default [
  ...studio,
  // The CLI launcher runs in Node, not the browser
  {files: ['run-sanity.mjs'], languageOptions: {globals: globals.node}},
]
