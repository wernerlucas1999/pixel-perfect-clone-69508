import { createServerFn } from "@tanstack/react-start";
import { requireSession } from "./auth-middleware";
import { isDashboardProcess, type DashboardProcess } from "./processes";
import { inPeriod, periodBoundsMs, type DayRange } from "./periods";
import { CLICKUP_NO_RESPONDE, CLICKUP_SATURADO } from "./load-errors";

// ============================================================
// clickup-api.ts
// Capa de datos de ClickUp. Las funciones getFiltered* están
// envueltas con createServerFn: corren solo en el servidor
// (Vercel Function), así el token nunca llega al bundle del cliente.
// ============================================================

// ─── CONFIG ────────────────────────────────────────────────
// El token vive como variable de entorno del proyecto en Vercel (prod) y en
// .env.local (local), y se lee en runtime dentro del handler, nunca a nivel
// de módulo.
function getClickUpToken(): string {
  const token = process.env.CLICKUP_TOKEN;
  if (!token) {
    throw new Error(
      "CLICKUP_TOKEN no está configurado. Definilo en .env.local (local) o en " +
        "Settings → Environment Variables del proyecto en Vercel (producción).",
    );
  }
  return token;
}

const LIST_IDS = {
  llc_formation: "900200216635", // Lista "To-do 2.0"
  bank_application: "900200216649", // Lista "Aplicaciones 2.0"
  // annual_reports:    "TU_ID_AQUI",   // Completar después
  // agentes_registrados: "TU_ID_AQUI", // Completar después
};

const BASE_URL = "https://api.clickup.com/api/v2";

// ─── TYPES (se mantienen igual que mock-data.ts) ───────────
export type ProcessType =
  | "llc_formation"
  | "bank_application"
  | "annual_reports"
  | "agentes_registrados"
  | "tax_return"
  | "other";

export type StateType = "new_mexico" | "wyoming" | "delaware" | "florida" | "texas";
export type PackageType = "solo_llc" | "starter" | "pro" | "all_in" | "solo_bank";
export type BankType = "mercury" | "relay" | "lili";

export const STATES: { id: StateType | "all"; name: string }[] = [
  { id: "all", name: "Todos" },
  { id: "new_mexico", name: "New Mexico" },
  { id: "wyoming", name: "Wyoming" },
  { id: "delaware", name: "Delaware" },
  { id: "florida", name: "Florida" },
  { id: "texas", name: "Texas" },
];

export const PACKAGES: { id: PackageType | "all"; name: string }[] = [
  { id: "all", name: "Todos" },
  { id: "solo_llc", name: "Solo LLC" },
  { id: "starter", name: "Starter" },
  { id: "pro", name: "Pro" },
  { id: "all_in", name: "All In" },
  { id: "solo_bank", name: "Solo Bank" },
];

export const BANKS: { id: BankType | "all"; name: string }[] = [
  { id: "all", name: "Todos" },
  { id: "mercury", name: "Mercury" },
  { id: "relay", name: "Relay" },
  { id: "lili", name: "Lili" },
];

export type LLCStatus =
  | "PENDIENTE"
  | "NO INICIAR"
  | "ESPERANDO INPUT CLIENTE"
  | "ESPERANDO APROB"
  | "APROBADA EN ESTADO"
  | "1º ENTREGA DOCS"
  | "FAXEADO"
  | "ESPERANDO EIN"
  | "EIN LISTO"
  | "CANCELADO"
  | "ENTREGA COMPLETADA";

export type EINStatus = "pendiente" | "solicitado" | "recibido" | "n/a";

export type BankStatus =
  | "PENDIENTE"
  | "ESPERANDO EIN"
  | "ESPERANDO INPUT CLIENTE"
  | "INFO ADICIONAL BANK"
  | "VERIF IDENTIDAD"
  | "INICIADA";

export const BANK_STATUS_COLORS: Record<BankStatus, string> = {
  PENDIENTE: "#6366f1",
  "ESPERANDO EIN": "#a16207",
  "ESPERANDO INPUT CLIENTE": "#eab308",
  "INFO ADICIONAL BANK": "#d946ef",
  "VERIF IDENTIDAD": "#22c55e",
  INICIADA: "#3b82f6",
};

export const BANK_DISPLAY_STATUSES: BankStatus[] = [
  "PENDIENTE",
  "ESPERANDO EIN",
  "ESPERANDO INPUT CLIENTE",
  "INFO ADICIONAL BANK",
  "VERIF IDENTIDAD",
  "INICIADA",
];

export interface CustomFields {
  fecha_creacion: string;
  envio_tramite: string | null;
  fecha_solicitud_ein: string | null;
  fecha_recepcion_ein: string | null;
  demora_cliente: number | null;
  tiempo_interno: number | null;
}

export interface BankCustomFields {
  // Campos exactos de la lista "Aplicaciones 2.0"
  fecha_creacion: string; // Fecha de creacion (llegada de la tarea)
  solicitud_info: string | null; // Solicitud info
  fecha_correccion: string | null; // Fecha correccion
  fecha_aplicacion: string | null; // Fecha aplicacion (inicio en el banco)
  pedido_verif_id: string | null; // Pedido verif. ID
  completa_verif_id: string | null; // Completa verif. ID
  fecha_aprob_rech: string | null; // Fecha aprob/rech (cierre del banco)
  demora_cliente: number | null; // z_Demora cliente
  tiempo_interno: number | null; // z_Tiempo interno
  demora_banco: number | null; // z_Demora banco
  demora_irs: number | null; // z_Demora IRS
  tiempo_servicio: number | null; // z_Tiempo de servicio
}

export interface TimeInStatus {
  [status: string]: number;
}

export interface Task {
  id: string;
  name: string;
  status: LLCStatus;
  process_type: ProcessType;
  created_at: string;
  closed_at: string | null;
  // Instantes originales de ClickUp (ms). Los usan los filtros de período;
  // created_at/closed_at (día UTC) siguen alimentando las duraciones.
  created_at_ms: number | null;
  closed_at_ms: number | null;
  custom_fields: CustomFields;
  time_in_status: TimeInStatus;
  ein_status: EINStatus;
  current_status_days: number;
  state: StateType;
  package: PackageType;
}

export interface BankTask {
  id: string;
  name: string;
  status: BankStatus;
  process_type: "bank_application";
  created_at: string;
  closed_at: string | null;
  // Instantes originales de ClickUp (ms), para los filtros de período.
  created_at_ms: number | null;
  closed_at_ms: number | null;
  custom_fields: BankCustomFields;
  time_in_status: TimeInStatus;
  current_status_days: number;
  client_wait_days: number;
  bank_wait_days: number;
  blocking_alert: "client_blocked" | "bank_delay" | null;
  state: StateType;
  package: PackageType;
  bank: BankType;
}

export interface Process {
  id: ProcessType;
  name: string;
  color: string;
}

export const PROCESSES: Process[] = [
  { id: "llc_formation", name: "Formacion de LLC", color: "#22c55e" },
  { id: "bank_application", name: "Aplicacion Bancaria", color: "#3b82f6" },
  { id: "annual_reports", name: "Annual Reports", color: "#8b5cf6" },
  { id: "agentes_registrados", name: "Agentes Registrados", color: "#f97316" },
  { id: "tax_return", name: "Tax Return", color: "#14b8a6" },
  { id: "other", name: "Otros", color: "#f59e0b" },
];

export const LLC_STATUS_FLOW: LLCStatus[] = [
  "PENDIENTE",
  "ESPERANDO INPUT CLIENTE",
  "ESPERANDO APROB",
  "APROBADA EN ESTADO",
  "1º ENTREGA DOCS",
  "FAXEADO",
  "ESPERANDO EIN",
  "EIN LISTO",
  "ENTREGA COMPLETADA",
];

export const LLC_STATUS_FLOW_FULL: LLCStatus[] = [
  "PENDIENTE",
  "NO INICIAR",
  "ESPERANDO INPUT CLIENTE",
  "ESPERANDO APROB",
  "APROBADA EN ESTADO",
  "1º ENTREGA DOCS",
  "FAXEADO",
  "ESPERANDO EIN",
  "EIN LISTO",
  "CANCELADO",
  "ENTREGA COMPLETADA",
];

export const STATUS_COLORS: Record<LLCStatus, string> = {
  PENDIENTE: "#6366f1",
  "NO INICIAR": "#8b5cf6",
  "ESPERANDO INPUT CLIENTE": "#f59e0b",
  "ESPERANDO APROB": "#f97316",
  "APROBADA EN ESTADO": "#22c55e",
  "1º ENTREGA DOCS": "#14b8a6",
  FAXEADO: "#06b6d4",
  "ESPERANDO EIN": "#3b82f6",
  "EIN LISTO": "#10b981",
  CANCELADO: "#ef4444",
  "ENTREGA COMPLETADA": "#059669",
};

// ─── TIPOS PARA STUBS (Annual Reports, Agentes, CX) ────────
// Se mantienen para no romper el resto del dashboard mientras
// no se conecten esas listas. Retornan arrays vacíos por ahora.
export type AnnualReportStatus = "pendiente" | "proximo_a_hacer" | "completado";
export interface AnnualReportTask {
  id: string;
  name: string;
  entity_name: string;
  due_date: string;
  filed_date: string | null;
  date_created: string | null;
  date_created_ms: number | null;
  status: AnnualReportStatus;
  state: StateType;
  package: PackageType;
}
export type AgenteStatus = "pendiente" | "esperando_invoice" | "completado";
export interface AgenteRegistradoTask {
  id: string;
  name: string;
  entity_name: string;
  state: StateType;
  package: PackageType;
  renewal_date: string;
  date_created: string | null;
  date_created_ms: number | null;
  date_closed_ms: number | null;
  status: AgenteStatus;
}

// ─── DATOS DE PERSONAS ─────────────────────────────────────
// Los registros en caché llevan `assignees` (lo usa getPeopleBreakdown), pero
// los tipos públicos de arriba no: las funciones de lista lo sacan SIEMPRE con
// redactPeople, tenga o no permiso quien pide. Los datos por persona viajan
// solo por getPeopleBreakdown, que verifica el permiso para ese proceso.
// Cualquier campo nuevo con datos de personas (emails, usernames, avatares)
// va dentro de `assignees` o se agrega a PEOPLE_FIELDS.
export type WithPeople<T> = T & { assignees: string[] };

const PEOPLE_FIELDS = ["assignees"] as const;

// Nombres de los asignados de una tarea cruda de ClickUp (username, o email si
// no tiene).
export function extractAssignees(raw: any): string[] {
  return Array.isArray(raw?.assignees)
    ? raw.assignees.map((a: any) => a?.username ?? a?.email).filter(Boolean)
    : [];
}

// Devuelve copias sin los campos de personas. Nunca modifica `items`: son los
// objetos del caché, compartidos entre todos los usuarios.
export function redactPeople<T extends object>(items: readonly WithPeople<T>[]): T[] {
  return items.map((item) => {
    const copy: Record<string, unknown> = { ...item };
    for (const field of PEOPLE_FIELDS) delete copy[field];
    return copy as T;
  });
}

// ─── HELPERS ───────────────────────────────────────────────

// Instante de ClickUp (string o número de ms) → ms, o null si no hay.
function rawMs(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isFinite(n) && n > 0 ? n : null;
}

function msToDate(ms: number | string | null): string | null {
  if (!ms) return null;
  const n = typeof ms === "string" ? parseInt(ms) : ms;
  if (isNaN(n) || n === 0) return null;
  return new Date(n).toISOString().split("T")[0];
}

function findField(fields: any[], names: string[]): any | null {
  const norm = (s: any) => String(s ?? "").toLowerCase().trim();
  for (const name of names) {
    const target = norm(name);
    const f = fields.find((f: any) => norm(f.name) === target);
    if (f) return f;
  }
  return null;
}

function getCustomFieldValue(fields: any[], name: string): string | null {
  const f = findField(fields, [name]);
  if (!f || f.value === undefined || f.value === null || f.value === "") return null;
  // Fechas vienen en ms (Unix timestamp en ms)
  if (typeof f.value === "number" || /^\d{12,}$/.test(String(f.value))) {
    return msToDate(f.value);
  }
  return String(f.value);
}

// Igual que getCustomFieldValue pero matcheando por "id" del custom field en
// vez de por "name" — usar cuando el id ya fue verificado contra la API real,
// porque el label visible en ClickUp puede cambiar y el id no.
function getCustomFieldDateById(fields: any[], fieldId: string): string | null {
  if (!Array.isArray(fields)) return null;
  const f = fields.find((f: any) => f?.id === fieldId);
  if (!f || f?.value === undefined || f?.value === null || f?.value === "") return null;
  return msToDate(f.value);
}

// Resuelve un campo drop_down de ClickUp a su label visible.
// El value puede ser: number (índice/orderindex) o string (option id / label).
function getDropdownLabel(fields: any[], names: string[]): string | null {
  const f = findField(fields, names);
  if (!f || f.value === undefined || f.value === null || f.value === "") return null;
  const opts: any[] = f.type_config?.options ?? [];
  if (typeof f.value === "number") {
    const opt =
      opts.find((o: any) => o.orderindex === f.value) ??
      opts[f.value] ??
      null;
    return opt?.name ?? opt?.label ?? null;
  }
  if (typeof f.value === "string") {
    const opt = opts.find((o: any) => o.id === f.value || o.name === f.value);
    return opt?.name ?? opt?.label ?? f.value;
  }
  return null;
}

