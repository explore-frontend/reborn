/// <reference types="vitest" />
import * as fs from "node:fs";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const { peerDependencies, dependencies } = JSON.parse(fs.readFileSync("./package.json", { encoding: "utf-8" }));

export default defineConfig({
    plugins: [vue()],
    test: {
        coverage: {
            provider: "c8",
        },
        setupFiles: ["./src/__test__/setup.ts"],
        include: ["**/*.spec.ts"],
    },
    build: {
        minify: false,
        rollupOptions: {
            external: [...Object.keys(peerDependencies ?? {}), ...Object.keys(dependencies ?? {})],
            output: {
                sourcemap: true,
            },
        },
        lib: {
            entry: "./src/index.ts",
            formats: ["es", "cjs"],
        },
    },
});
