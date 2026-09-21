// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// El plugin de Cloudflare de arriba es build-only: en `vite dev` no corre
// Workers/Miniflare, así que `.dev.vars` (convención de Wrangler) nunca se
// lee. Cargamos `.env.local`/`.env` a mano SOLO en `serve` para que
// `process.env.CLICKUP_TOKEN` (leído en src/lib/clickup-api.ts dentro de
// createServerFn) exista en local. wrangler dev y producción siguen
// leyendo el secret real de Cloudflare — esto no los toca.
function loadLocalServerEnv() {
  return {
    name: "load-local-server-env",
    config(_config: unknown, { command }: { command: string }) {
      if (command !== "serve") return;
      Object.assign(process.env, loadEnv("development", process.cwd(), ""));
    },
  };
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [loadLocalServerEnv()],
  },
});
