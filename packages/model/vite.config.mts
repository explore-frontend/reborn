/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    test: {
        coverage: {
            provider: "c8",
        },
        setupFiles: ["./src/__test__/setup.ts"],
        include: ["**/*.spec.ts"],
    },
});