// Devuelve null si el estado no pertenece al flujo operativo oficial.
// Comparación flexible: case-insensitive + trim en ambos lados.
function normalizeStatus<T extends string>(raw: string, validValues: T[]): T | null {
  const norm = String(raw ?? "").toLowerCase().trim();
  if (!norm) return null;
  const match = validValues.find((v) => v.toLowerCase().trim() === norm);
  return match ?? null; // NO defaultear - descartar tareas con estados desconocidos
}

function normalizeState(label: string | null): StateType | null {
  if (!label) return null;
  const n = label.toLowerCase();
  if (n.includes("new mexico") || /\bnm\b/.test(n)) return "new_mexico";
  if (n.includes("wyoming") || /\bwy\b/.test(n)) return "wyoming";
  if (n.includes("delaware") || /\bde\b/.test(n)) return "delaware";
  if (n.includes("florida") || /\bfl\b/.test(n)) return "florida";
  if (n.includes("texas") || /\btx\b/.test(n)) return "texas";
  return null;
}

function normalizePackage(label: string | null): PackageType | null {
  if (!label) return null;
  const n = label.toLowerCase().trim();
  if (n.includes("all in") || n.includes("all_in") || n === "allin") return "all_in";
  if (n.includes("pro")) return "pro"; // "Pro (LLC + Bank)"
  if (n.includes("starter")) return "starter";
  if (n.includes("solo llc")) return "solo_llc";
  if (n === "bank" || n.includes("solo bank") || n === "solo_bank") return "solo_bank";
  return null;
}

function normalizeBank(label: string | null): BankType | null {
  if (!label) return null;
  const n = label.toLowerCase();
  if (n.includes("relay")) return "relay";
  if (n.includes("lili")) return "lili";
  if (n.includes("mercury")) return "mercury";
  return null;
}

function inferStateFromName(name: string): StateType {
  const n = name.toUpperCase();
  if (n.includes("NEW MEXICO") || n.includes("NM")) return "new_mexico";
  if (n.includes("WYOMING") || n.includes("WY")) return "wyoming";
  if (n.includes("DELAWARE") || n.includes("DE")) return "delaware";
  if (n.includes("FLORIDA") || n.includes("FL")) return "florida";
  if (n.includes("TEXAS") || n.includes("TX")) return "texas";
  return "new_mexico"; // fallback
}

function inferPackageFromName(name: string): PackageType {
  const n = name.toLowerCase();
  if (n.includes("all in") || n.includes("all_in")) return "all_in";
  if (n.includes("solo bank")) return "solo_bank";
  if (n.includes("solo llc") || n.includes("solo")) return "solo_llc";
  if (n.includes("starter")) return "starter";
  if (n.includes("pro")) return "pro";
  return "solo_llc";
}

function inferBankFromName(name: string): BankType {
  const n = name.toLowerCase();
  if (n.includes("relay")) return "relay";
  if (n.includes("lili")) return "lili";
  return "mercury";
}

function daysBetween(date1: string | null, date2: string | null): number {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1),
    d2 = new Date(date2);
  return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / 86400000);
}

function calcCurrentStatusDays(task: any): number {
  const updated = task.date_updated ? parseInt(task.date_updated) : 0;
  if (!updated) return 0;
  return Math.floor((Date.now() - updated) / 86400000);
}

// ─── CLIENTE HTTP (concurrencia + rate limit) ──────────────
// ClickUp permite 100 requests/minuto por token. Todas las llamadas pasan por
// clickUpFetch, que limita cuántas hay en vuelo a la vez (compartido entre
// pantallas) y reintenta los 429 esperando hasta que se libere el límite.
const CLICKUP_MAX_CONCURRENCY = 6;
const CLICKUP_MAX_RETRIES_429 = 5;

// ─── TOPES DE CADA CARGA ───────────────────────────────────
// Dos topes distintos, porque son dos cosas distintas:
// - CLICKUP_LOAD_BUDGET_MS (45 s): cuánto puede durar una carga que está
//   recibiendo respuestas, aunque ClickUp responda lento. Queda por debajo de
//   los 60 s de la función en Vercel (maxDuration).
// - CLICKUP_RATE_WAIT_BUDGET_MS (20 s): cuánto puede esperar, en total, a que
//   ClickUp libere cupo (pausas por 429 y esperas del autolímite). Si la espera
//   no entra, se corta en el momento como "saturado" en vez de dejar a la
//   persona mirando la pantalla.
// Antes había un solo tope de 20 s para todo, y una carga que avanzaba pero
// lento terminaba en "ClickUp no responde" con ClickUp respondiendo bien.
// Una carga cortada no deja nada en caché: nunca hay datos parciales.
export const CLICKUP_LOAD_BUDGET_MS = 45_000;
export const CLICKUP_RATE_WAIT_BUDGET_MS = 20_000;

// Estado de una carga: pedidos hechos, tope total y espera por cupo restante.
export interface ClickUpLoad {
  requests: number;
  deadline: number;
  waitLeft: number;
  // Hasta cuándo ya se contó espera: varias páginas de la misma carga que
  // esperan la misma pausa la descuentan una sola vez.
  waitedThrough: number;
}

export function newClickUpLoad(now = Date.now()): ClickUpLoad {
  return {
    requests: 0,
    deadline: now + CLICKUP_LOAD_BUDGET_MS,
    waitLeft: CLICKUP_RATE_WAIT_BUDGET_MS,
    waitedThrough: now,
  };
}

// true (y descuenta) si la carga puede esperar a que ClickUp libere cupo hasta
// `until` sin pasarse de los 20 s de espera ni del tope total.
export function reserveWait(load: ClickUpLoad, until: number, now = Date.now()): boolean {
  if (until >= load.deadline) return false;
  const extra = Math.max(0, until - Math.max(now, load.waitedThrough));
  if (extra > load.waitLeft) return false;
  load.waitLeft -= extra;
  load.waitedThrough = Math.max(load.waitedThrough, until);
  return true;
}

// ─── AUTOLÍMITE ────────────────────────────────────────────
// ClickUp permite 100 pedidos por minuto por token (plan actual). En vez de
// mandar pedidos hasta chocar con un 429, el dashboard se frena solo:
// - lleva la cuenta de los pedidos de esta instancia en el último minuto y no
//   pasa del límite del token (X-RateLimit-Limit; 100 si todavía no se leyó);
// - lee X-RateLimit-Remaining/Reset de cada respuesta (que cuentan TODO lo que
//   usa el token, también otras instancias y otros sistemas) y, si no queda
//   cupo, espera a que ClickUp lo libere.
// Sin reserva a propósito: una recorrida completa usa 97 páginas reales y una
// reserva haría cortar pedidos que sí entraban (medido con un ClickUp simulado).
// La espera respeta el tope de la carga: si el cupo se libera después del tope,
// corta en el momento como "saturado", sin mandar el pedido.
const CLICKUP_DEFAULT_LIMIT_PER_MIN = 100;
let clickUpRateLimit: number | null = null;
const recentClickUpRequests: number[] = []; // instantes (ms) de los pedidos del último minuto
let clickUpRateRemaining: number | null = null;
let clickUpRateResetAt = 0;

export function clickUpRequestsLastMinute(now = Date.now()): number {
  // Solo el último minuto; si el reloj saltó hacia atrás, los "del futuro" no cuentan.
  const kept = recentClickUpRequests.filter((t) => t > now - 60_000 && t <= now);
  recentClickUpRequests.splice(0, recentClickUpRequests.length, ...kept);
  return recentClickUpRequests.length;
}

export function clickUpRateState() {
  return {
    limit: clickUpRateLimit,
    remaining: clickUpRateRemaining,
    resetAt: clickUpRateResetAt || null,
  };
}

function noteRateHeaders(res: Response): void {
  const limit = Number(res.headers.get("x-ratelimit-limit"));
  if (limit > 0) clickUpRateLimit = limit;
  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (res.headers.has("x-ratelimit-remaining") && isFinite(remaining)) {
    clickUpRateRemaining = remaining;
  }
  if (reset > 0) clickUpRateResetAt = reset * 1000;
}

async function waitForRateSlot(load: ClickUpLoad): Promise<void> {
  for (;;) {
    const now = Date.now();
    let until = 0;
    if (clickUpRequestsLastMinute(now) >= (clickUpRateLimit ?? CLICKUP_DEFAULT_LIMIT_PER_MIN)) {
      until = Math.min(...recentClickUpRequests) + 60_000;
    }
    if (
      clickUpRateRemaining !== null &&
      clickUpRateRemaining <= 0 &&
      now < clickUpRateResetAt &&
      // ClickUp reinicia el cupo cada minuto: un reinicio más lejano es un
      // dato viejo o un salto de reloj, y no se espera por él.
      clickUpRateResetAt - now <= 65_000
    ) {
      until = Math.max(until, clickUpRateResetAt);
    }
    if (until <= now) {
      recentClickUpRequests.push(now);
      if (clickUpRateRemaining !== null) clickUpRateRemaining--;
      return;
    }
    if (!reserveWait(load, until, now)) {
      throw new ClickUpUnavailableError(
        "saturado",
        `autolímite: el cupo se libera en ${Math.round((until - now) / 1000)}s`,
      );
    }
    await sleep(until - now);
  }
}

export class ClickUpUnavailableError extends Error {
  // Pedidos que llevaba la carga cuando se cortó (lo completa el paginador).
  requestsInLoad?: number;
  constructor(
    readonly reason: "saturado" | "sin_respuesta",
    readonly detail: string,
  ) {
    super(`ClickUp ${reason === "saturado" ? "saturado" : "sin respuesta"}: ${detail}`);
  }
}

let clickUpActive = 0;
const clickUpQueue: (() => void)[] = [];
// Si un request recibe 429, todos los siguientes esperan hasta este instante.
let clickUpPausedUntil = 0;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function acquireClickUpSlot(): Promise<void> {
  if (clickUpActive < CLICKUP_MAX_CONCURRENCY) {
    clickUpActive++;
    return;
  }
  // El slot se transfiere directo desde releaseClickUpSlot.
  await new Promise<void>((resolve) => clickUpQueue.push(resolve));
}

function releaseClickUpSlot(): void {
  const next = clickUpQueue.shift();
  if (next) next();
  else clickUpActive--;
}

// Cuánto esperar ante un 429: Retry-After (segundos) o X-RateLimit-Reset
// (epoch en segundos); si no vienen, backoff exponencial.
function rateLimitWaitMs(res: Response, attempt: number): number {
  const retryAfter = Number(res.headers.get("retry-after"));
  if (retryAfter > 0) return retryAfter * 1000;
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (reset > 0) return Math.min(Math.max(reset * 1000 - Date.now() + 500, 1000), 65_000);
  return Math.min(2000 * 2 ** attempt, 60_000);
}

// load: la carga a la que pertenece este pedido (topes y pedidos hechos).
async function clickUpFetch(url: string, load: ClickUpLoad): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    await waitForRateSlot(load);
    await acquireClickUpSlot();
    let res: Response;
    try {
      // ClickUp reinicia el cupo cada minuto: una pausa más larga que 65 s es un
      // dato viejo o un salto de reloj, y no se espera por ella.
      const pause = clickUpPausedUntil - Date.now() > 65_000 ? 0 : clickUpPausedUntil - Date.now();
      if (pause > 0 && !reserveWait(load, Date.now() + pause)) {
        throw new ClickUpUnavailableError("saturado", "la espera por 429 no entra en el tope");
      }
      if (pause > 0) await sleep(pause);
      const left = load.deadline - Date.now();
      if (left <= 0) {
        throw new ClickUpUnavailableError("sin_respuesta", "se agotó el tope de la carga");
      }
      try {
        load.requests++;
        res = await fetch(url, {
          headers: { Authorization: getClickUpToken() },
          signal: AbortSignal.timeout(left),
        });
      } catch (error) {
        // Sin respuesta dentro del tope, o falla de red.
        throw new ClickUpUnavailableError("sin_respuesta", String(error));
      }
    } finally {
      releaseClickUpSlot();
    }
    noteRateHeaders(res);
    if (res.status !== 429) return res;
    await res.body?.cancel();
    if (attempt >= CLICKUP_MAX_RETRIES_429) {
      throw new ClickUpUnavailableError("saturado", `429 después de ${attempt} reintentos`);
    }
    const waitMs = rateLimitWaitMs(res, attempt);
    clickUpPausedUntil = Math.max(clickUpPausedUntil, Date.now() + waitMs);
    if (!reserveWait(load, Date.now() + waitMs)) {
      throw new ClickUpUnavailableError(
        "saturado",
        `ClickUp pide esperar ${Math.round(waitMs / 1000)}s`,
      );
    }
    console.warn(`[ClickUp] 429 rate limit, reintento ${attempt + 1} en ${Math.round(waitMs / 1000)}s`);
  }
}

