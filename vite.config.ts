import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type PluginOption } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

function copyManifest(): PluginOption {
  return {
    name: "copy-extension-assets",
    async closeBundle() {
      const manifestDestination = resolve(rootDir, "dist/manifest.json");
      const popupDestination = resolve(rootDir, "dist/popup.html");
      await mkdir(dirname(manifestDestination), { recursive: true });
      await copyFile(resolve(rootDir, "manifest.json"), manifestDestination);
      await copyFile(resolve(rootDir, "dist/src/popup/popup.html"), popupDestination);
    }
  };
}

export default defineConfig({
  publicDir: "public",
  plugins: [copyManifest()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(rootDir, "src/popup/popup.html"),
        background: resolve(rootDir, "src/background.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
