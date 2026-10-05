// Solo el tipo: better-auth se carga con import() dentro de getAuth() (ver
// AuthUnavailableError).
import type { betterAuth as BetterAuth } from "better-auth";

// ============================================================
// auth.server.ts
// Login con Google (better-auth sin base de datos: la sesión vive en una
// cookie cifrada y firmada con BETTER_AUTH_SECRET). Solo corre en el
// servidor; el bloqueo de requests está en src/server.ts.
// ============================================================

export const ALLOWED_HOSTED_DOMAIN = "firmaway.us";
export const SESSION_MAX_AGE_S = 8 * 60 * 60; // 8 horas

// Orígenes desde los que se puede usar la app. Coinciden 1:1 con los redirect
// URIs del cliente OAuth en Google Cloud. La URL base de better-auth se toma
// del request y tiene que estar en esta lista; cualquier otro host (p. ej. las
// URLs de preview de Vercel) recibe 403.
export const ALLOWED_ORIGINS = [
  "https://kpi.firmaway.us",
  "https://pixel-perfect-clone-69508.vercel.app",
  "http://localhost:8080",
] as const;
export type AllowedOrigin = (typeof ALLOWED_ORIGINS)[number];

export function resolveAllowedOrigin(request: Request): AllowedOrigin | null {
  const origin = new URL(request.url).origin;
  return (ALLOWED_ORIGINS as readonly string[]).includes(origin) ? (origin as AllowedOrigin) : null;
}

// ─── CONFIG: FALLA CERRADA ─────────────────────────────────
// Sin config no hay login, y sin login no hay datos. Si falta cualquiera de
// estas variables, loadAuthEnv() tira AuthConfigError y src/server.ts responde
// 503 a todo. NO agregar un camino del tipo "si no hay config, saltear el
// login": better-auth incluso tiene un secret por defecto fuera de producción,
// por eso el secret se valida acá y se pasa siempre explícito.
export class AuthConfigError extends Error {}

// better-auth no se pudo cargar (p. ej. el bundle de producción resolvió mal
// una dependencia, como pasó con zod 3 vs 4 el 2026-10-05). Con un import
// estático eso tiraba abajo el módulo entero al arrancar y Vercel respondía
// 500 sin pasar por src/server.ts; así se atrapa y responde 503 igual que
// AuthConfigError.
export class AuthUnavailableError extends Error {}

interface AuthEnv {
  secret: string;
  googleClientId: string;
  googleClientSecret: string;
}

export function loadAuthEnv(env: Record<string, string | undefined> = process.env): AuthEnv {
  const secret = env.BETTER_AUTH_SECRET?.trim() ?? "";
  const googleClientId = env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? "";

  const problems: string[] = [];
  if (!secret) problems.push("BETTER_AUTH_SECRET");
  else if (secret.length < 32) problems.push("BETTER_AUTH_SECRET (mínimo 32 caracteres)");
  if (!googleClientId) problems.push("GOOGLE_CLIENT_ID");
  if (!googleClientSecret) problems.push("GOOGLE_CLIENT_SECRET");

  if (problems.length > 0) {
    throw new AuthConfigError(
      `Autenticación no configurada, faltan: ${problems.join(", ")}. ` +
        "Definilas en .env.local (local) o en Settings → Environment Variables (Vercel).",
    );
  }
  return { secret, googleClientId, googleClientSecret };
}

// ─── RUTAS DE AUTH ─────────────────────────────────────────
// Única forma de iniciar sesión: Google OAuth, validado en googleGetUserInfo().
// src/server.ts solo deja pasar a better-auth estas rutas (allowlist); todo lo
// demás bajo /api/auth/* responde 404. De estas, solo las dos primeras pueden
// crear una sesión, y las dos pasan por googleGetUserInfo():
//   - /callback/google: vuelta del flujo OAuth.
//   - /sign-in/social: inicia el flujo OAuth, o con `idToken` en el body crea la
//     sesión directo (better-auth verifica la firma del token y después llama
//     a googleGetUserInfo()).
export const AUTH_BASE_PATH = "/api/auth";
export const ALLOWED_AUTH_ROUTES = [
  { method: "POST", path: "/sign-in/social" },
  { method: "GET", path: "/callback/google" },
  { method: "GET", path: "/get-session" },
  { method: "POST", path: "/sign-out" },
] as const;