// ─── PEDIDO COMPARTIDO ─────────────────────────────────────
// Varias personas que abren la misma pantalla a la vez con el caché vacío
// comparten una sola carga desde ClickUp (en esta instancia). Si falla, falla
// para todas y no queda nada en curso ni en caché.
export function singleFlight<T>(load: () => Promise<T>): () => Promise<T> {
  let inflight: Promise<T> | null = null;
  return () => {
    inflight ??= load().finally(() => {
      inflight = null;
    });
    return inflight;
  };
}

// ─── FETCHER GENÉRICO ──────────────────────────────────────

// Pide las páginas en tandas de CLICKUP_MAX_CONCURRENCY. Dentro de cada tanda
// los resultados se recorren en orden de página y se corta en la primera que
// cumple isLastPage: las páginas posteriores de esa tanda se descartan, así
// el resultado es idéntico al de la paginación secuencial. Un error solo se
// propaga si ocurre en una página anterior o igual a la última.
//
// Para no pedir páginas que no existen, recuerda (por lista, en la memoria de la
// instancia) cuántas páginas hicieron falta la vez anterior y la próxima pide
// exactamente esas. Si la última planeada viene llena, la lista creció: sigue
// pidiendo en tandas como antes, así que el resultado es siempre el mismo. En
// frío (sin dato previo) se pide en tandas completas, como siempre: ClickUp no
// expone el total de tareas (task_count de la lista cuenta solo las abiertas).
const knownPageCount = new Map<string, number>();

export async function fetchPagesConcurrently(
  pageUrl: (page: number) => string,
  isLastPage: (data: any, batch: any[]) => boolean,
  errorLabel: string,
  maxPage = Infinity,
  deadline = Date.now() + CLICKUP_LOAD_BUDGET_MS,
  pageCountKey?: string,
): Promise<any[]> {
  // Topes y pedidos de esta carga (también para los registros de carga y cortes).
  const startedAt = Date.now();
  const load = newClickUpLoad(startedAt);
  load.deadline = deadline;
  try {
    const tasks = await fetchPagesCounted(
      load,
      pageUrl,
      isLastPage,
      errorLabel,
      maxPage,
      pageCountKey,
    );
    logClickUpLoad(pageCountKey, load.requests, startedAt, null);
    return tasks;
  } catch (error) {
    if (error instanceof ClickUpUnavailableError) error.requestsInLoad ??= load.requests;
    logClickUpLoad(pageCountKey, load.requests, startedAt, error);
    throw error;
  }
}

// Una línea "[clickup-carga] {json}" por cada carga real desde ClickUp (las
// que salen del caché no llegan acá), con el id de la instancia: sirve para
// medir cuántas instancias abre Vercel y cuánto pide cada una. Sin datos de
// personas.
function logClickUpLoad(
  pageCountKey: string | undefined,
  requests: number,
  startedAt: number,
  error: unknown,
): void {
  const listId = pageCountKey?.split(":")[1];
  const names: Record<string, string> = {
    [LIST_IDS.llc_formation]: "Formación LLC",
    [LIST_IDS.bank_application]: "Aplicación Bancaria",
    [ANNUAL_REPORTS_LIST_ID]: "Annual Reports",
    [REGISTERED_AGENTS_LIST_ID]: "Agentes Registrados",
    [TAX_RETURN_LIST_ID]: "Tax Return",
  };
  // Mismo reloj que el autolímite (Date.now), para no desordenar su ventana.
  const now = new Date(Date.now());
  const rate = clickUpRateState();
  const event = {
    evento: "clickup_carga",
    lista: (listId && names[listId]) ?? listId ?? "desconocida",
    ok: error === null,
    motivo:
      error === null ? null : error instanceof ClickUpUnavailableError ? error.reason : "error",
    pedidos: requests,
    ms: now.getTime() - startedAt,
    pedidos_ultimo_minuto_instancia: clickUpRequestsLastMinute(now.getTime()),
    clickup_restantes: rate.remaining,
    hora_utc: now.toISOString(),
    hora_ar: AR_TIME.format(now),
    instancia: INSTANCE.id,
    instancia_desde: INSTANCE.since,
  };
  console.log(`[clickup-carga] ${JSON.stringify(event)}`);
}

type PageArgs = Parameters<typeof fetchPagesConcurrently>;

async function fetchPagesCounted(
  load: ClickUpLoad,
  pageUrl: PageArgs[0],
  isLastPage: PageArgs[1],
  errorLabel: string,
  maxPage: number,
  pageCountKey?: string,
): ReturnType<typeof fetchPagesConcurrently> {
  const tasks: Awaited<ReturnType<typeof fetchPagesConcurrently>> = [];
  const planned = pageCountKey ? knownPageCount.get(pageCountKey) : undefined;
  // Última página a pedir mientras dure el plan (las páginas van de 0 a planned-1).
  let limit = planned !== undefined ? Math.min(planned - 1, maxPage) : maxPage;
  for (let start = 0; start <= maxPage; start += CLICKUP_MAX_CONCURRENCY) {
    const pages: number[] = [];
    for (let p = start; p < start + CLICKUP_MAX_CONCURRENCY && p <= limit; p++) pages.push(p);
    if (pages.length === 0) {
      // Se terminó el plan y la última página vino llena: seguir sin plan.
      limit = maxPage;
      start -= CLICKUP_MAX_CONCURRENCY;
      continue;
    }
    const results = await Promise.allSettled(
      pages.map(async (p) => {
        const res = await clickUpFetch(pageUrl(p), load);
        if (!res.ok) throw new Error(`${errorLabel} ${res.status}: ${await res.text()}`);
        return res.json();
      }),
    );
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "rejected") throw r.reason;
      const batch: any[] = r.value?.tasks ?? [];
      tasks.push(...batch);
      if (isLastPage(r.value, batch)) {
        if (pageCountKey) knownPageCount.set(pageCountKey, pages[i] + 1);
        return tasks;
      }
    }
    // Si esta tanda terminó el plan sin llegar a la última página, la próxima
    // vuelta arranca después de la última pedida.
    start = pages[pages.length - 1] + 1 - CLICKUP_MAX_CONCURRENCY;
  }
  return tasks;
}

async function fetchAllTasks(listId: string): Promise<any[]> {
  const tasks = await fetchPagesConcurrently(
    (page) =>
      `${BASE_URL}/list/${listId}/task?include_closed=true&subtasks=false&page=${page}&limit=100`,
    (_data, batch) => batch.length < 100,
    "ClickUp API error",
    Infinity,
    undefined,
    `list:${listId}`,
  );
  // FILTRO RADICAL: garantizar 100% que ninguna subtarea pase
  return tasks.filter((t) => !t.parent);
}

// ─── MAPPERS ───────────────────────────────────────────────

export function mapToTask(raw: any): WithPeople<Task> | null {
  const cf = raw.custom_fields ?? [];
  const statusRaw = raw.status?.status ?? "";
  const statusType = String(raw.status?.type ?? "").toLowerCase();
  const isClosed = statusType === "closed" || raw.date_closed != null;
  const closedAt = raw.date_closed ? msToDate(Number(raw.date_closed)) : null;

  // FILTRO ESTRICTO: descartar tareas con estados no reconocidos…
  let status = normalizeStatus<LLCStatus>(statusRaw, [...LLC_STATUS_FLOW_FULL]);
  // …PERO si la tarea está cerrada (date_closed presente o status.type=closed),
  // la aceptamos siempre. ClickUp puede devolver nombres de estado de cierre
  // que no están en nuestro flujo (p.ej. "complete", "done", "approved").
  // Estas tareas SÍ deben contar para los KPIs y promedios.
  if (status === null) {
    if (isClosed) status = "ENTREGA COMPLETADA";
    else return null;
  }


  // time_in_status: ClickUp v2 no lo expone directamente en la lista básica.
  // Usamos las fechas de custom fields para aproximarlo.
  const fechaCreacion =
    getCustomFieldValue(cf, "fecha_creacion") ?? msToDate(parseInt(raw.date_created))!;
  const envioTramite =
    getCustomFieldValue(cf, "envio_tramite") ?? getCustomFieldValue(cf, "envío tramite");
  const fechaSolicitudEin =
    getCustomFieldValue(cf, "fecha solicitud ein") ??
    getCustomFieldValue(cf, "fecha_solicitud_ein");
  const fechaRecepcionEin =
    getCustomFieldValue(cf, "fecha recepción ein") ??
    getCustomFieldValue(cf, "fecha recepcion ein") ??
    getCustomFieldValue(cf, "fecha_recepcion_ein");

// Demora del cliente: reconstruida desde las fechas crudas con businessDays,
  // porque el campo fórmula z_Demora cliente no exporta valor por la API.
  // Regla de negocio: si no hubo "Fecha solicitud a cliente", no hubo pedido
  // de corrección, así que la demora es 0.
  const fechaSolicitudCliente = getCustomFieldValue(cf, "fecha solicitud a cliente");
  const fechaCorreccionCliente =
    getCustomFieldValue(cf, "fecha corrección cliente") ??
    getCustomFieldValue(cf, "fecha correccion cliente");
  let demoraCliente: number;
  if (!fechaSolicitudCliente) {
    demoraCliente = 0;
  } else {
    const dcCalc = businessDays(fechaSolicitudCliente, fechaCorreccionCliente);
    demoraCliente = dcCalc === null ? NaN : Math.max(0, dcCalc);
  }

 // z_Tiempo interno: reconstruido desde fechas crudas (el campo fórmula no exporta valor).
  // Es la suma de tres tramos, replicando la lógica de ClickUp.
  const _inicioInterno = ajustarInicio18h(raw.date_created);
  const _fSolCli = getCustomFieldValue(cf, "fecha solicitud a cliente");
  const _fEnvio =
    getCustomFieldValue(cf, "envío del trámite") ?? getCustomFieldValue(cf, "envio del tramite");
  const _fCorrec =
    getCustomFieldValue(cf, "fecha corrección cliente") ??
    getCustomFieldValue(cf, "fecha correccion cliente");
  const _fAprob =
    getCustomFieldValue(cf, "aprobación del trámite") ??
    getCustomFieldValue(cf, "aprobacion del tramite");
  const _fSolEIN =
    getCustomFieldValue(cf, "fecha solicitud ein") ?? getCustomFieldValue(cf, "fecha solicitud EIN");

  // tramo1: inicio ajustado → (solicitud a cliente si la hubo, si no envío del trámite)
  const _finT1 = _fSolCli ? _fSolCli : _fEnvio;
  const _t1 = businessDays(_inicioInterno, _finT1);
  const tramo1 = _t1 === null ? 0 : Math.max(0, _t1);

  // tramo2: fecha corrección cliente → envío del trámite (0 si falta alguna)
  const _t2 = businessDays(_fCorrec, _fEnvio);
  const tramo2 = _t2 === null ? 0 : Math.max(0, _t2);

  // tramo3: aprobación del trámite → solicitud EIN (0 si falta alguna)
  const _t3 = businessDays(_fAprob, _fSolEIN);
  const tramo3 = _t3 === null ? 0 : Math.max(0, _t3);

  const tiempoInterno = tramo1 + tramo2 + tramo3;

  const einStatusRaw =
    getCustomFieldValue(cf, "ein_status") ?? getCustomFieldValue(cf, "ein status") ?? "n/a";
  const einStatus: EINStatus = ["pendiente", "solicitado", "recibido", "n/a"].includes(
    einStatusRaw.toLowerCase(),
  )
    ? (einStatusRaw.toLowerCase() as EINStatus)
    : "n/a";

  // time_in_status: calculamos con las fechas que tengamos
  const time_in_status: TimeInStatus = {};
  if (fechaCreacion && envioTramite)
    time_in_status["PENDIENTE"] = daysBetween(fechaCreacion, envioTramite);
  if (fechaSolicitudEin && fechaRecepcionEin)
    time_in_status["ESPERANDO EIN"] = daysBetween(fechaSolicitudEin, fechaRecepcionEin);

  const stateLabel = getDropdownLabel(cf, ["State", "Estado"]);
  const packageLabel = getDropdownLabel(cf, ["Paquete", "Package"]);

  return {
    id: raw.id,
    name: raw.name,
    status, // Ya validado arriba, no es null aquí
    process_type: "llc_formation",
    assignees: extractAssignees(raw),
    created_at: fechaCreacion,
    closed_at: closedAt,
    // date_created de ClickUp, no un campo personalizado: en estas listas no
    // existe "Fecha de creación" (verificado 2026-10-07).
    created_at_ms: rawMs(raw.date_created),
    closed_at_ms: rawMs(raw.date_closed),
    custom_fields: {
      fecha_creacion: fechaCreacion,
      envio_tramite: envioTramite,
      fecha_solicitud_ein: fechaSolicitudEin,
      fecha_recepcion_ein: fechaRecepcionEin,
      demora_cliente: isNaN(demoraCliente) ? null : demoraCliente,
      tiempo_interno: isNaN(tiempoInterno) ? null : tiempoInterno,
    },
    time_in_status,
    ein_status: einStatus,
    current_status_days: calcCurrentStatusDays(raw),
    state: normalizeState(stateLabel) ?? inferStateFromName(raw.name),
    package: normalizePackage(packageLabel) ?? inferPackageFromName(raw.name),
  };
}

