import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [
    ...(command === "serve" ? [cloudflareDevProxy()] : []),
    tailwindcss(),
    reactRouter(),
  ],
  ssr: {
    noExternal: true,
    target: "webworker",
  },
}));
