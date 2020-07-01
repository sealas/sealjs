import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [
    babel({ babelHelpers: 'bundled' }),
    terser()
  ]
}
