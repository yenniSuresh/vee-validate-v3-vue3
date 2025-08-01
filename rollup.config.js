// rollup.config.js
import vue from 'rollup-plugin-vue';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm'
      },
      {
        file: 'dist/vee-validate.min.js',
        format: 'umd',
        name: 'VeeValidate',
        globals: {
          vue: 'Vue'
        },
        plugins: [terser()]
      }
    ],
    external: ['vue'],
    plugins: [
      vue(),
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'runtime', // 🔄 use runtime helpers
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env'],
        plugins: ['@babel/plugin-transform-runtime'] // ✅ add this
      })
    ]
  }
];