export function mapToBankTask(raw: any): WithPeople<BankTask> | null {
  const cf = raw.custom_fields ?? [];
  const statusRaw = raw.status?.status ?? "";
  const statusType = String(raw.status?.type ?? "").toLowerCase();
  const isClosed = statusType === "closed" || raw.date_closed != null;
  const closedAt = raw.date_closed ? msToDate(Number(raw.date_closed)) : null;


  // Solo los 6 estados reales de la lista "Aplicaciones 2.0"
  const BANK_STATUSES: BankStatus[] = [
    "PENDIENTE",
    "ESPERANDO EIN",
    "ESPERANDO INPUT CLIENTE",
    "INFO ADICIONAL BANK",
    "VERIF IDENTIDAD",
    "INICIADA",
  ];

  // Extraccion de campos personalizados exactos de "Aplicaciones 2.0"
  const fechaCreacion =
    getCustomFieldValue(cf, "fecha de creaci��n") ??
    getCustomFieldValue(cf, "fecha de creacion") ??
    msToDate(parseInt(raw.date_created))!;
  const solicitudInfo = getCustomFieldValue(cf, "solicitud info");
  const fechaCorreccion =
    getCustomFieldValue(cf, "fecha correc.") ??
    getCustomFieldValue(cf, "fecha correc") ??
    getCustomFieldValue(cf, "fecha corrección") ??
    getCustomFieldValue(cf, "fecha correccion");
  const fechaAplicacion =
    getCustomFieldValue(cf, "fecha aplicación") ?? getCustomFieldValue(cf, "fecha aplicacion");
  const pedidoVerifId =
    getCustomFieldValue(cf, "pedido verif. id") ?? getCustomFieldValue(cf, "pedido verif id");
  const completaVerifId =
    getCustomFieldValue(cf, "completa verif. id") ?? getCustomFieldValue(cf, "completa verif id");
  const fechaAprobRech =
    getCustomFieldValue(cf, "fecha aprob/rech") ?? getCustomFieldValue(cf, "fecha aprob rech");
const fechaEin = getCustomFieldValue(cf, "fecha ein");
  
  // ═══════════════════════════════════════════════════════════════
  // FORMULAS DE RESPONSABILIDAD (solo se usan para tareas cerradas)
  // ═══════════════════════════════════════════════════════════════
  // A) Dias Cliente = (Fecha correccion - Solicitud info) + (Completa verif. ID - Pedido verif. ID)
  const esperaCorreccion = daysBetween(solicitudInfo, fechaCorreccion);
  const esperaVerifId = daysBetween(pedidoVerifId, completaVerifId);
  const clientWaitDays = esperaCorreccion + esperaVerifId;

  // B) Dias Banco = (Fecha aprob/rech - Fecha aplicacion) - (Completa verif. ID - Pedido verif. ID)
  let bankWaitDays = 0;
  if (fechaAplicacion && fechaAprobRech) {
    const totalBankProcess = daysBetween(fechaAplicacion, fechaAprobRech);
    bankWaitDays = Math.max(0, totalBankProcess - esperaVerifId);
  }

  // FILTRO de estado: en tareas ABIERTAS exigimos uno de los 6 oficiales.
  // Las CERRADAS se aceptan siempre (ClickUp puede devolverlas con estados
  // de cierre como "complete", "approved", "rejected" que no están en el
  // flujo abierto). Las contamos como "INICIADA" a efectos de tipado, pero
  // jamás aparecen en getBankStatusCounts (que filtra openTasks).
  let status = normalizeStatus<BankStatus>(statusRaw, BANK_STATUSES);
  if (status === null) {
    if (isClosed) status = "INICIADA";
    else return null;
  }


  // Alertas de bloqueo basadas en tiempo actual en estado
  const currentDays = calcCurrentStatusDays(raw);
  const blockingAlert: "client_blocked" | "bank_delay" | null =
    status === "ESPERANDO INPUT CLIENTE" && currentDays > 3
      ? "client_blocked"
      : (status === "VERIF IDENTIDAD" || status === "INFO ADICIONAL BANK") && currentDays > 7
        ? "bank_delay"
        : null;

  const stateLabel = getDropdownLabel(cf, ["State", "Estado"]);
  const packageLabel = getDropdownLabel(cf, ["Paquete", "Package"]);
  const bankLabel = getDropdownLabel(cf, ["Banco", "Bank"]);

  // Demoras numéricas ya calculadas por ClickUp (en días).
  // IMPORTANTE: respetar el nombre EXACTO del custom field (mayúsculas/espacios)
  // e ignorar valores vacíos, guion o indefinidos para no bajar el promedio.
  const findExactField = (fields: any[], name: string): any | null =>
    fields.find((f: any) => String(f?.name ?? "") === name) ?? null;
  const parseNumericCF = (raw: any): number => {
    if (!raw) return NaN;
    const v = raw.value;
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim();
    if (s === "" || s === "-") return NaN;
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
  };
  // z_Demora banco: reconstruida desde fechas crudas (el campo fórmula no exporta valor).
  // Regla: el reloj del banco arranca en "Completa verif ID" si existe; si no, en "Fecha aplicación".
  // Termina siempre en "Fecha aprob/rech". Días hábiles, nunca negativo.
  const _inicioBanco = completaVerifId ? completaVerifId : fechaAplicacion;
  const _dbCalc = businessDays(_inicioBanco, fechaAprobRech);
  const demoraBancoN = _dbCalc === null ? NaN : Math.max(0, _dbCalc);

 // z_Demora IRS: reconstruida desde fechas crudas (el campo fórmula no exporta valor).
  // Mide cuánto suma la espera del EIN a la aplicación bancaria:
  //  - Si no hay Fecha EIN → 0
  //  - Si el EIN llegó DESPUÉS de aplicar (no frenó la aplicación) → 0
  //  - Si hubo que esperar el EIN → desde corrección (si la hubo) o desde creación, hasta Fecha EIN
  let demoraIrsN: number;
  if (!fechaEin) {
    demoraIrsN = 0;
  } else if (fechaAplicacion && fechaEin > fechaAplicacion) {
    demoraIrsN = 0;
  } else {
    const _inicioIrs = fechaCorreccion ? fechaCorreccion : fechaCreacion;
    if (_inicioIrs && fechaEin > _inicioIrs) {
      const _diCalc = businessDays(_inicioIrs, fechaEin);
      demoraIrsN = _diCalc === null ? NaN : Math.max(0, _diCalc);
    } else {
      demoraIrsN = 0;
    }
  }
  // z_Tiempo de servicio: reconstruido desde fechas crudas.
  // Mide el proceso total: desde la creación (ajustada por regla 18h) hasta aprob/rech. Días hábiles.
  const _inicioServicio = ajustarInicio18h(raw.date_created);
  const _tsCalc = businessDays(_inicioServicio, fechaAprobRech);
  const tiempoServicioN = _tsCalc === null ? NaN : Math.max(0, _tsCalc);

  // z_Demora cliente (bancaria): Bloque 1 (info/corrección) + Bloque 2 (verif ID).
 // BLOQUE 1: tiempo que el cliente hizo esperar respondiendo la info/corrección.
  // Si el EIN cayó ENTRE solicitud info y corrección, se mide desde el EIN
  // (porque ese tramo previo fue espera del EIN, no del cliente).
  let _bloque1: number;
  if (!solicitudInfo || !fechaCorreccion) {
    _bloque1 = 0;
  } else {
    // ¿El EIN está estrictamente entre solicitud info y corrección?
    const _einEnMedio =
      fechaEin && fechaEin > solicitudInfo && fechaEin < fechaCorreccion;
    const _inicioB1 = _einEnMedio ? fechaEin : solicitudInfo;
    if (_inicioB1 !== fechaCorreccion) {
      const _b1 = businessDays(_inicioB1, fechaCorreccion);
      _bloque1 = _b1 === null ? 0 : Math.max(0, _b1);
    } else {
      _bloque1 = 0;
    }
  }
  
// BLOQUE 2: tiempo que el cliente tardó en completar la verificación de identidad.
  let _bloque2: number;
  if (!pedidoVerifId || !completaVerifId) {
    _bloque2 = 0;
  } else if (pedidoVerifId !== completaVerifId) {
    const _b2 = businessDays(pedidoVerifId, completaVerifId);
    _bloque2 = _b2 === null ? 0 : Math.max(0, _b2);
  } else {
    _bloque2 = 0;
  }

  // Demora cliente total = Bloque 1 + Bloque 2
  const demoraClienteN = _bloque1 + _bloque2;

  // z_Tiempo interno (bancaria): trabajo que Filings le carga al proceso.
  // Tramo 1: revisión inicial (inicio ajustado → solicitud info). Solo si hubo solicitud info.
  // Tramo 2: espera resuelta → aplicación (desde corrección/EIN el más tardío, hasta aplicación).
  const _inicioInterno = ajustarInicio18h(raw.date_created);

  // TRAMO 1
  let _tramoInt1: number;
  if (solicitudInfo) {
    const _t1 = businessDays(_inicioInterno, solicitudInfo);
    _tramoInt1 = _t1 === null ? 0 : Math.max(0, _t1);
  } else {
    _tramoInt1 = 0;
  }

  // TRAMO 2
  let _tramoInt2: number;
  if (!fechaAplicacion) {
    _tramoInt2 = 0;
  } else {
    // El EIN cuenta solo si llegó antes o el mismo día que la aplicación.
    const _einAplica = fechaEin && fechaEin <= fechaAplicacion ? fechaEin : null;
    // Inicio del tramo 2: el más tardío entre corrección y EIN (los que apliquen).
    let _inicioT2: string | null = null;
    if (fechaCorreccion && _einAplica) {
      _inicioT2 = fechaCorreccion > _einAplica ? fechaCorreccion : _einAplica;
    } else if (fechaCorreccion) {
      _inicioT2 = fechaCorreccion;
    } else if (_einAplica) {
      _inicioT2 = _einAplica;
    }
    if (_inicioT2) {
      const _t2 = businessDays(_inicioT2, fechaAplicacion);
      _tramoInt2 = _t2 === null ? 0 : Math.max(0, _t2);
    } else {
      _tramoInt2 = 0;
    }
  }

  const tiempoInternoN = _tramoInt1 + _tramoInt2;

  return {
    id: raw.id,
    name: raw.name,
    status,
    process_type: "bank_application",
    assignees: extractAssignees(raw),
    created_at: fechaCreacion,
    closed_at: closedAt,
    // date_created de ClickUp, no un campo personalizado: en estas listas no
    // existe "Fecha de creación" (verificado 2026-10-07).
    created_at_ms: rawMs(raw.date_created),
    closed_at_ms: rawMs(raw.date_closed),
    custom_fields: {
      fecha_creacion: fechaCreacion,
      solicitud_info: solicitudInfo,
      fecha_correccion: fechaCorreccion,
      fecha_aplicacion: fechaAplicacion,
      pedido_verif_id: pedidoVerifId,
      completa_verif_id: completaVerifId,
      fecha_aprob_rech: fechaAprobRech,
      demora_cliente: isNaN(demoraClienteN) ? null : demoraClienteN,
      tiempo_interno: isNaN(tiempoInternoN) ? null : tiempoInternoN,
      demora_banco: isNaN(demoraBancoN) ? null : demoraBancoN,
      demora_irs: isNaN(demoraIrsN) ? null : demoraIrsN,
      tiempo_servicio: isNaN(tiempoServicioN) ? null : tiempoServicioN,
    },
    time_in_status: {},
    current_status_days: currentDays,
    client_wait_days: clientWaitDays,
    bank_wait_days: bankWaitDays,
    blocking_alert: blockingAlert,
    state: normalizeState(stateLabel) ?? inferStateFromName(raw.name),
    package: normalizePackage(packageLabel) ?? inferPackageFromName(raw.name),
    bank: normalizeBank(bankLabel) ?? inferBankFromName(raw.name),
  };
}

// ─── CACHE EN MEMORIA (evita re-fetch en cada render) ──────
let _llcCache: { data: WithPeople<Task>[]; ts: number } | null = null;
let _bankCacheV4: { data: WithPeople<BankTask>[]; ts: number } | null = null;
// Vista "Métricas 2.0" de ClickUp — fuente de verdad para Aplicación Bancaria
const BANK_VIEW_ID = "8c901jk-6274";
// 20 minutos, igual en las 5 pantallas. La pantalla muestra siempre de cuándo
// son los datos ("datos de hace X min") y tiene un botón para actualizarlos
// desde ClickUp: el dato puede tener hasta 20 min, pero nunca en silencio.
export const CACHE_TTL_MS = 20 * 60 * 1000;
// "Actualizar" no vuelve a pedir a ClickUp si los datos tienen menos de esto:
// un botón que invita a clickear no puede convertirse en una ráfaga.
export const MIN_REFRESH_AGE_MS = 30 * 1000;

const loadLLCTasks = singleFlight(async () => {
  const raw = await fetchAllTasks(LIST_IDS.llc_formation);
  const data = raw.map(mapToTask).filter((t): t is WithPeople<Task> => t !== null);
  _llcCache = { data, ts: Date.now() };
  return data;
});

