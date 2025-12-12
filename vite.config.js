import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://saaj-backend.onrender.com/", // Changed from 3001 to 3002
        changeOrigin: true,
      },
      "/auth": {
        target: "https://saaj-backend.onrender.com/",
        changeOrigin: true,
      },
    },
  },
  base: "",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".jsx", ".json"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
});
