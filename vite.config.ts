// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Nitro es build-only: en `vite dev` nadie carga el .env en process.env
// (Vite solo expone VITE_* vía import.meta.env). Cargamos `.env.local`/`.env`
// a mano SOLO en `serve` para que `process.env.CLICKUP_TOKEN` (leído en
// src/lib/clickup-api.ts dentro de createServerFn) exista en local. En
// producción la variable viene del panel de Vercel — esto no la toca.
function loadLocalServerEnv() {
  return {
    name: "load-local-server-env",
    config(_config: unknown, { command }: { command: string }) {
      if (command !== "serve") return;
      Object.assign(process.env, loadEnv("development", process.cwd(), ""));
    },
  };
}

// El wrapper usa "cloudflare-module" por defecto; forzamos el preset de Vercel.
// Runtime fijo: si no, Nitro elige bun1.x cuando el build corre bajo Bun.
// Va en una constante porque el tipo del wrapper no declara `vercel`, aunque
// reenvía todas las opciones a nitro() tal cual.
const nitroOptions = {
  preset: "vercel",
  vercel: { functions: { runtime: "nodejs22.x" } },
};

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: nitroOptions,
  vite: {
    plugins: [loadLocalServerEnv()],
  },
});