export async function fetchLLCTasks(): Promise<WithPeople<Task>[]> {
  if (_llcCache && Date.now() - _llcCache.ts < CACHE_TTL_MS) return _llcCache.data;
  return loadLLCTasks();
}

// Fuente: lista completa "Aplicaciones 2.0" (todas las tareas, sin filtro de vista).
const loadBankTasks = singleFlight(async () => {
  const raw = await fetchAllTasks(LIST_IDS.bank_application);
  const data = raw.map(mapToBankTask).filter((t): t is WithPeople<BankTask> => t !== null);
  _bankCacheV4 = { data, ts: Date.now() };
  return data;
});

export async function fetchBankTasks(): Promise<WithPeople<BankTask>[]> {
  if (_bankCacheV4 && Date.now() - _bankCacheV4.ts < CACHE_TTL_MS) return _bankCacheV4.data;
  return loadBankTasks();
}

// ─── ERRORES DE CARGA → PANTALLA ───────────────────────────
// Si ClickUp no responde dentro del tope, la server function responde 503 con
// un código (load-errors.ts) para que la pantalla muestre un mensaje claro.
//
// Cada corte deja una línea "[clickup-corte] {json}" en los logs, para saber
// con datos con qué frecuencia pasa: qué pantalla, a qué hora, cuántos pedidos
// llevaba esa carga, cuántos hizo esta instancia en el último minuto y qué
// cupo informaba ClickUp. No incluye datos de personas.
const INSTANCE = { id: Math.random().toString(36).slice(2, 10), since: new Date().toISOString() };
const AR_TIME = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function clickUpCutEvent(
  screen: string,
  error: ClickUpUnavailableError,
  now = new Date(Date.now()),
) {
  const rate = clickUpRateState();
  return {
    evento: "clickup_corte",
    pantalla: screen,
    motivo: error.reason,
    detalle: error.detail,
    hora_utc: now.toISOString(),
    hora_ar: AR_TIME.format(now),
    pedidos_en_esta_carga: error.requestsInLoad ?? null,
    pedidos_ultimo_minuto_instancia: clickUpRequestsLastMinute(now.getTime()),
    clickup_limite: rate.limit,
    clickup_restantes: rate.remaining,
    clickup_reinicio: rate.resetAt ? new Date(rate.resetAt).toISOString() : null,
    instancia: INSTANCE.id,
    instancia_desde: INSTANCE.since,
  };
}

async function clickUpGuard<T>(screen: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof ClickUpUnavailableError)) throw error;
    console.error(`[clickup-corte] ${JSON.stringify(clickUpCutEvent(screen, error))}`);
    const { setResponseStatus } = await import("@tanstack/react-start/server");
    setResponseStatus(503);
    throw new Error(error.reason === "saturado" ? CLICKUP_SATURADO : CLICKUP_NO_RESPONDE);
  }
}

// ─── FUNCIONES DE FILTRO (misma firma que mock-data.ts) ────
// Cada server function de lista delega en una función list* que recibe el
// loader como parámetro (los tests pasan datos fijos) y SIEMPRE termina en
// redactPeople.

type DateRangeInput = DayRange;

export interface LLCTasksInput {
  processType: ProcessType | "all";
  dateRange?: DateRangeInput;
  state?: StateType | "all";
  pkg?: PackageType | "all";
}

// Filtros de la pantalla que no son de fecha; los usa también getPeopleBreakdown.
function filterLLCTasks<T extends Task>(
  tasks: T[],
  { processType, state, pkg }: Partial<Omit<LLCTasksInput, "dateRange">>,
): T[] {
  if (processType && processType !== "all") {
    tasks = tasks.filter((t) => t.process_type === processType);
  }
  if (state && state !== "all") tasks = tasks.filter((t) => t.state === state);
  if (pkg && pkg !== "all") tasks = tasks.filter((t) => t.package === pkg);
  return tasks;
}

export async function listLLCTasks(
  { processType, dateRange, state, pkg }: LLCTasksInput,
  load: () => Promise<WithPeople<Task>[]> = fetchLLCTasks,
): Promise<Task[]> {
  let tasks = filterLLCTasks(await load(), { processType, state, pkg });
  if (dateRange?.from || dateRange?.to) {
    const bounds = periodBoundsMs(dateRange);
    // Cerrada → usar date_closed; Abierta → usar date_created (proxy de actividad).
    tasks = tasks.filter((t) => inPeriod(t.closed_at_ms ?? t.created_at_ms, bounds));
  }
  return redactPeople(tasks);
}

export const getFilteredTasks = createServerFn({ method: "GET" })
  .middleware([requireSession])
  .inputValidator((data: LLCTasksInput & ScreenRequest) => data)
  .handler(({ data }) => serveScreen("Formación LLC", "llc_formation", data, listLLCTasks));

export interface BankTasksInput {
  dateRange?: DateRangeInput;
  state?: StateType | "all";
  pkg?: PackageType | "all";
  bank?: BankType | "all";
}

export const getFilteredBankTasks = createServerFn({ method: "GET" })
  .middleware([requireSession])
  .inputValidator((data: BankTasksInput & ScreenRequest) => data)
  .handler(({ data }) =>
    serveScreen("Aplicación Bancaria", "bank_application", data, listBankTasks),
  );

function filterBankTasks<T extends BankTask>(
  tasks: T[],
  { state, pkg, bank }: Omit<BankTasksInput, "dateRange">,
): T[] {
  if (state && state !== "all") tasks = tasks.filter((t) => t.state === state);
  if (pkg && pkg !== "all") tasks = tasks.filter((t) => t.package === pkg);
  if (bank && bank !== "all") tasks = tasks.filter((t) => t.bank === bank);
  return tasks;
}

export async function listBankTasks(
  { dateRange, state, pkg, bank }: BankTasksInput,
  load: () => Promise<WithPeople<BankTask>[]> = fetchBankTasks,
): Promise<BankTask[]> {
  let tasks = filterBankTasks(await load(), { state, pkg, bank });
  if (dateRange?.from || dateRange?.to) {
    const bounds = periodBoundsMs(dateRange);
    // Filtro estricto por Fecha de Cierre real (date_closed), igual que Agentes Registrados.
    tasks = tasks.filter((t) => inPeriod(t.closed_at_ms, bounds));
  }
  return redactPeople(tasks);
}


// Stubs para las listas aún no conectadas
const ANNUAL_REPORTS_LIST_ID = "901406624812";
// Mismo caché de 5 minutos que las otras pantallas. Antes no vencía nunca: se
// refrescaba recién cuando reiniciaba la instancia, y podía mostrar datos de
// hace horas sin avisar.
let annualReportsCache: { data: WithPeople<AnnualReportTask>[]; ts: number } | null = null;

function mapAnnualStatus(raw: string): AnnualReportStatus {
  const s = (raw || "").toLowerCase().trim();
  if (s === "complete" || s === "completed" || s === "done" || s === "completado" || s === "closed")
    return "completado";
  if (s === "proximo a hacer" || s === "próximo a hacer" || s === "proximo_a_hacer")
    return "proximo_a_hacer";
  // 'pendiente' y cualquier otro estado intermedio caen en pendiente
  return "pendiente";
}

export function mapAnnualReportTask(t: any): WithPeople<AnnualReportTask> {
  const ms = t.date_created ? Number(t.date_created) : null;
  return {
    id: String(t.id),
    name: t.name ?? "",
    entity_name: t.name ?? "",
    due_date: t.due_date ?? "",
    filed_date: t.date_closed ?? null,
    date_created: msToDate(ms),
    date_created_ms: ms && isFinite(ms) ? ms : null,
    status: mapAnnualStatus(t?.status?.status ?? ""),
    state: "new_mexico" as StateType,
    package: "solo_llc" as PackageType,
    assignees: extractAssignees(t),
  };
}

const loadAnnualReportsTasks = singleFlight(async () => {
  const raw = await fetchAllTasks(ANNUAL_REPORTS_LIST_ID);
  const data = raw.map(mapAnnualReportTask);
  annualReportsCache = { data, ts: Date.now() };
  return data;
});

export async function fetchAnnualReportsTasks(): Promise<WithPeople<AnnualReportTask>[]> {
  if (annualReportsCache && Date.now() - annualReportsCache.ts < CACHE_TTL_MS) {
    return annualReportsCache.data;
  }
  return loadAnnualReportsTasks();
}

export interface AnnualReportsInput {
  state?: StateType | "all";
  pkg?: PackageType | "all";
  dateRange?: DateRangeInput;
}

export async function listAnnualReports(
  { dateRange }: AnnualReportsInput,
  load: () => Promise<WithPeople<AnnualReportTask>[]> = fetchAnnualReportsTasks,
): Promise<AnnualReportTask[]> {
  const all = await load();
  return redactPeople(filterByDateRange(all, dateRange));
}

export const getFilteredAnnualReports = createServerFn({ method: "GET" })
  .middleware([requireSession])
  .inputValidator((data: AnnualReportsInput & ScreenRequest) => data)
  .handler(({ data }) => serveScreen("Annual Reports", "annual_reports", data, listAnnualReports));

// ─── AGENTES REGISTRADOS (ClickUp list real) ───────────────
const REGISTERED_AGENTS_LIST_ID = "901406624813";
// Mismo caché de 5 minutos que las otras pantallas (antes no vencía nunca).
let registeredAgentsCache: { data: WithPeople<AgenteRegistradoTask>[]; ts: number } | null = null;

function mapAgenteStatus(raw: string): AgenteStatus {
  const s = (raw || "").toLowerCase().trim();
  if (s === "complete" || s === "completed" || s === "done" || s === "closed" || s === "completado")
    return "completado";
  if (s === "pendiente") return "pendiente";
  // Cualquier otro estado intermedio → en progreso (bucket "esperando_invoice")
  return "esperando_invoice";
}

export function mapRegisteredAgentTask(t: any): WithPeople<AgenteRegistradoTask> {
  const ms = t.date_created ? Number(t.date_created) : null;
  const closedMs = t.date_closed ? Number(t.date_closed) : null;
  const cf = t.custom_fields ?? [];
  const stateLabel = getDropdownLabel(cf, ["State", "Estado"]);
  const packageLabel = getDropdownLabel(cf, ["Paquete", "Package"]);
  return {
    id: String(t.id),
    name: t.name ?? "",
    entity_name: t.name ?? "",
    state: normalizeState(stateLabel) ?? inferStateFromName(t.name ?? ""),
    package: normalizePackage(packageLabel) ?? inferPackageFromName(t.name ?? ""),
    renewal_date: t.due_date ?? "",
    date_created: msToDate(ms),
    date_created_ms: ms && isFinite(ms) ? ms : null,
    date_closed_ms: closedMs && isFinite(closedMs) ? closedMs : null,
    status: mapAgenteStatus(t?.status?.status ?? ""),
    assignees: extractAssignees(t),
  };
}

const loadRegisteredAgentsTasks = singleFlight(async () => {
  const raw = await fetchAllTasks(REGISTERED_AGENTS_LIST_ID);
  const data = raw.map(mapRegisteredAgentTask);
  registeredAgentsCache = { data, ts: Date.now() };
  return data;
});

export async function fetchRegisteredAgentsTasks(): Promise<WithPeople<AgenteRegistradoTask>[]> {
  if (registeredAgentsCache && Date.now() - registeredAgentsCache.ts < CACHE_TTL_MS) {
    return registeredAgentsCache.data;
  }
  return loadRegisteredAgentsTasks();
}

export interface AgentesRegistradosInput {
  state?: StateType | "all";
  pkg?: PackageType | "all";
  dateRange?: DateRangeInput;
}

function filterAgentesRegistrados<T extends AgenteRegistradoTask>(
  all: T[],
  { state, pkg }: Omit<AgentesRegistradosInput, "dateRange">,
): T[] {
  if (state && state !== "all") all = all.filter((t) => t.state === state);
  if (pkg && pkg !== "all") all = all.filter((t) => t.package === pkg);
  return all;
}

export async function listAgentesRegistrados(
  { state, pkg, dateRange }: AgentesRegistradosInput,
  load: () => Promise<WithPeople<AgenteRegistradoTask>[]> = fetchRegisteredAgentsTasks,
): Promise<AgenteRegistradoTask[]> {
  const all = filterAgentesRegistrados(await load(), { state, pkg });
  return redactPeople(filterByClosedDateRange(all, dateRange));
}

export const getFilteredAgentesRegistrados = createServerFn({ method: "GET" })
  .middleware([requireSession])
  .inputValidator((data: AgentesRegistradosInput & ScreenRequest) => data)
  .handler(({ data }) =>
    serveScreen("Agentes Registrados", "agentes_registrados", data, listAgentesRegistrados),
  );

function filterByClosedDateRange<T extends { date_closed_ms: number | null }>(
  items: T[],
  dateRange?: DateRangeInput,
): T[] {
  const bounds = periodBoundsMs(dateRange);
  if (bounds.from === null && bounds.to === null) return items;
  return items.filter((t) => inPeriod(t.date_closed_ms, bounds));
}


