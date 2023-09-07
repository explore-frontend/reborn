/// <reference types="vitest" />
import { defineConfig } from "vite";
import { createVuePlugin as vue26 } from "vite-plugin-vue2";
import vue27 from "@vitejs/plugin-vue2";
import vue from "@vitejs/plugin-vue";
import path from "path";
import * as compilerV27 from "vue2.7/compiler-sfc";

const vueVersion = process.env.VUE_VERSION === "2.6" ? "2.6" : process.env.VUE_VERSION === "2.7" ? "2.7" : "3";
const vueVersions = ["2.6", "2.7", "3"] as const;
export default defineConfig({
    plugins: [
        vueVersion === "2.6"
            ? vue26({})
            : vueVersion === "2.7"
            ? vue27({
                  compiler: compilerV27 as any,
              })
            : vue(),
    ],
    test: {
        coverage: {
            provider: "c8",
        },
        setupFiles: ["./src/__test__/setup.ts"],
        include: ["./src/**/*.spec.ts"],
        deps: {
            inline: ["vue-demi"],
        },
        exclude: vueVersions.filter((x) => x !== vueVersion).map((x) => `**/*.vue${x}.spec.ts`),
    },
    resolve: {
        alias:
            vueVersion === "2.6"
                ? {
                      "vue-demi": path.resolve(__dirname, "node_modules/vue-demi/lib/v2"),
                      vue: path.resolve(__dirname, "node_modules/vue2.6"),
                  }
                : vueVersion === "2.7"
                ? {
                      "vue-demi": path.resolve(__dirname, "node_modules/vue-demi/lib/v2.7"),
                      vue: path.resolve(__dirname, "node_modules/vue2.7"),
                  }
                : {
                      "vue-demi": path.resolve(__dirname, "node_modules/vue-demi/lib/v3"),
                      "vue/server-renderer": path.resolve(__dirname, "node_modules/vue3/server-renderer/index.mjs"),
                      vue: path.resolve(__dirname, "node_modules/vue3/dist/vue.esm-bundler.js"),
                  },
    },
});
