import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { pmAlertEmail } from "./server/pmAlertEmail";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    https: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    pmAlertEmail({ ...process.env, ...loadEnv(mode, process.cwd(), "PM_EMAIL_") }),
    mode === "development" && basicSsl(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