export function isAllowedAuthRequest(method: string, pathname: string): boolean {
  if (!pathname.startsWith(`${AUTH_BASE_PATH}/`)) return false;
  const path = pathname.slice(AUTH_BASE_PATH.length);
  return ALLOWED_AUTH_ROUTES.some((r) => r.method === method && r.path === path);
}

// Endpoints HTTP que registra better-auth con esta config, revisados uno por
// uno (better-auth 1.7.7). Los que no están en ALLOWED_AUTH_ROUTES quedan
// además deshabilitados dentro de better-auth (disabledPaths), salvo los que
// llevan parámetro (":"), que disabledPaths no puede matchear y solo quedan
// bloqueados por la allowlist.
// tests/auth.test.ts falla si aparece un endpoint que no está en esta
// lista (actualización de better-auth, plugin nuevo, otro proveedor): antes de
// agregarlo, revisar si puede crear una sesión sin pasar por
// googleGetUserInfo().
export const REVIEWED_BETTER_AUTH_PATHS = [
  "/sign-in/social",
  "/callback/:id",
  "/get-session",
  "/sign-out",
  "/sign-up/email",
  "/sign-in/email",
  "/reset-password",
  "/verify-password",
  "/verify-email",
  "/send-verification-email",
  "/change-email",
  "/change-password",
  "/update-session",
  "/update-user",
  "/delete-user",
  "/request-password-reset",
  "/reset-password/:token",
  "/list-sessions",
  "/revoke-session",
  "/revoke-sessions",
  "/revoke-other-sessions",
  "/link-social",
  "/list-accounts",
  "/delete-user/callback",
  "/unlink-account",
  "/refresh-token",
  "/get-access-token",
  "/account-info",
  "/ok",
  "/error",
] as const;

const allowedPaths = new Set<string>([...ALLOWED_AUTH_ROUTES.map((r) => r.path), "/callback/:id"]);
export const DISABLED_AUTH_PATHS = REVIEWED_BETTER_AUTH_PATHS.filter(
  (p) => !allowedPaths.has(p) && !p.includes(":"),
);

// ─── VALIDACIÓN DEL DOMINIO ────────────────────────────────
// Se decide por los claims del ID token de Google, nunca por el texto del
// email: `hd` es el dominio de Google Workspace de la cuenta y solo existe en
// cuentas de una organización. Igualdad estricta: cualquier otro valor o tipo
// (claim ausente, "true" como string, etc.) se rechaza.
export function isAllowedGoogleProfile(claims: unknown): boolean {
  if (!claims || typeof claims !== "object") return false;
  const c = claims as Record<string, unknown>;
  return c.hd === ALLOWED_HOSTED_DOMAIN && c.email_verified === true;
}

