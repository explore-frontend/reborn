// @ts-check
import dts from 'rollup-plugin-dts';
import * as fs from 'node:fs';
import ts from 'rollup-plugin-typescript2';

/**
 * @type {{
 *   peerDependencies: Record<string, string>;
 *   dependencies: Record<string, string>;
 *   exports: { ".": { "import": string, "require": string }}
 * }}
 */
const { peerDependencies, dependencies, exports } = JSON.parse(
    fs.readFileSync('./package.json', { encoding: 'utf-8' }),
);

const external = [...Object.keys(peerDependencies ?? {}), ...Object.keys(dependencies ?? {})];

/** @type { import('rollup').RollupOptions } */
const dtsConfig = {
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
};

/** @type { Array<import('rollup').RollupOptions> } */
const config = [
    {
        plugins: [ts()],
        external,
        input: './src/index.ts',
        output: [
            { file: exports['.'].require, format: 'cjs' },
            { file: exports['.'].import, format: 'es' },
        ],
    },
    {
        ...dtsConfig,
        output: [{ file: exports['.'].require.replace('.cjs', '.d.cts'), format: 'es' }],
    },
    {
        ...dtsConfig,
        output: [{ file: exports['.'].import.replace('.mjs', '.d.mts'), format: 'es' }],
    },
];

export default config;
