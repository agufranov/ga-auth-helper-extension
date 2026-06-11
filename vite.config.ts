import { crx } from "@crxjs/vite-plugin";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [vue(), crx({ manifest })],
  // public/ удалена, manifest.json теперь в корне — CRXJS сам управляет ресурсами
  publicDir: false,
});