// El ID token llega directo del token endpoint de Google (TLS, autenticado con
// el client secret), así que alcanza con decodificarlo (OIDC Core §3.1.3.7);
// better-auth hace lo mismo en su getUserInfo por defecto. En el camino
// `idToken` de /sign-in/social, better-auth verifica la firma antes.
function decodeIdTokenClaims(idToken: string): Record<string, unknown> | null {
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    const claims: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return claims && typeof claims === "object" ? (claims as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Punto único donde se acepta o rechaza un login. Devolver null hace que
// better-auth no cree la sesión (en el callback redirige al errorCallbackURL
// con ?error=unable_to_get_user_info).
export async function googleGetUserInfo(tokens: { idToken?: string }) {
  const claims = tokens.idToken ? decodeIdTokenClaims(tokens.idToken) : null;
  if (!claims || !isAllowedGoogleProfile(claims)) {
    console.warn(
      `[auth] Login rechazado: hd=${JSON.stringify(claims?.hd)} ` +
        `email_verified=${JSON.stringify(claims?.email_verified)}`,
    );
    return null;
  }
  return {
    user: {
      name: typeof claims.name === "string" ? claims.name : undefined,
      email: claims.email as string,
      image: typeof claims.picture === "string" ? claims.picture : undefined,
      emailVerified: true,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: claims as any,
  };
}

function createAuth(betterAuth: typeof BetterAuth, origin: AllowedOrigin, env: AuthEnv) {
  return betterAuth({
    appName: "Firmaway KPI",
    baseURL: origin,
    secret: env.secret,
    trustedOrigins: [origin],
    // Sin `database`: modo stateless, sesión en cookie JWE.
    session: {
      expiresIn: SESSION_MAX_AGE_S,
      // Vence a las 8 h del login aunque se siga usando.
      disableSessionRefresh: true,
      cookieCache: {
        enabled: true,
        strategy: "jwe",
        maxAge: SESSION_MAX_AGE_S,
        refreshCache: false,
      },
    },
    // Todo método de login que no sea Google queda apagado explícitamente,
    // sin depender de los valores por defecto de better-auth.
    emailAndPassword: { enabled: false, disableSignUp: true },
    emailVerification: { sendOnSignUp: false, sendOnSignIn: false },
    account: { accountLinking: { enabled: false } },
    user: { changeEmail: { enabled: false }, deleteUser: { enabled: false } },
    plugins: [],
    disabledPaths: [...DISABLED_AUTH_PATHS],
    telemetry: { enabled: false },
    socialProviders: {
      google: {
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
        // Pista para el selector de cuentas de Google; better-auth además lo
        // verifica en el camino `idToken`. El control propio es
        // googleGetUserInfo(), que corre en los dos caminos.
        hd: ALLOWED_HOSTED_DOMAIN,
        prompt: "select_account",
        getUserInfo: googleGetUserInfo,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

const instances = new Map<AllowedOrigin, Auth>();

// Tira AuthConfigError si falta configuración (ver loadAuthEnv) y
// AuthUnavailableError si better-auth no se puede cargar.
export async function getAuth(origin: AllowedOrigin): Promise<Auth> {
  let auth = instances.get(origin);
  if (!auth) {
    const env = loadAuthEnv();
    let betterAuth: typeof BetterAuth;
    try {
      ({ betterAuth } = await import("better-auth"));
    } catch (error) {
      throw new AuthUnavailableError(`No se pudo cargar better-auth: ${String(error)}`, {
        cause: error,
      });
    }
    auth = createAuth(betterAuth, origin, env);
    instances.set(origin, auth);
  }
  return auth;
}

export type ValidSession = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

// Sesión válida = cookie descifrable con BETTER_AUTH_SECRET (solo este
// servidor la emite, y solo después de que googleGetUserInfo() aceptó el
// login) + email verificado + dentro de las 8 h. Solo se leen campos base del
// usuario: better-auth descarta los campos extra al armar la sesión desde el
// perfil de Google, así que exigir uno acá bloquearía a todos.
export async function getValidSession(
  auth: { api: Pick<Auth["api"], "getSession"> },
  request: Request,
): Promise<ValidSession | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;
  if (session.user.emailVerified !== true) return null;
  if (new Date(session.session.expiresAt).getTime() <= Date.now()) return null;
  return session;
}

// Segunda capa, usada por el middleware de las server functions: misma
// validación que el bloqueo de src/server.ts, para que ninguna función devuelva
// datos aunque alguien mueva o rompa ese bloqueo.
export async function assertValidSession(request: Request): Promise<ValidSession> {
  const origin = resolveAllowedOrigin(request);
  if (!origin) throw new Error("No autorizado");
  const session = await getValidSession(await getAuth(origin), request);
  if (!session) throw new Error("No autorizado");
  return session;
}
