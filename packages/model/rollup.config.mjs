// @ts-check
import dts from 'rollup-plugin-dts';
import * as fs from 'node:fs';
import ts from 'rollup-plugin-typescript2';

/** @type {import('./package.json')} */
const { peerDependencies, dependencies, exports } = JSON.parse(
    fs.readFileSync('./package.json', { encoding: 'utf-8' }),
);
const pathAlias = {
    'vue-demi': 'vue',
};
const external = [
    ...Object.keys(peerDependencies ?? {}),
    ...Object.keys(dependencies ?? {}),
    ...Object.keys(pathAlias),
];

/** @type { Array<import('rollup').RollupOptions> } */
const config = [
    {
        plugins: [ts({ tsconfig: './tsconfig.lib.json' })],
        external,
        input: './src/index.ts',
        output: [
            {
                file: exports['.'].require,
                format: 'cjs',
                paths: pathAlias,
            },
            {
                file: exports['.'].import,
                format: 'es',
                paths: pathAlias,
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
            {
                file: exports['.'].require.replace('.cjs', '.d.cts'),
                paths: pathAlias,
            },
            {
                file: exports['.'].import.replace('.mjs', '.d.mts'),
                paths: pathAlias,
            },
        ],
    },
];

export default config;
