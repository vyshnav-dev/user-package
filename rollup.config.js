import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// Function-style external: catches react, react-dom, react/*
// and every @mui/*, @emotion/*, @fortawesome/* subpath,
// plus a few extras the package imports.
const external = (id) => {
  if (
    id === 'react' ||
    id === 'react-dom' ||
    id.startsWith('react/') ||
    id.startsWith('react-dom/') ||
    id === 'react-router' ||
    id === 'react-router-dom' ||
    id.startsWith('react-router-dom/') ||
    id.startsWith('@mui/') ||
    id.startsWith('@emotion/') ||
    id.startsWith('@fortawesome/')
  ) {
    return true;
  }
  return [
    'axios',
    'crypto-js',
    'exceljs',
    'file-saver',
    'lodash',
    'mdb-react-ui-kit',
  ].includes(id);
};

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/index.js', format: 'cjs', sourcemap: true, exports: 'named' },
    { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
  ],
  external,
  plugins: [
    resolve({
      extensions: ['.js', '.jsx'],
      preferBuiltins: false,
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: [['@babel/preset-react', { runtime: 'automatic' }]],
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx'],
    }),
  ],
};