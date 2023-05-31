/// <reference types="vitest" />
import { defineConfig } from "vite";
import { createVuePlugin as vue } from "vite-plugin-vue2";
import vueTemplateBabelCompiler from 'vue-template-babel-compiler'
import scriptSetup from 'unplugin-vue2-script-setup/vite'

export default defineConfig({
    plugins: [
        vue({
            jsx: true,
            vueTemplateOptions: {
                compiler: vueTemplateBabelCompiler
            }
        }),
        scriptSetup(),
    ],
    test: {
        coverage: {
            provider: "c8",
        },
        setupFiles: ["./src/__test__/setup.ts"],
        include: ["**/*.spec.ts"],
    },
});
