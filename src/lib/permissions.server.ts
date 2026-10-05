import { ALLOWED_HOSTED_DOMAIN } from "./auth.server";
import { DASHBOARD_PROCESS_IDS, isDashboardProcess, type DashboardProcess } from "./processes";

// ============================================================
// permissions.server.ts
// Quién puede ver datos por persona (nombres de asignados, cantidades y
// tiempos por colaborador), por proceso. Solo corre en el servidor.
//
// PEOPLE_DATA_PERMISSIONS es un JSON email → procesos, por ejemplo:
//   {"persona@firmaway.us":["tax_return"]}
// `{}` = nadie ve datos por persona. Sin comodín: un proceso nuevo no lo ve
// nadie hasta agregarlo acá a mano.
//
// El permiso se evalúa en cada pedido contra el email de la sesión; no se
// guarda en la cookie, así que sacar a alguien rige desde el próximo deploy.
// ============================================================

// ─── CONFIG: FALLA CERRADA ─────────────────────────────────
// Variable ausente o mal escrita → PermissionsConfigError → src/server.ts
// responde 503 a todo, igual que AuthConfigError. NO agregar un camino del
// tipo "si la config está rota, nadie tiene permisos y seguimos": una config
// rota tiene que verse, no degradar en silencio.
export class PermissionsConfigError extends Error {}

export type PeoplePermissions = ReadonlyMap<string, ReadonlySet<DashboardProcess>>;

const EMAIL_RE = new RegExp(`^[^\\s@]+@${ALLOWED_HOSTED_DOMAIN.replace(/\./g, "\\.")}$`);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parsePeoplePermissions(raw: string | undefined): PeoplePermissions {
  const fail = (detail: string): never => {
    throw new PermissionsConfigError(
      `PEOPLE_DATA_PERMISSIONS inválida: ${detail}. ` +
        'Formato: {"persona@firmaway.us":["tax_return"]}; {} si nadie ve datos por persona. ' +
        `Procesos válidos: ${DASHBOARD_PROCESS_IDS.join(", ")}.`,
    );
  };

  if (raw === undefined || raw.trim() === "") fail("falta la variable");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw!);
  } catch {
    fail("no es JSON válido");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("tiene que ser un objeto email → lista de procesos");
  }

  const result = new Map<string, ReadonlySet<DashboardProcess>>();
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const email = normalizeEmail(key);
    if (!EMAIL_RE.test(email)) fail(`"${key}" no es un email @${ALLOWED_HOSTED_DOMAIN}`);
    if (result.has(email)) fail(`"${email}" aparece más de una vez`);
    if (!Array.isArray(value)) fail(`el valor de "${email}" tiene que ser una lista`);
    const processes = new Set<DashboardProcess>();
    for (const p of value as unknown[]) {
      if (!isDashboardProcess(p)) fail(`"${String(p)}" (en "${email}") no es un proceso`);
      if (processes.has(p as DashboardProcess)) fail(`"${String(p)}" repetido en "${email}"`);
      processes.add(p as DashboardProcess);
    }
    result.set(email, processes);
  }
  return result;
}

// Se lee del entorno en cada llamada; solo se vuelve a parsear si el texto
// cambió.
let cache: { raw: string | undefined; value: PeoplePermissions } | null = null;

export function getPeoplePermissions(
  env: Record<string, string | undefined> = process.env,
): PeoplePermissions {
  const raw = env.PEOPLE_DATA_PERMISSIONS;
  if (cache && cache.raw === raw) return cache.value;
  const value = parsePeoplePermissions(raw);
  cache = { raw, value };
  return value;
}

export function allowedPeopleProcesses(
  email: string,
  permissions: PeoplePermissions = getPeoplePermissions(),
): DashboardProcess[] {
  const allowed = permissions.get(normalizeEmail(email));
  return DASHBOARD_PROCESS_IDS.filter((p) => allowed?.has(p) ?? false);
}

export function canSeePeople(
  email: string,
  process: DashboardProcess,
  permissions: PeoplePermissions = getPeoplePermissions(),
): boolean {
  return permissions.get(normalizeEmail(email))?.has(process) ?? false;
}