function filterByDateRange<T extends { date_created_ms: number | null }>(
  items: T[],
  dateRange?: DateRangeInput,
): T[] {
  const bounds = periodBoundsMs(dateRange);
  if (bounds.from === null && bounds.to === null) return items;
  return items.filter((t) => inPeriod(t.date_created_ms, bounds));
}

// ─── KPI CALCULATORS (idénticos a mock-data.ts) ────────────

export function getFunnelData(tasks: Task[]) {
  const counts: Record<LLCStatus, number> = {
    PENDIENTE: 0,
    "NO INICIAR": 0,
    "ESPERANDO INPUT CLIENTE": 0,
    "ESPERANDO APROB": 0,
    "APROBADA EN ESTADO": 0,
    "1º ENTREGA DOCS": 0,
    FAXEADO: 0,
    "ESPERANDO EIN": 0,
    "EIN LISTO": 0,
    CANCELADO: 0,
    "ENTREGA COMPLETADA": 0,
  };
  tasks.forEach((t) => {
    counts[t.status]++;
  });
return LLC_STATUS_FLOW
    .filter((s) => s !== "ENTREGA COMPLETADA")
    .map((s) => ({ status: s, count: counts[s], fill: STATUS_COLORS[s] }));
}

export function calculateLeadTime(tasks: Task[]) {
  const done = tasks.filter((t) => t.closed_at);
  if (!done.length) return 0;
  const suma = done.reduce((s, t) => {
    const d = businessDays(t.created_at, t.closed_at!);
    return s + (d === null ? 0 : d);
  }, 0);
  return Math.round((suma / done.length) * 10) / 10;
}

export function calculateCycleTimeKPIs(tasks: Task[]) {
  const totalTasks = tasks.length;
  // "ENTREGA COMPLETADA" es el estado de cierre definitivo
  const completedTasks = tasks.filter((t) => t.status === "ENTREGA COMPLETADA").length;
  const cancelledTasks = tasks.filter((t) => t.status === "CANCELADO").length;
  const inProgressTasks = tasks.filter(
    (t) =>
      t.status !== "ENTREGA COMPLETADA" &&
      t.status !== "CANCELADO" &&
      t.status !== "PENDIENTE" &&
      t.status !== "NO INICIAR",
  ).length;
  const avgLeadTime = calculateLeadTime(tasks);
 // Espera EIN: días hábiles entre solicitud EIN y recepción EIN.
  // Solo tareas cerradas que tienen ambas fechas cargadas.
  const einWait = tasks.filter(
    (t) =>
      t.closed_at !== null &&
      t.custom_fields.fecha_solicitud_ein &&
      t.custom_fields.fecha_recepcion_ein,
  );

  const avgEINWait = einWait.length
    ? Math.round(
        (einWait.reduce((s, t) => {
          const d = businessDays(
            t.custom_fields.fecha_solicitud_ein!,
            t.custom_fields.fecha_recepcion_ein!,
          );
          return s + (d === null ? 0 : d);
        }, 0) /
          einWait.length) *
          10,
      ) / 10
    : 0;
  // Promedios de demora (días) desde custom fields ya calculados por ClickUp.
  let sumDemoraCliente = 0;
  let countDemoraCliente = 0;
  let sumTiempoInterno = 0;
  let countTiempoInterno = 0;
  for (const t of tasks) {
    const dc = t.custom_fields.demora_cliente;
    if (typeof dc === "number" && !isNaN(dc)) {
      sumDemoraCliente += dc;
      countDemoraCliente += 1;
    }
    const ti = t.custom_fields.tiempo_interno;
    if (typeof ti === "number" && !isNaN(ti)) {
      sumTiempoInterno += ti;
      countTiempoInterno += 1;
    }
  }
  const avgDemoraCliente = countDemoraCliente > 0 ? sumDemoraCliente / countDemoraCliente : 0;
  const avgTiempoInterno = countTiempoInterno > 0 ? sumTiempoInterno / countTiempoInterno : 0;

  return {
    totalTasks,
    completedTasks,
    cancelledTasks,
    inProgressTasks,
    avgLeadTime,
    avgEINWait,
    avgDemoraCliente,
    avgTiempoInterno,
  };
}

export function calculateBankKPIs(tasks: BankTask[]) {
  // ═══════════════════════════════════════════════════════════════
  // SEPARACION: OPEN tasks solo para conteos, CLOSED tasks para KPIs
  // ═══════════════════════════════════════════════════════════════
  const openTasks = tasks.filter((t) => !t.closed_at);
  const closedTasks = tasks.filter((t) => t.closed_at !== null);

  // KPIs de distribucion (todas las tareas)
  const totalTasks = tasks.length;
  // PENDIENTES: solo tareas ABIERTAS cuyo status actual es exactamente "PENDIENTE"
  const pendingTasks = tasks.filter((t) => !t.closed_at && t.status === "PENDIENTE").length;
  const inProgressTasks = openTasks.filter((t) => t.status !== "PENDIENTE").length;
  const completedTasks = closedTasks.length;

  // KPIs de tiempos (solo tareas cerradas)
 const avgLeadTime =
    closedTasks.length > 0
      ? Math.round(
          (closedTasks.reduce((sum, t) => {
            const d = businessDays(t.created_at, t.closed_at!);
            return sum + (d === null ? 0 : d);
          }, 0) /
            closedTasks.length) *
            10,
        ) / 10
      : 0;

  return { totalTasks, pendingTasks, inProgressTasks, completedTasks, avgLeadTime };
}

export function calculateBottleneckAnalysis(tasks: BankTask[]) {
  // ═══════════════════════════════════════════════════════════════
  // REGLA ESTRICTA: los promedios SOLO se calculan sobre tareas
  // CERRADAS dentro del rango. Nunca se usan tareas abiertas/en
  // progreso para sumar días a los promedios o a la gráfica temporal.
  // ═══════════════════════════════════════════════════════════════
  const closedTasks = tasks.filter((t) => t.closed_at !== null);

 const buildRow = (t: BankTask) => {
    const cf = t.custom_fields;
    // Usa los valores ya verificados (días hábiles, lógica correcta), no recalcula.
    const clientDays = typeof cf.demora_cliente === "number" ? Math.max(0, cf.demora_cliente) : 0;
    const bankDays = typeof cf.demora_banco === "number" ? Math.max(0, cf.demora_banco) : 0;

    return {
      name: t.name.replace(/Cuenta (Mercury|Relay|Lili) - /i, "").substring(0, 25),
      clientDays: Math.max(0, clientDays),
      bankDays: Math.max(0, bankDays),
      fullName: t.name,
      status: "Cerrada",
      blockingAlert: t.blocking_alert,
    };
  };

  const comparisonData = closedTasks.map(buildRow);

  const totalClientDays = comparisonData.reduce((s, t) => s + t.clientDays, 0);
  const totalBankDays = comparisonData.reduce((s, t) => s + t.bankDays, 0);
  const total = totalClientDays + totalBankDays;
  const n = comparisonData.length;
  const avgClientDays = n > 0 ? Math.round((totalClientDays / n) * 10) / 10 : 0;
  const clientResponsibilityRatio = total > 0 ? Math.round((totalClientDays / total) * 100) : 0;

  // Alertas de bloqueo (solo tareas abiertas — para volumen, no para promedios)
  const openTasks = tasks.filter((t) => !t.closed_at);
  const clientBlockedCount = openTasks.filter((t) => t.blocking_alert === "client_blocked").length;
  const bankDelayCount = openTasks.filter((t) => t.blocking_alert === "bank_delay").length;

  // Promedios forzados desde el MISMO array filtrado que usa la pestaña.
  // Ejemplo junio: totalTareas = 26 (dinámico con tasks.length). Cada null,
  // undefined, vacío o guion cuenta como 0 porque solo se suman números válidos.
  const totalTareas = tasks.length;
  let sumaDemoraCliente = 0;
  let sumaTiempoInterno = 0;
  let sumaDemoraBanco = 0;
  let sumaDemoraIRS = 0;

  for (const task of tasks) {
    const demoraCliente = task.custom_fields.demora_cliente;
    const tiempoInterno = task.custom_fields.tiempo_interno;
    const demoraBanco = task.custom_fields.demora_banco;
    const demoraIRS = task.custom_fields.demora_irs;

    if (typeof demoraCliente === "number" && isFinite(demoraCliente) && demoraCliente >= 0) {
      sumaDemoraCliente += demoraCliente;
    }
    if (typeof tiempoInterno === "number" && isFinite(tiempoInterno) && tiempoInterno >= 0) {
      sumaTiempoInterno += tiempoInterno;
    }
    if (typeof demoraBanco === "number" && isFinite(demoraBanco) && demoraBanco >= 0) {
      sumaDemoraBanco += demoraBanco;
    }
    if (typeof demoraIRS === "number" && isFinite(demoraIRS) && demoraIRS >= 0) {
      sumaDemoraIRS += demoraIRS;
    }
  }

  const avgDemoraCliente = totalTareas > 0 ? sumaDemoraCliente / totalTareas : 0;
  const avgTiempoInterno = totalTareas > 0 ? sumaTiempoInterno / totalTareas : 0;
  const avgBankDays = totalTareas > 0 ? Math.round((sumaDemoraBanco / totalTareas) * 100) / 100 : 0;
  const avgDemoraIRS = totalTareas > 0 ? sumaDemoraIRS / totalTareas : 0;

  // Ratios de las 4 categorías (porcentaje sobre la suma de las 4 demoras).
  const sumaTotal4 = avgDemoraCliente + avgTiempoInterno + avgBankDays + avgDemoraIRS;
  const ratioCliente = sumaTotal4 > 0 ? Math.round((avgDemoraCliente / sumaTotal4) * 100) : 0;
  const ratioInterno = sumaTotal4 > 0 ? Math.round((avgTiempoInterno / sumaTotal4) * 100) : 0;
  const ratioBanco = sumaTotal4 > 0 ? Math.round((avgBankDays / sumaTotal4) * 100) : 0;
  const ratioIRS = sumaTotal4 > 0 ? Math.round((avgDemoraIRS / sumaTotal4) * 100) : 0;
  
return {
    comparisonData,
    clientResponsibilityRatio,
    avgClientDays,
    avgBankDays,
    avgDemoraCliente,
    avgTiempoInterno,
    avgDemoraIRS,
    ratioCliente,
    ratioInterno,
    ratioBanco,
    ratioIRS,
    clientBlockedCount,
    bankDelayCount,
    closedTasksCount: closedTasks.length,
  };
}

export function getBankStatusCounts(tasks: BankTask[]) {
  // Solo contar tareas ABIERTAS para distribucion por estado
  const openTasks = tasks.filter((t) => !t.closed_at);

  const counts: Record<BankStatus, number> = {
    PENDIENTE: 0,
    "ESPERANDO EIN": 0,
    "ESPERANDO INPUT CLIENTE": 0,
    "INFO ADICIONAL BANK": 0,
    "VERIF IDENTIDAD": 0,
    INICIADA: 0,
  };

  openTasks.forEach((t) => {
    if (counts[t.status] !== undefined) {
      counts[t.status]++;
    }
  });

  return BANK_DISPLAY_STATUSES.map((s) => ({
    status: s,
    count: counts[s],
    color: BANK_STATUS_COLORS[s],
  }));
}

// Stubs KPI para listas no conectadas aún
export function calculateAnnualReportsKPIs(tasks: AnnualReportTask[]) {
  const kpis = { total: tasks.length, pendiente: 0, proximoAHacer: 0, completado: 0 };
  tasks.forEach((t) => {
    if (t.status === "completado") kpis.completado++;
    else if (t.status === "proximo_a_hacer") kpis.proximoAHacer++;
    else kpis.pendiente++;
  });
  return kpis;
}
export function getAnnualReportsPieData(tasks: AnnualReportTask[]) {
  const k = calculateAnnualReportsKPIs(tasks);
  return [
    { name: "Completado", value: k.completado, fill: "#22c55e" },
    { name: "Proximo a Hacer", value: k.proximoAHacer, fill: "#f59e0b" },
    { name: "Pendiente", value: k.pendiente, fill: "#6366f1" },
  ];
}
export function calculateAgentesKPIs(tasks: AgenteRegistradoTask[]) {
  const kpis = { total: tasks.length, pendiente: 0, esperandoInvoice: 0, completado: 0, completionRate: 0 };
  tasks.forEach((t) => {
    if (t.status === "completado") kpis.completado++;
    else if (t.status === "esperando_invoice") kpis.esperandoInvoice++;
    else kpis.pendiente++;
  });
  kpis.completionRate = kpis.total > 0 ? Math.round((kpis.completado / kpis.total) * 100) : 0;
  return kpis;
}
export function getAgentesStatusChartData(tasks: AgenteRegistradoTask[]) {
  const k = calculateAgentesKPIs(tasks);
  return [
    { status: "Pendiente", count: k.pendiente, fill: "#6366f1" },
    { status: "En Progreso", count: k.esperandoInvoice, fill: "#f59e0b" },
    { status: "Completado", count: k.completado, fill: "#22c55e" },
  ];
}
// ─── EXTREMOS DE CICLO (más rápida / más lenta) ────────────
export interface TaskExtreme {
  name: string;
  days: number;
}

