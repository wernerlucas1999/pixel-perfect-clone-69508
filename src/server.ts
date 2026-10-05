import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  AUTH_BASE_PATH,
  AuthConfigError,
  getAuth,
  getValidSession,
  isAllowedAuthRequest,
  resolveAllowedOrigin,
} from "./lib/auth.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// ─── BLOQUEO DE AUTENTICACIÓN ──────────────────────────────
// Corre antes que TanStack para todo request que llega al servidor.
// Devuelve una Response para cortar, o null para dejar pasar.
//   /api/auth/*   → better-auth sin exigir sesión, solo las rutas de la
//                   allowlist (ALLOWED_AUTH_ROUTES); el resto 404
//   /login        → pública; con sesión redirige a /
//   /_serverFn/*  → 401 sin sesión
//   todo lo demás → 302 a /login sin sesión
// Si falta config de auth: 503 en todo, incluido /login (falla cerrada).
const SERVER_FN_PREFIX = "/_serverFn/";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function htmlResponse(status: number, title: string, message: string): Response {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0"><div style="max-width:28rem;text-align:center;padding:1rem"><h1 style="font-size:1.25rem">${title}</h1><p style="color:#666">${message}</p></div></body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function redirectResponse(location: string): Response {
  return new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } });
}

export async function authGate(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  const isServerFn = path.startsWith(SERVER_FN_PREFIX);

  const origin = resolveAllowedOrigin(request);
  if (!origin) {
    return isServerFn
      ? jsonResponse(403, { error: "forbidden" })
      : htmlResponse(403, "Host no permitido", "Esta URL no está habilitada para el dashboard.");
  }

  let auth;
  try {
    auth = getAuth(origin);
  } catch (error) {
    if (!(error instanceof AuthConfigError)) throw error;
    // FALLA CERRADA: sin config de auth no se sirve nada.
    console.error(error.message);
    return isServerFn
      ? jsonResponse(503, { error: "auth_not_configured" })
      : htmlResponse(
          503,
          "Autenticación no configurada",
          "El dashboard no está disponible hasta que se configure el login.",
        );
  }

  if (path === AUTH_BASE_PATH || path.startsWith(`${AUTH_BASE_PATH}/`)) {
    // Allowlist: solo las rutas de ALLOWED_AUTH_ROUTES llegan a better-auth.
    if (!isAllowedAuthRequest(request.method, path))
      return jsonResponse(404, { error: "not_found" });
    return auth.handler(request);
  }

  const session = await getValidSession(auth, request);
  if (path === "/login") return session ? redirectResponse("/") : null;
  if (session) return null;

  if (isServerFn) return jsonResponse(401, { error: "unauthorized" });
  const next = path + url.search;
  return redirectResponse(next === "/" ? "/login" : `/login?redirect=${encodeURIComponent(next)}`);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const blocked = await authGate(request);
      if (blocked) return blocked;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
