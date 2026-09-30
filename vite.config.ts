import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  plugins: [
    tanstackStart({
      server: {
        entry: "server",
      },
      router: {
        discovery: {
          pattern: "**/*.tsx",
          exclude: ["**/*.spec.tsx", "**/*.test.tsx", "**/node_modules/**"],
        },
        fileConvention: "kebab-case",
        generateStaticParams: true,
        detectMod: true,
      },
      build: {
        target: "node",
      },
      dev: {
        hot: true,
        watch: {
          ignored: ["node_modules/**"],
        },
      },
    }),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
});