function computeExtremes(
  items: { name: string; created_at: string; closed_at: string | null }[],
): { fastest: TaskExtreme | null; slowest: TaskExtreme | null } {
  const closed = items
    .filter((t) => t.closed_at)
    .map((t) => {
      const start = new Date(t.created_at).getTime();
      const end = new Date(t.closed_at!).getTime();
      if (!isFinite(start) || !isFinite(end) || end < start) return null;
      const days = Math.max(0, Math.ceil((end - start) / 86400000));
      return { name: t.name, days };
    })
    .filter((x): x is TaskExtreme => x !== null);
  if (closed.length === 0) return { fastest: null, slowest: null };
  const fastest = closed.reduce((a, b) => (b.days < a.days ? b : a));
  const slowest = closed.reduce((a, b) => (b.days > a.days ? b : a));
  return { fastest, slowest };
}

export function getLLCTaskExtremes(tasks: Task[]) {
  return computeExtremes(tasks);
}

export function getBankTaskExtremes(tasks: BankTask[]) {
  return computeExtremes(tasks);
}

// ═══════════════════════════════════════════════════════════════
// TAX RETURN (ClickUp List: 901407106445)
// ═══════════════════════════════════════════════════════════════
// Es un ID de lista: /view/901407106445 da 404 (View Not Found).
const TAX_RETURN_LIST_ID = "901407106445";

export type TipoLLC = "Single-member" | "Multi-member" | "Priority-MM" | "Priority-SM";
export const TIPOS_LLC: { id: TipoLLC | "all"; name: string }[] = [
  { id: "all", name: "Todos" },
  { id: "Single-member", name: "Single-member" },
  { id: "Multi-member", name: "Multi-member" },
  { id: "Priority-MM", name: "Priority-MM" },
  { id: "Priority-SM", name: "Priority-SM" },
];

export interface TaxReturnTask {
  id: string;
  name: string;
  status: string;
  isClosed: boolean;
  tipoLLC: string | null;
  created_at_ms: number | null;
  closed_at_ms: number | null;
  diasInfoACierre: number | null;
  diasInfoAEnvioFirma: number | null;
  diasFirmaACierre: number | null;
  diasLeadTime: number | null;
  diasDemoraCliente: number | null;
}

// IDs de custom fields verificados contra la API real de ClickUp
// (lista "Tax Return" — 901407106445).
const TAX_RETURN_FIELD_IDS = {
  infoRecibida: "dcfbc610-a620-4f20-817e-13dbd63aeffa",
  envioFirmarCliente: "6840720f-6c24-44c6-a583-ff267efced4b",
  reciboFirma: "bad02203-2935-483d-9c1d-a8523cae7aa1",
};

let _taxReturnCache: { data: WithPeople<TaxReturnTask>[]; ts: number } | null = null;

// Tope de páginas (0..50) para no quedar en loop si ClickUp nunca marca el fin.
const TAX_RETURN_MAX_PAGE = 50;

async function fetchAllTasksByList(listId: string): Promise<any[]> {
  const tasks = await fetchPagesConcurrently(
    (page) => `${BASE_URL}/list/${listId}/task?page=${page}&subtasks=false&include_closed=true`,
    (data, batch) => data?.last_page === true || batch.length < 100,
    "ClickUp List API error",
    TAX_RETURN_MAX_PAGE,
    undefined,
    `tax:${listId}`,
  );
  return tasks.filter((t) => !t.parent);
}

function getCustomFieldDropdownLabel(fields: any[], name: string): string | null {
  if (!Array.isArray(fields)) return null;
  const target = name.toLowerCase().trim();
  const f = fields.find((f: any) => String(f?.name ?? "").toLowerCase().trim() === target);
  if (!f) return null;
  const v = f.value;
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string") {
    if (Array.isArray(f.type_config?.options)) {
      const opt = f.type_config.options.find(
        (o: any) => String(o?.id) === v || String(o?.orderindex) === v,
      );
      if (opt?.name) return String(opt.name);
    }
    return v;
  }
  if (typeof v === "number") {
    const opt = f.type_config?.options?.[v];
    if (opt?.name) return String(opt.name);
    return String(v);
  }
  if (typeof v === "object") {
    if ("name" in v && v.name) return String(v.name);
    if ("label" in v && v.label) return String(v.label);
  }
  return null;
}

const TIPO_LLC_FIELD_NAMES = ["tipo llc", "tipo de llc"];

export function mapTaxReturnTask(raw: any): WithPeople<TaxReturnTask> | null {
  const cf = raw?.custom_fields ?? [];
  const statusRaw = String(raw?.status?.status ?? "");
  const statusType = String(raw?.status?.type ?? "").toLowerCase();
  const isClosed = statusType === "closed";

  let tipoLLC: string | null = null;
  for (const n of TIPO_LLC_FIELD_NAMES) {
    tipoLLC = getCustomFieldDropdownLabel(cf, n);
    if (tipoLLC) break;
  }

  const createdMs = raw?.date_created ? Number(raw.date_created) : null;
  const closedMs = raw?.date_closed ? Number(raw.date_closed) : null;

  const infoRecibidaStr = getCustomFieldDateById(cf, TAX_RETURN_FIELD_IDS.infoRecibida);
  const envioFirmarStr = getCustomFieldDateById(cf, TAX_RETURN_FIELD_IDS.envioFirmarCliente);
  const reciboFirmaStr = getCustomFieldDateById(cf, TAX_RETURN_FIELD_IDS.reciboFirma);
  // date_closed solo es una fecha de cierre válida cuando isClosed es true.
  const fechaCierreStr = isClosed ? msToDate(raw?.date_closed ?? null) : null;
  const fechaCreacionAjustadaStr = ajustarInicio18h(raw?.date_created ?? null);

  return {
    id: String(raw.id),
    name: raw?.name ?? "",
    status: statusRaw,
    isClosed,
    // Sin el "Sin asignar" de relleno que había antes: el conteo por
    // colaborador lo descartaba igual, así que los números no cambian.
    assignees: extractAssignees(raw),
    tipoLLC,
    created_at_ms: createdMs && isFinite(createdMs) ? createdMs : null,
    closed_at_ms: closedMs && isFinite(closedMs) ? closedMs : null,
    // Métrica 1: tiempo en completar tax desde Info Recibida (solo cerradas)
    diasInfoACierre: isClosed ? businessDays(infoRecibidaStr, fechaCierreStr) : null,
    // Métrica 2: demora interna en enviar a firmar (se puede calcular aunque no esté cerrada)
    diasInfoAEnvioFirma: businessDays(infoRecibidaStr, envioFirmarStr),
    // Métrica 3: demora interna de presentación, desde recibo de firma (solo cerradas)
    diasFirmaACierre: isClosed ? businessDays(reciboFirmaStr, fechaCierreStr) : null,
    // Métrica 4: lead time desde compra (creación ajustada por regla 18h), solo cerradas
    diasLeadTime: isClosed ? businessDays(fechaCreacionAjustadaStr, fechaCierreStr) : null,
    // Demora Cliente (bottleneck): desde que se envía a firmar hasta que el cliente firma
    diasDemoraCliente: businessDays(envioFirmarStr, reciboFirmaStr),
  };
}

const loadTaxReturnTasks = singleFlight(async () => {
  const raw = await fetchAllTasksByList(TAX_RETURN_LIST_ID);
  const data = raw.map(mapTaxReturnTask).filter((t): t is WithPeople<TaxReturnTask> => t !== null);
  _taxReturnCache = { data, ts: Date.now() };
  return data;
});

export async function fetchTaxReturnTasks(): Promise<WithPeople<TaxReturnTask>[]> {
  if (_taxReturnCache && Date.now() - _taxReturnCache.ts < CACHE_TTL_MS) return _taxReturnCache.data;
  return loadTaxReturnTasks();
}

export interface TaxReturnsInput {
  dateRange?: DateRangeInput;
  tipoLLC?: TipoLLC | "all";
}

function matchesTipoLLC(t: TaxReturnTask, tipoLLC: TipoLLC | "all" | undefined): boolean {
  if (!tipoLLC || tipoLLC === "all") return true;
  return (t.tipoLLC ?? "").toLowerCase().trim() === tipoLLC.toLowerCase().trim();
}

function filterTaxReturns<T extends TaxReturnTask>(
  all: T[],
  { dateRange, tipoLLC }: TaxReturnsInput,
): T[] {
  const bounds = periodBoundsMs(dateRange);

  return all.filter((t) => {
    if (!matchesTipoLLC(t, tipoLLC)) return false;
    // Cerrada → date_closed; Abierta → date_created
    return inPeriod(t.isClosed ? t.closed_at_ms : t.created_at_ms, bounds);
  });
}

export async function listTaxReturns(
  input: TaxReturnsInput,
  load: () => Promise<WithPeople<TaxReturnTask>[]> = fetchTaxReturnTasks,
): Promise<TaxReturnTask[]> {
  return redactPeople(filterTaxReturns(await load(), input));
}

export const getFilteredTaxReturns = createServerFn({ method: "GET" })
  .middleware([requireSession])
  .inputValidator((data: TaxReturnsInput & ScreenRequest) => data)
  .handler(({ data }) => serveScreen("Tax Return", "tax_return", data, listTaxReturns));

export function calculateTaxReturnKPIs(tasks: TaxReturnTask[]) {
  const closed = tasks.filter((t) => t.isClosed);
  const open = tasks.filter((t) => !t.isClosed);

  // Conteo por estado de las abiertas
  const byStatus: Record<string, number> = {};
  for (const t of open) {
    const s = (t.status || "Sin estado").trim() || "Sin estado";
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }
  const inProgressByStatus = Object.entries(byStatus)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const avgOf = (values: (number | null)[]) => {
    const valid = values.filter((v): v is number => v !== null && isFinite(v));
    const avg = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    return { avg, count: valid.length };
  };

  const infoACierre = avgOf(tasks.map((t) => t.diasInfoACierre));
  const infoAEnvioFirma = avgOf(tasks.map((t) => t.diasInfoAEnvioFirma));
  const firmaACierre = avgOf(tasks.map((t) => t.diasFirmaACierre));
  const leadTime = avgOf(tasks.map((t) => t.diasLeadTime));

  // Bottleneck de 2 categorías (equivalente a BottleneckAnalysis de Aplicación
  // Bancaria, pero sin IRS ni Banco). A diferencia de ahí, el divisor de los
  // promedios es EXACTAMENTE la cantidad de tasks cerradas con dato válido —
  // coincide con lo que dice el texto de la tarjeta.
  const demoraCliente = avgOf(closed.map((t) => t.diasDemoraCliente));
  const demoraInterna = avgOf(
    closed.map((t) => (t.diasInfoAEnvioFirma ?? 0) + (t.diasFirmaACierre ?? 0)),
  );
  const sumaDemoras = demoraCliente.avg + demoraInterna.avg;
  const ratioCliente = sumaDemoras > 0 ? Math.round((demoraCliente.avg / sumaDemoras) * 100) : 0;
  const ratioInterno = sumaDemoras > 0 ? 100 - ratioCliente : 0;

  return {
    totalCompleted: closed.length,
    inProgressTotal: open.length,
    inProgressByStatus,
    avgDiasInfoACierre: infoACierre.avg,
    countDiasInfoACierre: infoACierre.count,
    avgDiasInfoAEnvioFirma: infoAEnvioFirma.avg,
    countDiasInfoAEnvioFirma: infoAEnvioFirma.count,
    avgDiasFirmaACierre: firmaACierre.avg,
    countDiasFirmaACierre: firmaACierre.count,
    avgDiasLeadTime: leadTime.avg,
    countDiasLeadTime: leadTime.count,
    avgDemoraCliente: demoraCliente.avg,
    countDemoraCliente: demoraCliente.count,
    avgDemoraInterna: demoraInterna.avg,
    countDemoraInterna: demoraInterna.count,
    ratioCliente,
    ratioInterno,
  };
}

// ─── DATOS POR PERSONA ─────────────────────────────────────
// Único camino por el que viajan datos de personas al navegador. Genérico por
// proceso: verifica el permiso para ESE proceso (PEOPLE_DATA_PERMISSIONS) y
// responde 403 si no lo tiene.

// Qué cuenta, igual para los 5 procesos: tareas CERRADAS cuya fecha de cierre
// cae en el período, agrupadas por el asignado ACTUAL en ClickUp (no por quien
// la cerró). Una tarea compartida suma 1 a cada participante (ownCount /
// sharedCount lo distinguen) y las cerradas sin asignado van aparte, en
// unassignedCount, no como una persona más.

export interface PeopleBreakdownInput {
  process: DashboardProcess;
  dateRange?: DateRangeInput;
  // Los filtros de la pantalla que no son de fecha; cada proceso usa los suyos.
  filters?: {
    processType?: ProcessType | "all";
    state?: StateType | "all";
    pkg?: PackageType | "all";
    bank?: BankType | "all";
    tipoLLC?: TipoLLC | "all";
  };
}

