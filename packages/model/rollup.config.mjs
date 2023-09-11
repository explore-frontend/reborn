// @ts-check
import dts from 'rollup-plugin-dts';
import * as fs from 'node:fs';
import ts from 'rollup-plugin-typescript2';

/** @type {import('./package.json')} */
const { peerDependencies, dependencies, exports } = JSON.parse(
    fs.readFileSync('./package.json', { encoding: 'utf-8' }),
);

const external = [
    ...Object.keys(peerDependencies ?? {}),
    ...Object.keys(dependencies ?? {}),
];

// 因为 vue 2.6 与 vue 2.7 和 vue 3 的 tsconfig 只有一丢丢 paths 和 types 不同，不影响产出物，所以这里直接用 vue 3 的 tsconfig
const tsconfigPath = './tsconfig.lib.vue3.json'; 
/** @type { Array<import('rollup').RollupOptions> } */
const config = [
    {
        plugins: [ts({ tsconfig: tsconfigPath })],
        external,
        input: './src/index.ts',
        output: [
            {
                file: exports['.'].require,
                format: 'cjs',
            },
            {
                file: exports['.'].import,
                format: 'es',
            },
        ],
    },
    {
        plugins: [
            dts({
                respectExternal: true,
                tsconfig: tsconfigPath,
                compilerOptions: {
                    // see https://github.com/unjs/unbuild/pull/57/files
                    preserveSymlinks: false,
                },
            }),
        ],
        external,
        input: './src/index.ts',
        output: [
            {
                file: exports['.'].require.replace(/\.cjs$/, '.d.cts'),
            },
            {
                file: exports['.'].import.replace(/\.mjs$/, '.d.mts'),
            },
        ],
    },
];

export default config;
