// @ts-check
import dts from 'rollup-plugin-dts';
import * as fs from 'node:fs';
import ts from 'rollup-plugin-typescript2';

/** @type {import('./package.json')} */
const { peerDependencies, dependencies, exports } = JSON.parse(
    fs.readFileSync('./package.json', { encoding: 'utf-8' }),
);

const external = [...Object.keys(peerDependencies ?? {}), ...Object.keys(dependencies ?? {})];

/** @type { Array<import('rollup').RollupOptions> } */
const config = [
    {
        plugins: [ts()],
        external,
        input: './src/index.ts',
        output: [
            {
                file: exports['.'].require,
                format: 'cjs',
                paths: {
                    'vue-demi': '@vue/composition-api',
                },
            },
            {
                file: exports['.'].import,
                format: 'es',
                paths: {
                    'vue-demi': '@vue/composition-api',
                },
            },
        ],
    },
    {
        plugins: [
            dts({
                respectExternal: true,
                tsconfig: './tsconfig.lib.json',
                compilerOptions: {
                    // see https://github.com/unjs/unbuild/pull/57/files
                    preserveSymlinks: false,
                },
            }),
        ],
        external,
        input: './src/index.ts',
        output: [
            { file: exports['.'].require.replace('.cjs', '.d.cts') },
            { file: exports['.'].import.replace('.mjs', '.d.mts') },
        ],
    },
];

export default config;
