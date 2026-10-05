import { createAuthClient } from "better-auth/react";

// Sin baseURL: usa el origen de la página (localhost, vercel.app o el dominio
// final), que es el mismo origen que resuelve el servidor.
export const authClient = createAuthClient();

// Solo rutas internas ("/algo"), para que ?redirect= no sirva de open redirect.
export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/login") || value.startsWith("/api/")) return "/";
  return value;
}

// Si una server function responde 401 (la sesión de 8 h venció con la página
// abierta), volver al login en vez de mostrar el dashboard vacío.
let installed = false;
export function installSessionExpiryRedirect() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (response.status === 401) {
      const input = args[0];
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (new URL(url, window.location.href).pathname.startsWith("/_serverFn/")) {
        const here = window.location.pathname + window.location.search;
        window.location.assign(
          here === "/" ? "/login" : `/login?redirect=${encodeURIComponent(here)}`,
        );
      }
    }
    return response;
  };
}