// Pensado para crecer: más métricas dentro de `metrics` y, para la vista de
// resumen, las tareas de cada persona en el período.
export interface PeopleBreakdown {
  process: DashboardProcess;
  // Días de calendario "YYYY-MM-DD", cortados en hora argentina.
  period: { from: string | null; to: string | null; basis: "closed_at" };
  // Tareas cerradas en el período, cada una contada una sola vez.
  closedTotal: number;
  // De esas, las que no tienen ningún asignado.
  unassignedCount: number;
  people: {
    name: string;
    metrics: { closedCount: number; ownCount: number; sharedCount: number };
  }[];
}

type PeopleFilters = NonNullable<PeopleBreakdownInput["filters"]>;

interface PeopleSource<T> {
  load: () => Promise<WithPeople<T>[]>;
  // Los mismos filtros que la lista de la pantalla.
  filter: (items: WithPeople<T>[], filters: PeopleFilters) => WithPeople<T>[];
  isClosed: (t: T) => boolean;
  closedAtMs: (t: T) => number | null;
}

const msOrNull = (v: number | null) => (typeof v === "number" && isFinite(v) ? v : null);

// La fecha de cierre es la misma que usa el filtro de cada lista, salvo
// Annual Reports, cuya pantalla filtra por creación: acá usa date_closed para
// que los 5 gráficos sean comparables (la interfaz lo aclara).
type ProcessRecord = {
  llc_formation: Task;
  bank_application: BankTask;
  annual_reports: AnnualReportTask;
  agentes_registrados: AgenteRegistradoTask;
  tax_return: TaxReturnTask;
};

const arClosedMs = (t: AnnualReportTask) => (t.filed_date ? msOrNull(Number(t.filed_date)) : null);

const PEOPLE_SOURCES: { [P in DashboardProcess]: PeopleSource<ProcessRecord[P]> } = {
  llc_formation: {
    load: fetchLLCTasks,
    filter: (items, f) => filterLLCTasks(items, f),
    isClosed: (t) => t.closed_at_ms !== null,
    closedAtMs: (t) => t.closed_at_ms,
  },
  bank_application: {
    load: fetchBankTasks,
    filter: (items, f) => filterBankTasks(items, f),
    isClosed: (t) => t.closed_at_ms !== null,
    closedAtMs: (t) => t.closed_at_ms,
  },
  annual_reports: {
    load: fetchAnnualReportsTasks,
    filter: (items) => items,
    isClosed: (t) => arClosedMs(t) !== null,
    closedAtMs: arClosedMs,
  },
  agentes_registrados: {
    load: fetchRegisteredAgentsTasks,
    filter: (items, f) => filterAgentesRegistrados(items, f),
    isClosed: (t) => msOrNull(t.date_closed_ms) !== null,
    closedAtMs: (t) => msOrNull(t.date_closed_ms),
  },
  tax_return: {
    load: fetchTaxReturnTasks,
    filter: (items, f) => items.filter((t) => matchesTipoLLC(t, f.tipoLLC)),
    // Igual que antes: cerrada = estado de tipo "closed" en ClickUp.
    isClosed: (t) => t.isClosed,
    closedAtMs: (t) => msOrNull(t.closed_at_ms),
  },
};

export type PeopleLoaders = {
  [P in DashboardProcess]?: () => Promise<WithPeople<ProcessRecord[P]>[]>;
};

export async function buildPeopleBreakdown(
  { process, dateRange, filters }: PeopleBreakdownInput,
  load: PeopleLoaders = {},
): Promise<PeopleBreakdown> {
  // TypeScript no correlaciona process con su tipo de tarea; acá solo se usan
  // los campos comunes (assignees) y las funciones del propio source.
  const source = PEOPLE_SOURCES[process] as unknown as PeopleSource<object>;
  const loader = (load[process] ?? source.load) as () => Promise<WithPeople<object>[]>;
  const items = source.filter(await loader(), filters ?? {});

  // Mismos límites de día que los filtros de las listas (medianoche argentina).
  const bounds = periodBoundsMs(dateRange);
  const closed = items.filter((t) => source.isClosed(t) && inPeriod(source.closedAtMs(t), bounds));

  const people = new Map<string, { closedCount: number; ownCount: number; sharedCount: number }>();
  let unassignedCount = 0;
  for (const t of closed) {
    const names = [...new Set(t.assignees.filter((a) => a && a !== "Sin asignar"))];
    if (names.length === 0) unassignedCount++;
    for (const name of names) {
      const m = people.get(name) ?? { closedCount: 0, ownCount: 0, sharedCount: 0 };
      m.closedCount++;
      if (names.length > 1) m.sharedCount++;
      else m.ownCount++;
      people.set(name, m);
    }
  }

  return {
    process,
    period: {
      from: dateRange?.from ?? null,
      to: dateRange?.to ?? null,
      basis: "closed_at",
    },
    closedTotal: closed.length,
    unassignedCount,
    people: Array.from(people.entries())
      .map(([name, metrics]) => ({ name, metrics }))
      .sort((a, b) => b.metrics.closedCount - a.metrics.closedCount),
  };
}

export class InvalidPeopleProcessError extends Error {}
export class ForbiddenPeopleError extends Error {}

// La decisión de permiso, separada del handler para poder testearla.
// `canSee` es canSeePeople de permissions.server.ts (se pasa como parámetro
// para no importar ese módulo desde acá, que también carga el cliente).
export async function peopleBreakdownFor(
  email: string,
  input: PeopleBreakdownInput,
  canSee: (email: string, process: DashboardProcess) => boolean,
  load?: Parameters<typeof buildPeopleBreakdown>[1],
): Promise<PeopleBreakdown> {
  if (!isDashboardProcess(input?.process)) throw new InvalidPeopleProcessError("Proceso inválido");
  if (!canSee(email, input.process)) {
    throw new ForbiddenPeopleError("Sin permiso para ver datos por persona de este proceso");
  }
  return buildPeopleBreakdown(input, load);
}

// ─── PANTALLA COMPLETA EN UN SOLO PEDIDO ───────────────────
// Cada pantalla pide lista y gráfico por colaborador en el MISMO pedido al
// servidor: el gráfico se calcula con las mismas tareas que la lista, así que
// salen de una sola carga de ClickUp. Antes eran dos pedidos simultáneos que
// Vercel podía atender en instancias distintas, y cada una cargaba todo de
// ClickUp (y el gráfico se pedía aunque nadie abriera esa pestaña).
// Con withPeople y sin permiso para ese proceso: 403, sin tocar ClickUp. Las
// tareas de la lista siguen sin datos de personas (redactPeople); los nombres
// viajan solo en `people`.

export interface ScreenRequest {
  withPeople?: boolean;
  // Botón "Actualizar": descarta el caché de esa pantalla y carga desde ClickUp.
  refresh?: boolean;
}

export interface ScreenData<T> {
  tasks: T[];
  people: PeopleBreakdown | null;
  // Cuándo se cargaron estos datos desde ClickUp (ms), para mostrar su antigüedad.
  fetchedAt: number | null;
  // Se pidió "Actualizar" pero los datos tenían menos de MIN_REFRESH_AGE_MS y no
  // se volvió a pedir a ClickUp: la pantalla lo avisa en vez de no hacer nada.
  refreshSkipped: boolean;
}

// Hora de carga del caché de cada pantalla, y cómo descartarlo.
export function screenCacheLoadedAt(process: DashboardProcess): number | null {
  const cache = {
    llc_formation: _llcCache,
    bank_application: _bankCacheV4,
    annual_reports: annualReportsCache,
    agentes_registrados: registeredAgentsCache,
    tax_return: _taxReturnCache,
  }[process];
  return cache?.ts ?? null;
}

export function dropScreenCache(process: DashboardProcess, now = Date.now()): boolean {
  const loadedAt = screenCacheLoadedAt(process);
  if (loadedAt !== null && now - loadedAt < MIN_REFRESH_AGE_MS) return false;
  if (process === "llc_formation") _llcCache = null;
  else if (process === "bank_application") _bankCacheV4 = null;
  else if (process === "annual_reports") annualReportsCache = null;
  else if (process === "agentes_registrados") registeredAgentsCache = null;
  else _taxReturnCache = null;
  return true;
}

// La decisión, separada del handler para poder testearla.
export async function screenDataFor<T, I extends { dateRange?: DateRangeInput }>(
  email: string | null,
  process: DashboardProcess,
  input: I & ScreenRequest,
  list: (input: I) => Promise<T[]>,
  canSee: (email: string, process: DashboardProcess) => boolean,
  load?: PeopleLoaders,
): Promise<ScreenData<T>> {
  const withPeople = input?.withPeople === true;
  if (withPeople && (!email || !canSee(email, process))) {
    throw new ForbiddenPeopleError("Sin permiso para ver datos por persona de este proceso");
  }
  const refreshSkipped = input?.refresh === true && !dropScreenCache(process);
  const tasks = await list(input);
  const people = withPeople
    ? await buildPeopleBreakdown(
        { process, dateRange: input.dateRange, filters: input as PeopleFilters },
        load,
      )
    : null;
  return { tasks, people, fetchedAt: screenCacheLoadedAt(process), refreshSkipped };
}

async function serveScreen<T, I extends { dateRange?: DateRangeInput }>(
  screen: string,
  process: DashboardProcess,
  data: I & ScreenRequest,
  list: (input: I) => Promise<T[]>,
): Promise<ScreenData<T>> {
  const [{ getRequest, setResponseStatus }, { assertValidSession }, { canSeePeople }] =
    await Promise.all([
      import("@tanstack/react-start/server"),
      import("./auth.server"),
      import("./permissions.server"),
    ]);
  // El email sale de la cookie de este request y no de `context`, porque
  // TanStack mezcla en `context` lo que manda el cliente.
  const email =
    data?.withPeople === true ? (await assertValidSession(getRequest())).user.email : null;
  try {
    return await clickUpGuard(screen, () =>
      screenDataFor(email, process, data, list, canSeePeople),
    );
  } catch (error) {
    if (error instanceof ForbiddenPeopleError) setResponseStatus(403);
    throw error;
  }
}

// Tarea más rápida / más lenta según el mismo criterio que "Lead Time desde
// Compra" (diasLeadTime: businessDays sobre fecha de creación ajustada por
// la regla de las 18h, solo tareas cerradas) — no una fórmula nueva.
export function getTaxReturnTaskExtremes(
  tasks: TaxReturnTask[],
): { fastest: TaskExtreme | null; slowest: TaskExtreme | null } {
  const closed = tasks
    .filter((t): t is TaxReturnTask & { diasLeadTime: number } => t.diasLeadTime !== null)
    .map((t) => ({ name: t.name, days: t.diasLeadTime }));
  if (closed.length === 0) return { fastest: null, slowest: null };
  const fastest = closed.reduce((a, b) => (b.days < a.days ? b : a));
  const slowest = closed.reduce((a, b) => (b.days > a.days ? b : a));
  return { fastest, slowest };
}

// Cuenta días hábiles (lunes a viernes) entre dos fechas,
// replicando NETWORKDAYS de ClickUp con tu convención del workspace:
//  - mismo día = 0
//  - no cuenta el día de inicio (regla NETWORKDAYS de ClickUp)
//  - nunca negativo
function businessDays(startStr: string | null, endStr: string | null): number | null {
  if (!startStr || !endStr) return null;   // falta una fecha → lo decide quien la llama
  if (startStr === endStr) return 0;        // mismo día = 0 (tu regla)

  const cur = new Date(startStr + "T12:00:00");
  const end = new Date(endStr + "T12:00:00");
  if (isNaN(cur.getTime()) || isNaN(end.getTime())) return null;
  if (end < cur) return 0;                  // fin antes que inicio → 0

let count = 0;
  cur.setDate(cur.getDate() + 1);   // no contar el día de inicio (regla NETWORKDAYS de ClickUp)
  while (cur <= end) {
    const day = cur.getDay();               // 0 = domingo, 6 = sábado
    if (day !== 0 && day !== 6) count++;     // solo suma días hábiles
    cur.setDate(cur.getDate() + 1);          // avanza un día
  }
  return count;
}

// Ajusta la fecha de inicio según la regla de las 18h (hora Argentina):
// si la tarea se creó a las 18:00 o después, el reloj interno arranca
// el siguiente día hábil. Devuelve la fecha ajustada como "YYYY-MM-DD".
function ajustarInicio18h(dateCreatedMs: string | number | null): string | null {
  if (!dateCreatedMs) return null;
  const ms = typeof dateCreatedMs === "string" ? parseInt(dateCreatedMs) : dateCreatedMs;
  if (isNaN(ms)) return null;

  const d = new Date(ms);

  // Leemos la HORA en zona horaria de Argentina (no la del servidor).
  const horaArg = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      hour12: false,
    }).format(d),
  );

  // Leemos la FECHA (año-mes-día) también en zona Argentina.
  const fechaArg = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // en-CA da formato "YYYY-MM-DD"

  // Si se creó a las 18h o después → correr al siguiente día hábil.
  if (horaArg >= 18) {
    const base = new Date(fechaArg + "T12:00:00");
    base.setDate(base.getDate() + 1);              // día siguiente
    while (base.getDay() === 0 || base.getDay() === 6) {
      base.setDate(base.getDate() + 1);            // si cae finde, seguir hasta hábil
    }
    return base.toISOString().split("T")[0];
  }

  // Si se creó antes de las 18h → usar la fecha de creación tal cual.
  return fechaArg;
}
