import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development the React app (port 5173) proxies any /api request to the
// FastAPI backend (port 8000), so the frontend code can use relative URLs and
// we avoid CORS issues.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
