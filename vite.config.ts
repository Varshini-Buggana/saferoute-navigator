import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  // react-leaflet/@react-leaflet/core can break when pre-bundled by Vite in some environments.
  // Excluding them forces Vite to use the actual ESM sources from node_modules.
  optimizeDeps: {
    exclude: ["react-leaflet", "@react-leaflet/core"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
