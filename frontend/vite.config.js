import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const BACKEND = "http://localhost:8001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Gọi backend qua cùng origin với giao diện -> cookie đăng nhập tự đi kèm cả API, <img> video, WebSocket
    proxy: {
      "/api": BACKEND,
      "/video": BACKEND,
      "/ws": { target: BACKEND.replace("http", "ws"), ws: true },
    },
  },
});
