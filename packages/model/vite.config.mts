/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue2 from "@vitejs/plugin-vue2";
import vue from "@vitejs/plugin-vue";
import path from 'path';
import * as compilerV2 from 'vue2.7/compiler-sfc'


const vueVersion = process.env.VUE_VERSION === '2.7' ? '2.7' : '3'
export default defineConfig({
    plugins: [vueVersion === '2.7' ? vue2({
        compiler: compilerV2 as any
    }) : vue()],
    test: {
        coverage: {
            provider: "c8",
        },
        setupFiles: ["./src/__test__/setup.ts"],
        include: ["./src/**/*.spec.ts"],
        deps: {
            inline: ['vue-demi']
        },
        exclude: [
            `**/*.vue${vueVersion === '2.7' ? '3' : '2.7'}.spec.ts`,
        ]
    },
    resolve: {
        alias: vueVersion === '2.7' ? {
            'vue-demi': path.resolve(__dirname, 'node_modules/vue-demi/lib/v2.7'),
            "vue": path.resolve(__dirname, 'node_modules/vue2.7'),
        } : {
            'vue-demi': path.resolve(__dirname, 'node_modules/vue-demi/lib/v3'),
            "vue/server-renderer": path.resolve(__dirname, 'node_modules/vue3/server-renderer/index.mjs'),
            "vue": path.resolve(__dirname, 'node_modules/vue3/dist/vue.esm-bundler.js'),
        }
    }
});
