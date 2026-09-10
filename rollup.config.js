import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/index.js',
            format: 'cjs',
            sourcemap: true,
        },
        {
            file: 'dist/index.esm.js',
            format: 'esm',
            sourcemap: true,
        },
    ],
    external: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        // Add any other peer dependencies here
    ],
    plugins: [
        resolve({
            extensions: ['.js', '.jsx']
        }),
        commonjs(),
        babel({
            babelHelpers: 'bundled',
            presets: ['@babel/preset-react'],
            exclude: 'node_modules/**',
        }),
    ],
};