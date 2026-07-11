import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/super-chinese-checkers/",
  plugins: [react(), tailwindcss()],
});
