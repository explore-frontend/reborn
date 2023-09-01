// @ts-check
import dts from 'rollup-plugin-dts';
import * as fs from 'node:fs';
import ts from 'rollup-plugin-typescript2';

/** @type {import('./package.json')} */
const { peerDependencies, dependencies, exports } = JSON.parse(
    fs.readFileSync('./package.json', { encoding: 'utf-8' }),
);

const genConfig = (pathAlias, exportMap) => {
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
                    file: exportMap.require,
                    format: 'cjs',
                    paths: pathAlias,
                },
                {
                    file: exportMap.import,
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
                    file: exportMap.require.replace('.cjs', '.d.cts'),
                    paths: pathAlias,
                },
                {
                    file: exportMap.import.replace('.mjs', '.d.mts'),
                    paths: pathAlias,
                },
            ],
        },
    ];

    return config;
};

export default [
    ...genConfig(
        {
            'vue-demi': 'vue-demi',
        },
        exports['.'],
    ),
    ...genConfig(
        {
            'vue-demi': 'vue-demi',
        },
        {
            "import": "./dist/v2.7/index.mjs",
            "require": "./dist/v2.7/index.cjs"
        },
    ),
    ...genConfig(
        {
            'vue-demi': 'vue',
        },
        {
            "import": "./dist/v3/index.mjs",
            "require": "./dist/v3/index.cjs"
        },
    ),
];
