// Tests de autenticación. Correr con: bun test
import { beforeAll, describe, expect, test } from "bun:test";

// Config falsa pero completa: getAuth() necesita las 3 variables. Se setea
// antes de importar para que ninguna instancia use las de .env.local.
process.env.BETTER_AUTH_SECRET = "test-secret-".padEnd(44, "x");
process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

type AuthModule = typeof import("../src/lib/auth.server");
let A: AuthModule;
let authGate: (request: Request) => Promise<Response | null>;

beforeAll(async () => {
  A = await import("../src/lib/auth.server");
  ({ authGate } = await import("../src/server"));
});

const ORIGIN = "http://localhost:8080";

function fakeIdToken(claims: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "RS256", kid: "test-kid", typ: "JWT" })}.${b64(claims)}.firma-falsa`;
}

const FIRMAWAY = { hd: "firmaway.us", email_verified: true, email: "x@firmaway.us", sub: "1" };

// ─── Validación de dominio ─────────────────────────────────
describe("isAllowedGoogleProfile", () => {
  test("acepta cuenta firmaway verificada", () => {
    expect(A.isAllowedGoogleProfile(FIRMAWAY)).toBe(true);
  });
  test.each([
    ["sin hd (gmail personal)", { email_verified: true, email: "x@gmail.com" }],
    ["hd de otro dominio", { hd: "otra.com", email_verified: true, email: "x@otra.com" }],
    ["email firmaway pero hd gmail", { ...FIRMAWAY, hd: "gmail.com" }],
    ["email firmaway sin hd", { email_verified: true, email: "x@firmaway.us" }],
    ["email_verified false", { ...FIRMAWAY, email_verified: false }],
    ["email_verified como string", { ...FIRMAWAY, email_verified: "true" }],
    ["email_verified ausente", { hd: "firmaway.us", email: "x@firmaway.us" }],
    ["subdominio", { ...FIRMAWAY, hd: "sub.firmaway.us" }],
    ["mayúsculas", { ...FIRMAWAY, hd: "FIRMAWAY.US" }],
    ["null", null],
  ])("rechaza: %s", (_name, claims) => {
    expect(A.isAllowedGoogleProfile(claims)).toBe(false);
  });
});

describe("googleGetUserInfo", () => {
  test("acepta un ID token de firmaway", async () => {
    const r = await A.googleGetUserInfo({ idToken: fakeIdToken(FIRMAWAY) });
    expect(r?.user.email).toBe("x@firmaway.us");
  });
  test("rechaza gmail, sin token o token ilegible", async () => {
    expect(
      await A.googleGetUserInfo({ idToken: fakeIdToken({ ...FIRMAWAY, hd: undefined }) }),
    ).toBeNull();
    expect(await A.googleGetUserInfo({})).toBeNull();
    expect(await A.googleGetUserInfo({ idToken: "basura" })).toBeNull();
  });
});

// ─── Falla cerrada ─────────────────────────────────────────
describe("loadAuthEnv", () => {
  const full = {
    BETTER_AUTH_SECRET: "x".repeat(44),
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "sec",
  };
  test("config completa pasa", () => {
    expect(A.loadAuthEnv(full).googleClientId).toBe("id");
  });
  test.each(["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"])(
    "falta %s → tira",
    (key) => {
      expect(() => A.loadAuthEnv({ ...full, [key]: undefined })).toThrow(A.AuthConfigError);
      expect(() => A.loadAuthEnv({ ...full, [key]: "   " })).toThrow(A.AuthConfigError);
    },
  );
  test("secret corto → tira", () => {
    expect(() => A.loadAuthEnv({ ...full, BETTER_AUTH_SECRET: "corto" })).toThrow(
      A.AuthConfigError,
    );
  });
});

describe("resolveAllowedOrigin", () => {
  test.each([
    ["https://kpi.firmaway.us/x", "https://kpi.firmaway.us"],
    [
      "https://pixel-perfect-clone-69508.vercel.app/",
      "https://pixel-perfect-clone-69508.vercel.app",
    ],
    ["http://localhost:8080/", "http://localhost:8080"],
    ["http://kpi.firmaway.us/", null],
    ["https://pixel-perfect-clone-69508-git-rama.vercel.app/", null],
    ["https://evil.com/", null],
  ])("%s → %s", (url, expected) => {
    expect(A.resolveAllowedOrigin(new Request(url))).toBe(expected);
  });
});

// ─── Bug del 2026-10-03: un campo que no llega a la sesión ─
// better-auth descarta los campos extra del usuario al crear la sesión desde
// el perfil de Google; exigir uno en getValidSession bloqueaba a todos.
// Este es el usuario EXACTO que trae la cookie (visto en el log del callback).
describe("getValidSession con la sesión real que produce better-auth", () => {
  const user = {
    id: "u1",
    createdAt: new Date(),
    updatedAt: new Date(),
    email: "x@firmaway.us",
    emailVerified: true,
    name: "X",
    image: null,
  };
  const fakeAuth = (session: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ api: { getSession: async () => session } }) as any;
  const req = new Request(`${ORIGIN}/`);
  const future = new Date(Date.now() + 60_000);

  test("acepta una sesión que solo tiene los campos base", async () => {
    const s = { user, session: { expiresAt: future } };
    expect(await A.getValidSession(fakeAuth(s), req)).toBe(s);
  });
  test("rechaza email no verificado, sesión vencida o sin sesión", async () => {
    expect(
      await A.getValidSession(
        fakeAuth({ user: { ...user, emailVerified: false }, session: { expiresAt: future } }),
        req,
      ),
    ).toBeNull();
    expect(
      await A.getValidSession(fakeAuth({ user, session: { expiresAt: new Date(0) } }), req),
    ).toBeNull();
    expect(await A.getValidSession(fakeAuth(null), req)).toBeNull();
  });
});

// ─── Riesgo futuro: un camino de login que no pase por la validación ─
describe("solo se puede iniciar sesión por googleGetUserInfo", () => {
  test("better-auth no expone endpoints sin revisar", async () => {
    const auth = await A.getAuth(ORIGIN);
    const exposed = Object.values(auth.api)
      .map((e) => (e as { path?: string }).path)
      .filter((p): p is string => typeof p === "string");
    const reviewed = new Set<string>(A.REVIEWED_BETTER_AUTH_PATHS);
    const unreviewed = exposed.filter((p) => !reviewed.has(p));
    // Si esto falla: un update de better-auth, un plugin o un proveedor nuevo
    // agregó endpoints. Revisar si alguno puede crear una sesión sin pasar por
    // googleGetUserInfo() antes de sumarlo a REVIEWED_BETTER_AUTH_PATHS.
    expect(unreviewed).toEqual([]);
  });

  test("la allowlist del bloqueo es exactamente la revisada", () => {
    // Si esto falla: alguien habilitó una ruta de auth nueva. Solo
    // /sign-in/social y /callback/google pueden crear sesión, y las dos pasan
    // por googleGetUserInfo(); cualquier ruta nueva hay que revisarla igual.
    expect(A.ALLOWED_AUTH_ROUTES.map((r) => `${r.method} ${r.path}`)).toEqual([
      "POST /sign-in/social",
      "GET /callback/google",
      "GET /get-session",
      "POST /sign-out",
    ]);
  });

  test("la config apaga explícitamente todo lo que no es Google", async () => {
    const o = (await A.getAuth(ORIGIN)).options;
    expect(o.emailAndPassword?.enabled).toBe(false);
    expect(o.emailAndPassword?.disableSignUp).toBe(true);
    expect(o.account?.accountLinking?.enabled).toBe(false);
    expect(o.user?.changeEmail?.enabled).toBe(false);
    expect(o.user?.deleteUser?.enabled).toBe(false);
    expect(o.plugins ?? []).toHaveLength(0);
    expect(Object.keys(o.socialProviders ?? {})).toEqual(["google"]);
    expect(o.socialProviders?.google?.getUserInfo).toBe(A.googleGetUserInfo);
    expect(o.database).toBeUndefined();
  });

  // Todas las rutas revisadas que no están en la allowlist, con los
  // parámetros reemplazados por valores reales.
  const blocked = () =>
    A.REVIEWED_BETTER_AUTH_PATHS.map((p) =>
      p.replace(":id", "github").replace(":token", "abc"),
    ).filter((p) => !A.ALLOWED_AUTH_ROUTES.some((r) => r.path === p));

  test("el bloqueo responde 404 a toda ruta de auth fuera de la allowlist", async () => {
    for (const path of [...blocked(), "/sign-in/anonymous", "/magic-link/verify", "/no-existe"]) {
      for (const method of ["GET", "POST"]) {
        const res = await authGate(
          new Request(`${ORIGIN}/api/auth${path}`, {
            method,
            headers: { "content-type": "application/json", origin: ORIGIN },
            body: method === "POST" ? "{}" : undefined,
          }),
        );
        expect({ path, method, status: res?.status }).toEqual({ path, method, status: 404 });
      }
    }
    // Método equivocado en una ruta permitida también es 404.
    const res = await authGate(new Request(`${ORIGIN}/api/auth/sign-in/social`));
    expect(res?.status).toBe(404);
  });

  test("better-auth rechaza email/contraseña aunque se saltee el bloqueo", async () => {
    const auth = await A.getAuth(ORIGIN);
    for (const path of ["/sign-up/email", "/sign-in/email"]) {
      const res = await auth.handler(
        new Request(`${ORIGIN}/api/auth${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: ORIGIN },
          body: JSON.stringify({ email: "x@firmaway.us", password: "12345678", name: "x" }),
        }),
      );
      expect(res.status).toBe(404);
      expect(res.headers.getSetCookie().join()).not.toContain("session_token");
    }
  });

  test("/sign-in/social con un idToken sin firma válida no crea sesión", async () => {
    const res = await authGate(
      new Request(`${ORIGIN}/api/auth/sign-in/social`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({
          provider: "google",
          idToken: { token: fakeIdToken({ ...FIRMAWAY, aud: process.env.GOOGLE_CLIENT_ID }) },
        }),
      }),
    );
    expect(res?.status).toBe(401);
    expect(res?.headers.getSetCookie().join()).not.toContain("session_token");
  });

  test("/sign-in/social con otro proveedor no existe", async () => {
    const res = await authGate(
      new Request(`${ORIGIN}/api/auth/sign-in/social`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({ provider: "github", callbackURL: "/" }),
      }),
    );
    expect(res?.status).not.toBe(200);
    expect(res?.headers.getSetCookie().join()).not.toContain("session_token");
  });
});
