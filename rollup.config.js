import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import path from 'path';

const PACKAGE_ROOT_PATH = process.cwd();

const INPUT_FILE = path.join(PACKAGE_ROOT_PATH, 'src/index.ts');
const OUTPUT_DIR = path.join(PACKAGE_ROOT_PATH, 'dist');
const PKG_JSON = require(path.join(PACKAGE_ROOT_PATH, 'package.json'));

const formats = [{
    dist: 'umd',
    ts: 'es5',
    name: 'index.js'
}, {
    dist: 'es',
    ts: 'es5',
    name: 'index.es.js'
}];

export default formats.map(format => ({
    plugins: [
        resolve({browser: true}),
        commonjs(),
        typescript({
            clean: true,
            tsconfigOverride: {
                compilerOptions: {target: format.ts},
            },
        }),
    ],
    input: INPUT_FILE,
    external: [...Object.keys(PKG_JSON.dependencies || {}), ...Object.keys(PKG_JSON.peerDependencies || {})],
    output: [
        {
            file: path.join(OUTPUT_DIR, format.name),
            format: format.dist,
            sourcemap: true,
            name: PKG_JSON.name,
        },
    ],
}));
