import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { viteStaticCopy } from "vite-plugin-static-copy"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    return {
        resolve: {
            alias: {
                "@/services/implementations/target": path.resolve(__dirname,
                    mode === "extension"
                        ? "src/services/implementations/webextension"
                        : "src/services/implementations/web"
                ),  // specific alias comes first (before general ones)
                "@": path.resolve(__dirname, "src"),
                "~tests": path.resolve(__dirname, "tests"),
            }
        },
        plugins: [
            react(),
            viteStaticCopy({
                targets: [
                    { src: "public/*", dest: "." },
                ]
            })
        ],
        build: {
            // target: "esnext", // breaks interval logic
            rollupOptions: {
                input: {
                    popup: path.resolve(__dirname, "index.html"),
                    offscreen: path.resolve(__dirname, "offscreen.html"),
                    background: path.resolve(__dirname, "src/background/background.ts")
                },
                output: {
                    entryFileNames: (chunk) => {
                        if (["background", "offscreen"].includes(chunk.name)) {
                            return "[name].js"
                        } else {
                            return "assets/[name].js"
                        }
                    }
                }
            },
            modulePreload: false,
            outDir: "dist",
            emptyOutDir: true
        },
        test: {
            environment: "jsdom",
            setupFiles: "./tests/setup.ts",
            globals: true
        }
    }
})

