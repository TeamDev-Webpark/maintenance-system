import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  root: "president-demo",
  base: "./",
  publicDir: false,
  plugins: [react()],
  server: { host: "127.0.0.1", port: 8081, strictPort: true },
});
