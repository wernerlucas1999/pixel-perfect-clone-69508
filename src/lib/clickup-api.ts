// ============================================================
// clickup-api.ts
// Reemplaza lib/mock-data.ts con datos reales de ClickUp.
// Instrucciones: copiá este archivo a lib/clickup-api.ts
// y actualizá los imports en app/page.tsx (ver abajo).
// ============================================================

// ─── CONFIG ────────────────────────────────────────────────
// Recomendado: mové el token a .env.local como:
//   NEXT_PUBLIC_CLICKUP_TOKEN=pk_49618794_...
// y reemplazá la línea de abajo por:
//   const CLICKUP_TOKEN = process.env.NEXT_PUBLIC_CLICKUP_TOKEN!
const CLICKUP_TOKEN = "pk_49618794_OA2IWD79GWYGL70C3W2UEENSRE77JSKV";

const LIST_IDS = {
  llc_formation: "900200216635", // Lista "To-do 2.0"
  bank_application: "900200216649", // Lista "Aplicaciones 2.0"
  // annual_reports:    "TU_ID_AQUI",   // Completar después
  // agentes_registrados: "TU_ID_AQUI", // Completar después
  // ticketera_cx:      "TU_ID_AQUI",   // Completar después
};

const BASE_URL = "https://api.clickup.com/api/v2";

// ─── TYPES (se mantienen igual que mock-data.ts) ───────────
export type ProcessType =
  | "llc_formation"
  | "bank_application"
  | "annual_reports"
  | "agentes_registrados"
  | "ticketera_cx"
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
}

export interface TimeInStatus {
  [status: string]: number;
}

export interface Task {
  id: string;
  name: string;
  status: LLCStatus;
  process_type: ProcessType;
  assignee: string;
  created_at: string;
  closed_at: string | null;
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
  assignee: string;
  created_at: string;
  closed_at: string | null;
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
  { id: "ticketera_cx", name: "Ticketera CX-Filings", color: "#ec4899" },
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
  assignee: string;
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
  status: AgenteStatus;
  assignee: string;
}
export interface CXTicket {
  id: string;
  subject: string;
  client_name: string;
  created_at: string;
  created_at_ms: number | null;
  first_response_at: string | null;
  first_response_at_ms: number | null;
  response_delay_ms: number | null;
  resolved_at: string | null;
  status: "abierto" | "en_progreso" | "resuelto" | "cerrado";
  priority: "alta" | "media" | "baja";
  state: StateType;
  package: PackageType;
  assignee: string;
  assignees: string[];
}

// ─── HELPERS ───────────────────────────────────────────────

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

// ─── FETCHER GENÉRICO ──────────────────────────────────────

async function fetchAllTasks(listId: string): Promise<any[]> {
  const tasks: any[] = [];
  let page = 0;
  while (true) {
    const res = await fetch(
      `${BASE_URL}/list/${listId}/task?include_closed=true&subtasks=false&page=${page}&limit=100`,
      { headers: { Authorization: CLICKUP_TOKEN } },
    );
    if (!res.ok) throw new Error(`ClickUp API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    tasks.push(...(data.tasks ?? []));
    if (!data.tasks?.length || data.tasks.length < 100) break;
    page++;
  }
  // FILTRO RADICAL: garantizar 100% que ninguna subtarea pase
  return tasks.filter((t) => !t.parent);
}

// Bulk time-in-status: { taskId: { status_history: [{status, total_time:{by_minute, since}}], current_status: {...} } }
async function fetchBulkTimeInStatus(taskIds: string[]): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  for (let i = 0; i < taskIds.length; i += 100) {
    const batch = taskIds.slice(i, i + 100);
    const qs = batch.map((id) => `task_ids=${encodeURIComponent(id)}`).join("&");
    try {
      const res = await fetch(`${BASE_URL}/task/bulk_time_in_status/task_ids/?${qs}`, {
        headers: { Authorization: CLICKUP_TOKEN },
      });
      if (!res.ok) continue;
      const data = await res.json();
      Object.assign(out, data ?? {});
    } catch {
      // batch error: continuamos con datos parciales
    }
  }
  return out;
}

// Suma minutos en un status específico (case-insensitive) recorriendo todo el historial
function minutesInStatus(entry: any, statusName: string): number {
  if (!entry) return 0;
  const target = statusName.trim().toUpperCase();
  let total = 0;
  const history = Array.isArray(entry.status_history) ? entry.status_history : [];
  for (const h of history) {
    if (String(h.status ?? "").trim().toUpperCase() === target) {
      total += Number(h.total_time?.by_minute ?? 0);
    }
  }
  if (
    entry.current_status &&
    String(entry.current_status.status ?? "").trim().toUpperCase() === target
  ) {
    total += Number(entry.current_status.total_time?.by_minute ?? 0);
  }
  return total;
}

// ─── MAPPERS ───────────────────────────────────────────────

function mapToTask(raw: any): Task | null {
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
    getCustomFieldValue(cf, "fecha_solicitud_ein") ??
    getCustomFieldValue(cf, "fecha solicitud ein");
  const fechaRecepcionEin =
    getCustomFieldValue(cf, "fecha_recepcion_ein") ??
    getCustomFieldValue(cf, "fecha recepcion ein");

  // Demoras numéricas ya calculadas por ClickUp (en días).
  const demoraClienteRaw = findField(cf, ["z_Demora cliente"]);
  const tiempoInternoRaw = findField(cf, ["z_Tiempo interno"]);
  const demoraCliente = demoraClienteRaw ? parseFloat(demoraClienteRaw.value) : NaN;
  const tiempoInterno = tiempoInternoRaw ? parseFloat(tiempoInternoRaw.value) : NaN;

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
    assignee: raw.assignees?.[0]?.username ?? raw.assignees?.[0]?.email ?? "—",
    created_at: fechaCreacion,
    closed_at: closedAt,
    custom_fields: {
      fecha_creacion: fechaCreacion,
      envio_tramite: envioTramite,
      fecha_solicitud_ein: fechaSolicitudEin,
      fecha_recepcion_ein: fechaRecepcionEin,
    },
    time_in_status,
    ein_status: einStatus,
    current_status_days: calcCurrentStatusDays(raw),
    state: normalizeState(stateLabel) ?? inferStateFromName(raw.name),
    package: normalizePackage(packageLabel) ?? inferPackageFromName(raw.name),
  };
}

function mapToBankTask(raw: any): BankTask | null {
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
    getCustomFieldValue(cf, "fecha corrección") ?? getCustomFieldValue(cf, "fecha correccion");
  const fechaAplicacion =
    getCustomFieldValue(cf, "fecha aplicación") ?? getCustomFieldValue(cf, "fecha aplicacion");
  const pedidoVerifId =
    getCustomFieldValue(cf, "pedido verif. id") ?? getCustomFieldValue(cf, "pedido verif id");
  const completaVerifId =
    getCustomFieldValue(cf, "completa verif. id") ?? getCustomFieldValue(cf, "completa verif id");
  const fechaAprobRech =
    getCustomFieldValue(cf, "fecha aprob/rech") ?? getCustomFieldValue(cf, "fecha aprob rech");

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

  return {
    id: raw.id,
    name: raw.name,
    status,
    process_type: "bank_application",
    assignee: raw.assignees?.[0]?.username ?? raw.assignees?.[0]?.email ?? "—",
    created_at: fechaCreacion,
    closed_at: closedAt,
    custom_fields: {
      fecha_creacion: fechaCreacion,
      solicitud_info: solicitudInfo,
      fecha_correccion: fechaCorreccion,
      fecha_aplicacion: fechaAplicacion,
      pedido_verif_id: pedidoVerifId,
      completa_verif_id: completaVerifId,
      fecha_aprob_rech: fechaAprobRech,
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
let _llcCache: { data: Task[]; ts: number } | null = null;
let _bankCache: { data: BankTask[]; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export async function fetchLLCTasks(): Promise<Task[]> {
  if (_llcCache && Date.now() - _llcCache.ts < CACHE_TTL_MS) return _llcCache.data;
  const raw = await fetchAllTasks(LIST_IDS.llc_formation);
  const data = raw.map(mapToTask).filter((t): t is Task => t !== null);

  // ── EIN real: tiempo transcurrido en "ESPERANDO EIN" desde el status_history
  try {
    const tis = await fetchBulkTimeInStatus(data.map((t) => t.id));
    for (const t of data) {
      const entry = tis[t.id];
      const mins = minutesInStatus(entry, "ESPERANDO EIN");
      if (mins > 0) {
        t.time_in_status["ESPERANDO EIN"] = Math.round((mins / (60 * 24)) * 10) / 10;
      }
    }
  } catch {
    // si falla, mantenemos el aprox por custom fields
  }

  _llcCache = { data, ts: Date.now() };
  return data;
}

export async function fetchBankTasks(): Promise<BankTask[]> {
  if (_bankCache && Date.now() - _bankCache.ts < CACHE_TTL_MS) return _bankCache.data;
  const raw = await fetchAllTasks(LIST_IDS.bank_application);
  const data = raw.map(mapToBankTask).filter((t): t is BankTask => t !== null);
  _bankCache = { data, ts: Date.now() };
  return data;
}

// ─── FUNCIONES DE FILTRO (misma firma que mock-data.ts) ────

export async function getFilteredTasks(
  processType: ProcessType | "all",
  dateRange?: { from: Date | null; to: Date | null },
  state?: StateType | "all",
  pkg?: PackageType | "all",
): Promise<Task[]> {
  let tasks = await fetchLLCTasks();
  if (processType !== "all") tasks = tasks.filter((t) => t.process_type === processType);
  if (state && state !== "all") tasks = tasks.filter((t) => t.state === state);
  if (pkg && pkg !== "all") tasks = tasks.filter((t) => t.package === pkg);
  if (dateRange?.from || dateRange?.to) {
    const fromMs = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
    const toMs = dateRange?.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null;
    tasks = tasks.filter((t) => {
      // Cerrada → usar date_closed; Abierta → usar date_created (proxy de actividad).
      const refStr = t.closed_at ?? t.created_at;
      if (!refStr) return false;
      const refMs = new Date(refStr).getTime();
      if (isNaN(refMs)) return false;
      if (fromMs !== null && refMs < fromMs) return false;
      if (toMs !== null && refMs > toMs) return false;
      return true;
    });
  }
  return tasks;
}

export async function getFilteredBankTasks(
  dateRange?: { from: Date | null; to: Date | null },
  state?: StateType | "all",
  pkg?: PackageType | "all",
  bank?: BankType | "all",
): Promise<BankTask[]> {
  let tasks = await fetchBankTasks();
  if (state && state !== "all") tasks = tasks.filter((t) => t.state === state);
  if (pkg && pkg !== "all") tasks = tasks.filter((t) => t.package === pkg);
  if (bank && bank !== "all") tasks = tasks.filter((t) => t.bank === bank);
  if (dateRange?.from || dateRange?.to) {
    const fromMs = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
    const toMs = dateRange?.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null;
    tasks = tasks.filter((t) => {
      // Cerrada → date_closed (obligatorio en rango). Abierta → date_created.
      const refStr = t.closed_at ?? t.created_at;
      if (!refStr) return false;
      const refMs = new Date(refStr).getTime();
      if (isNaN(refMs)) return false;
      if (fromMs !== null && refMs < fromMs) return false;
      if (toMs !== null && refMs > toMs) return false;
      return true;
    });
  }
  return tasks;
}


// Stubs para las listas aún no conectadas
const ANNUAL_REPORTS_LIST_ID = "901406624812";
let annualReportsCache: AnnualReportTask[] | null = null;

function mapAnnualStatus(raw: string): AnnualReportStatus {
  const s = (raw || "").toLowerCase().trim();
  if (s === "complete" || s === "completed" || s === "done" || s === "completado" || s === "closed")
    return "completado";
  if (s === "proximo a hacer" || s === "próximo a hacer" || s === "proximo_a_hacer")
    return "proximo_a_hacer";
  // 'pendiente' y cualquier otro estado intermedio caen en pendiente
  return "pendiente";
}

export async function fetchAnnualReportsTasks(): Promise<AnnualReportTask[]> {
  if (annualReportsCache) return annualReportsCache;
  const raw = await fetchAllTasks(ANNUAL_REPORTS_LIST_ID);
  annualReportsCache = raw.map((t: any) => {
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
      assignee: t?.assignees?.[0]?.username ?? "",
    };
  });
  return annualReportsCache!;
}

export async function getFilteredAnnualReports(
  _state?: StateType | "all",
  _pkg?: PackageType | "all",
  dateRange?: { from: Date | null; to: Date | null },
): Promise<AnnualReportTask[]> {
  const all = await fetchAnnualReportsTasks();
  return filterByDateRange(all, dateRange);
}

// ─── AGENTES REGISTRADOS (ClickUp list real) ───────────────
const REGISTERED_AGENTS_LIST_ID = "901406624813";
let registeredAgentsCache: AgenteRegistradoTask[] | null = null;

function mapAgenteStatus(raw: string): AgenteStatus {
  const s = (raw || "").toLowerCase().trim();
  if (s === "complete" || s === "completed" || s === "done" || s === "closed" || s === "completado")
    return "completado";
  if (s === "pendiente") return "pendiente";
  // Cualquier otro estado intermedio → en progreso (bucket "esperando_invoice")
  return "esperando_invoice";
}

export async function fetchRegisteredAgentsTasks(): Promise<AgenteRegistradoTask[]> {
  if (registeredAgentsCache) return registeredAgentsCache;
  const raw = await fetchAllTasks(REGISTERED_AGENTS_LIST_ID);
  registeredAgentsCache = raw.map((t: any) => {
    const ms = t.date_created ? Number(t.date_created) : null;
    return {
      id: String(t.id),
      name: t.name ?? "",
      entity_name: t.name ?? "",
      state: "new_mexico" as StateType,
      package: "solo_llc" as PackageType,
      renewal_date: t.due_date ?? "",
      date_created: msToDate(ms),
      date_created_ms: ms && isFinite(ms) ? ms : null,
      status: mapAgenteStatus(t?.status?.status ?? ""),
      assignee: t?.assignees?.[0]?.username ?? "",
    };
  });
  return registeredAgentsCache!;
}

export async function getFilteredAgentesRegistrados(
  _state?: StateType | "all",
  _pkg?: PackageType | "all",
  dateRange?: { from: Date | null; to: Date | null },
): Promise<AgenteRegistradoTask[]> {
  const all = await fetchRegisteredAgentsTasks();
  return filterByDateRange(all, dateRange);
}

function filterByDateRange<T extends { date_created_ms: number | null }>(
  items: T[],
  dateRange?: { from: Date | null; to: Date | null },
): T[] {
  const from = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
  const to = dateRange?.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null;
  if (from === null && to === null) return items;
  return items.filter((t) => {
    const ms = t.date_created_ms;
    if (typeof ms !== "number" || !isFinite(ms)) return false;
    if (from !== null && ms < from) return false;
    if (to !== null && ms > to) return false;
    return true;
  });
}

// ─── TICKETERA / CX (ClickUp list real) ────────────────────
const TICKETERA_LIST_ID = "901409992423";
let ticketeraCache: CXTicket[] | null = null;

const TICKETERA_IN_PROGRESS = new Set([
  "filings working",
  "cx working",
  "client imput",
  "client input",
  "accounting working",
]);
const TICKETERA_COMPLETED = new Set(["ticket solucionado", "ticket cerrado"]);

function mapTicketeraStatus(raw: string): CXTicket["status"] {
  const raw0 = (raw || "").trim();
  // Validación exacta para PENDIENTE en mayúsculas
  if (raw0.toUpperCase() === "PENDIENTE") return "abierto";
  const s = raw0.toLowerCase();
  if (TICKETERA_IN_PROGRESS.has(s)) return "en_progreso";
  if (TICKETERA_COMPLETED.has(s)) return "resuelto";
  // Tareas fuera del flujo definido se ignoran del total
  return "cerrado";
}

const FIRST_RESPONSE_FIELD_NAMES = [
  "fecha de respuesta",
  "fecha respuesta",
];

const RESPONSE_DELAY_FIELD_NAMES = [
  "demora primera respuesta",
  "demora primer respuesta",
  "demora de primera respuesta",
];

function getCustomFieldNumber(fields: any[], names: string[]): number | null {
  if (!Array.isArray(fields)) return null;
  const lowered = names.map((n) => n.toLowerCase().trim());
  // Match exacto o por palabras clave ("demora" + "respuesta")
  const f = fields.find((f: any) => {
    const nm = String(f?.name ?? "").toLowerCase().trim();
    if (!nm) return false;
    if (lowered.includes(nm)) return true;
    if (nm.includes("demora") && nm.includes("respuesta")) return true;
    return false;
  });
  if (!f || f.value === undefined || f.value === null || f.value === "") return null;
  let raw: any = f.value;
  if (typeof raw === "object") raw = raw.value ?? raw.number ?? raw;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).trim());
  return isFinite(n) ? n : null;
}

const CREATION_FIELD_NAMES = [
  "fecha de creación",
  "fecha de creacion",
  "creation date",
  "fecha creación",
  "fecha creacion",
];

function parseFlexibleDateMs(value: any): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && isFinite(value) && value > 0) return value;
  const str = String(value).trim();
  if (!str) return null;
  if (/^\d+$/.test(str)) {
    const n = Number(str);
    return isFinite(n) && n > 0 ? n : null;
  }
  const dmy = str.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (dmy) {
    let y = parseInt(dmy[3]);
    if (y < 100) y += 2000;
    const m = parseInt(dmy[2]) - 1;
    const d = parseInt(dmy[1]);
    const hh = dmy[4] ? parseInt(dmy[4]) : 0;
    const mm = dmy[5] ? parseInt(dmy[5]) : 0;
    const ss = dmy[6] ? parseInt(dmy[6]) : 0;
    const ts = Date.UTC(y, m, d, hh, mm, ss);
    return isFinite(ts) ? ts : null;
  }
  const parsed = Date.parse(str);
  return isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getCustomFieldMs(fields: any[], names: string[]): number | null {
  if (!Array.isArray(fields)) return null;
  const lowered = names.map((n) => n.toLowerCase().trim());
  const f = fields.find((f: any) =>
    lowered.includes(String(f?.name ?? "").toLowerCase().trim()),
  );
  if (!f) return null;
  const raw =
    f.value && typeof f.value === "object" && "date" in f.value ? f.value.date : f.value;
  return parseFlexibleDateMs(raw);
}

export async function fetchTicketeraTasks(): Promise<CXTicket[]> {
  if (ticketeraCache) return ticketeraCache;
  const raw = await fetchAllTasks(TICKETERA_LIST_ID);
  ticketeraCache = raw
    .map((t: any): CXTicket | null => {
      const rawStatus = (t?.status?.status ?? "").toLowerCase().trim();
      const isPendiente = rawStatus === "pendiente";
      const isInProgress = TICKETERA_IN_PROGRESS.has(rawStatus);
      const isCompleted = TICKETERA_COMPLETED.has(rawStatus);
      if (!isPendiente && !isInProgress && !isCompleted) return null;
      const customCreatedMs = getCustomFieldMs(t?.custom_fields ?? [], CREATION_FIELD_NAMES);
      const dateCreatedMs = t?.date_created ? Number(t.date_created) : null;
      // Filtro estricto por task.date_created (lo usa el filtro de rango del header)
      const createdMs =
        dateCreatedMs && isFinite(dateCreatedMs) ? dateCreatedMs : customCreatedMs;
      const firstRespMs = getCustomFieldMs(t?.custom_fields ?? [], FIRST_RESPONSE_FIELD_NAMES);
      const responseDelayMs = getCustomFieldNumber(
        t?.custom_fields ?? [],
        RESPONSE_DELAY_FIELD_NAMES,
      );
      const assignees: string[] = Array.isArray(t?.assignees)
        ? t.assignees.map((a: any) => a?.username ?? a?.email ?? "Sin asignar").filter(Boolean)
        : [];
      return {
        id: String(t.id),
        subject: t.name ?? "",
        client_name: assignees[0] ?? "",
        created_at: msToDate(createdMs) ?? "",
        created_at_ms: createdMs && isFinite(createdMs) ? createdMs : null,
        first_response_at: msToDate(firstRespMs),
        first_response_at_ms: firstRespMs,
        response_delay_ms: responseDelayMs,
        resolved_at: msToDate(t.date_closed),
        status: mapTicketeraStatus(rawStatus),
        priority: "media",
        state: "new_mexico" as StateType,
        package: "solo_llc" as PackageType,
        assignee: assignees[0] ?? "Sin asignar",
        assignees: assignees.length > 0 ? assignees : ["Sin asignar"],
      };
    })
    .filter((t): t is CXTicket => t !== null);
  return ticketeraCache;
}

export async function getFilteredCXTickets(
  _state?: StateType | "all",
  _pkg?: PackageType | "all",
  dateRange?: { from: Date | null; to: Date | null },
): Promise<CXTicket[]> {
  const all = await fetchTicketeraTasks();
  const from = dateRange?.from ? dateRange.from.getTime() : null;
  // Incluir el día "to" completo (hasta 23:59:59.999)
  const to = dateRange?.to
    ? new Date(dateRange.to).setHours(23, 59, 59, 999)
    : null;
  if (from === null && to === null) return all;
  return all.filter((t) => {
    const ms = t.created_at_ms;
    if (typeof ms !== "number" || !isFinite(ms)) return false;
    if (from !== null && ms < from) return false;
    if (to !== null && ms > to) return false;
    return true;
  });
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
  return LLC_STATUS_FLOW.map((s) => ({ status: s, count: counts[s], fill: STATUS_COLORS[s] }));
}

export function getAverageTimeByStatus(tasks: Task[]) {
  const times: Record<LLCStatus, number[]> = {
    PENDIENTE: [],
    "NO INICIAR": [],
    "ESPERANDO INPUT CLIENTE": [],
    "ESPERANDO APROB": [],
    "APROBADA EN ESTADO": [],
    "1º ENTREGA DOCS": [],
    FAXEADO: [],
    "ESPERANDO EIN": [],
    "EIN LISTO": [],
    CANCELADO: [],
    "ENTREGA COMPLETADA": [],
  };
  tasks.forEach((t) =>
    Object.entries(t.time_in_status).forEach(([s, d]) => {
      if (times[s as LLCStatus] && s !== "NO INICIAR") times[s as LLCStatus].push(d);
    }),
  );
  return LLC_STATUS_FLOW.map((s) => {
    const arr = times[s];
    const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return { status: s, avgDays: Math.round(avg * 10) / 10, fill: STATUS_COLORS[s] };
  });
}

export function calculateLeadTime(tasks: Task[]) {
  const done = tasks.filter((t) => t.closed_at);
  if (!done.length) return 0;
  return Math.round(
    done.reduce((s, t) => {
      return (
        s +
        Math.ceil((new Date(t.closed_at!).getTime() - new Date(t.created_at).getTime()) / 86400000)
      );
    }, 0) / done.length,
  );
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
  // EIN: SOLO tareas CERRADAS dentro del rango y con tiempo real > 0 en
  // "ESPERANDO EIN". Excluye tareas en curso (no distorsiona el promedio)
  // y excluye registros con 0 minutos (procesos que se saltaron el paso).
  const einWait = tasks.filter(
    (t) => t.closed_at !== null && (t.time_in_status["ESPERANDO EIN"] ?? 0) > 0,
  );
  const avgEINWait = einWait.length
    ? Math.round(
        einWait.reduce((s, t) => s + (t.time_in_status["ESPERANDO EIN"] ?? 0), 0) / einWait.length,
      )
    : 0;
  const delayedTasks = tasks.filter((t) =>
    (
      ["ESPERANDO INPUT CLIENTE", "ESPERANDO APROB", "FAXEADO", "ESPERANDO EIN"] as LLCStatus[]
    ).some((st) => (t.time_in_status[st] ?? 0) > 5),
  ).length;
  return {
    totalTasks,
    completedTasks,
    cancelledTasks,
    inProgressTasks,
    avgLeadTime,
    avgEINWait,
    delayedTasks,
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
          closedTasks.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const closed = new Date(t.closed_at!);
            return sum + Math.ceil((closed.getTime() - created.getTime()) / 86400000);
          }, 0) / closedTasks.length,
        )
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
    const esperaCorreccion = daysBetween(cf.solicitud_info, cf.fecha_correccion);
    const esperaVerifId = daysBetween(cf.pedido_verif_id, cf.completa_verif_id);
    const clientDays = esperaCorreccion + esperaVerifId;

    let bankDays = 0;
    if (cf.fecha_aplicacion && cf.fecha_aprob_rech) {
      const totalBankProcess = daysBetween(cf.fecha_aplicacion, cf.fecha_aprob_rech);
      bankDays = Math.max(0, totalBankProcess - esperaVerifId);
    }

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
  // Sin tareas cerradas en el rango => 0 (la UI muestra "0 días"). NO se usa
  // tiempo de tareas en curso para no distorsionar el promedio.
  const avgClientDays = n > 0 ? Math.round((totalClientDays / n) * 10) / 10 : 0;
  const avgBankDays = n > 0 ? Math.round((totalBankDays / n) * 10) / 10 : 0;
  const clientResponsibilityRatio = total > 0 ? Math.round((totalClientDays / total) * 100) : 0;

  // Alertas de bloqueo (solo tareas abiertas — para volumen, no para promedios)
  const openTasks = tasks.filter((t) => !t.closed_at);
  const clientBlockedCount = openTasks.filter((t) => t.blocking_alert === "client_blocked").length;
  const bankDelayCount = openTasks.filter((t) => t.blocking_alert === "bank_delay").length;

  return {
    comparisonData,
    clientResponsibilityRatio,
    avgClientDays,
    avgBankDays,
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
export function calculateCXTicketsKPIs(tickets: CXTicket[]) {
  const pendientes = tickets.filter((t) => t.status === "abierto").length;
  const enProgreso = tickets.filter((t) => t.status === "en_progreso").length;
  const completadas = tickets.filter((t) => t.status === "resuelto").length;
  const totalTickets = pendientes + enProgreso + completadas;

  // Usar directamente el Custom Field "Demora primera respuesta" (en días) calculado por ClickUp.
  // parseFloat puro, sin redondeos intermedios.
  let totalDemora = 0;
  let cantidadTicketsValidos = 0;
  let sameDayCount = 0;
  for (const t of tickets) {
    const raw = t.response_delay_ms;
    if (raw === null || raw === undefined) continue;
    const n = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (isNaN(n) || !isFinite(n)) continue;
    totalDemora += n;
    cantidadTicketsValidos += 1;
    if (n < 1) sameDayCount += 1;
  }
  const avgResponseDays =
    cantidadTicketsValidos > 0 ? totalDemora / cantidadTicketsValidos : 0;
  const sameDayPercent =
    cantidadTicketsValidos > 0
      ? Math.round((sameDayCount / cantidadTicketsValidos) * 100)
      : 0;

  const resolutionRate = totalTickets > 0 ? Math.round((completadas / totalTickets) * 100) : 0;

  return {
    totalTickets,
    pendientes,
    enProgreso,
    completadas,
    abiertos: pendientes + enProgreso,
    resueltos: completadas,
    respondedTickets: cantidadTicketsValidos,
    // Mantengo el nombre del campo por compat; el valor es el promedio en DÍAS sin redondear.
    avgResponseHours: avgResponseDays,
    avgResponseTime: avgResponseDays * 24 * 60,
    sameDayPercent,
    avgResolutionTime: 0,
    resolutionRate,
    prioridadAlta: 0,
    prioridadMedia: 0,
    prioridadBaja: 0,
  };
}

const CX_ALLOWED_ASSIGNEES = ["Tomas Susevich", "Camila Aguirre", "Lucas Werner"];

function matchAllowedAssignee(name: string): string | null {
  const n = (name || "").toLowerCase().trim();
  for (const allowed of CX_ALLOWED_ASSIGNEES) {
    const a = allowed.toLowerCase();
    if (n === a || n.includes(a) || a.includes(n)) return allowed;
    // Coincidencia por primer nombre
    const first = a.split(" ")[0];
    if (first && n.includes(first)) return allowed;
  }
  return null;
}

export function getCXTicketsByAssignee(
  tickets: CXTicket[],
): { assignee: string; count: number }[] {
  const counts = new Map<string, number>();
  // Inicializar siempre los 3 colaboradores fijos (para que aparezcan aunque sea con 0)
  for (const a of CX_ALLOWED_ASSIGNEES) counts.set(a, 0);

  for (const t of tickets) {
    if (t.status !== "resuelto") continue;
    const list = t.assignees && t.assignees.length > 0 ? t.assignees : [];
    for (const a of list) {
      const allowed = matchAllowedAssignee(a);
      if (!allowed) continue; // Excluye Atl, María José Manco y cualquier otro
      counts.set(allowed, (counts.get(allowed) ?? 0) + 1);
    }
  }
  return CX_ALLOWED_ASSIGNEES.map((assignee) => ({
    assignee,
    count: counts.get(assignee) ?? 0,
  }));
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
// TAX RETURN (ClickUp View: 901407106445)
// ═══════════════════════════════════════════════════════════════
const TAX_RETURN_VIEW_ID = "901407106445";

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
  assignees: string[];
  tipoLLC: string | null;
  tiempoCompletado: number | null;
  created_at_ms: number | null;
  closed_at_ms: number | null;
}

let _taxReturnCache: { data: TaxReturnTask[]; ts: number } | null = null;

async function fetchAllTasksByView(viewId: string): Promise<any[]> {
  const tasks: any[] = [];
  let page = 0;
  while (true) {
    const res = await fetch(`${BASE_URL}/view/${viewId}/task?page=${page}`, {
      headers: { Authorization: CLICKUP_TOKEN },
    });
    if (!res.ok) throw new Error(`ClickUp View API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const batch: any[] = data?.tasks ?? [];
    tasks.push(...batch);
    if (data?.last_page === true || batch.length === 0) break;
    page++;
    if (page > 50) break;
  }
  return tasks.filter((t) => !t.parent);
}

async function fetchAllTasksByList(listId: string): Promise<any[]> {
  const tasks: any[] = [];
  let page = 0;
  while (true) {
    const url = `${BASE_URL}/list/${listId}/task?page=${page}&subtasks=false&include_closed=true`;
    const res = await fetch(url, { headers: { Authorization: CLICKUP_TOKEN } });
    if (!res.ok) throw new Error(`ClickUp List API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const batch: any[] = data?.tasks ?? [];
    tasks.push(...batch);
    if (data?.last_page === true || batch.length === 0 || batch.length < 100) break;
    page++;
    if (page > 50) break;
  }
  return tasks.filter((t) => !t.parent);
}

async function fetchTaxReturnRaw(id: string): Promise<any[]> {
  // Try as view first, then fall back to list endpoint (the ID might be a list ID).
  try {
    return await fetchAllTasksByView(id);
  } catch (err) {
    console.warn("[TaxReturn] view endpoint failed, trying list endpoint:", err);
    return await fetchAllTasksByList(id);
  }
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

const TIEMPO_FIELD_NAMES = [
  "tiempo en completar tax - desde compra obl",
  "tiempo en completar tax desde compra obl",
  "tiempo en completar tax",
];

const TIPO_LLC_FIELD_NAMES = ["tipo llc", "tipo de llc"];

function mapTaxReturnTask(raw: any): TaxReturnTask | null {
  const cf = raw?.custom_fields ?? [];
  const statusRaw = String(raw?.status?.status ?? "");
  const statusType = String(raw?.status?.type ?? "").toLowerCase();
  const isClosed = statusType === "closed" || raw?.date_closed != null;

  const tiempo = getCustomFieldNumber(cf, TIEMPO_FIELD_NAMES);
  let tipoLLC: string | null = null;
  for (const n of TIPO_LLC_FIELD_NAMES) {
    tipoLLC = getCustomFieldDropdownLabel(cf, n);
    if (tipoLLC) break;
  }

  const assignees: string[] = Array.isArray(raw?.assignees)
    ? raw.assignees.map((a: any) => a?.username ?? a?.email ?? "Sin asignar").filter(Boolean)
    : [];

  const createdMs = raw?.date_created ? Number(raw.date_created) : null;
  const closedMs = raw?.date_closed ? Number(raw.date_closed) : null;

  return {
    id: String(raw.id),
    name: raw?.name ?? "",
    status: statusRaw,
    isClosed,
    assignees: assignees.length > 0 ? assignees : ["Sin asignar"],
    tipoLLC,
    tiempoCompletado: tiempo,
    created_at_ms: createdMs && isFinite(createdMs) ? createdMs : null,
    closed_at_ms: closedMs && isFinite(closedMs) ? closedMs : null,
  };
}

export async function fetchTaxReturnTasks(): Promise<TaxReturnTask[]> {
  if (_taxReturnCache && Date.now() - _taxReturnCache.ts < CACHE_TTL_MS) return _taxReturnCache.data;
  const raw = await fetchTaxReturnRaw(TAX_RETURN_VIEW_ID);
  const data = raw.map(mapTaxReturnTask).filter((t): t is TaxReturnTask => t !== null);
  _taxReturnCache = { data, ts: Date.now() };
  return data;
}

export async function getFilteredTaxReturns(
  dateRange?: { from: Date | null; to: Date | null },
  tipoLLC?: TipoLLC | "all",
): Promise<TaxReturnTask[]> {
  const all = await fetchTaxReturnTasks();
  const from = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
  const to = dateRange?.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null;

  return all.filter((t) => {
    if (tipoLLC && tipoLLC !== "all") {
      const tl = (t.tipoLLC ?? "").toLowerCase().trim();
      if (tl !== tipoLLC.toLowerCase().trim()) return false;
    }
    if (from === null && to === null) return true;
    // Cerrada → date_closed; Abierta → date_created
    const ref = t.isClosed ? t.closed_at_ms : t.created_at_ms;
    if (typeof ref !== "number" || !isFinite(ref)) return false;
    if (from !== null && ref < from) return false;
    if (to !== null && ref > to) return false;
    return true;
  });
}

export function calculateTaxReturnKPIs(tasks: TaxReturnTask[]) {
  const closed = tasks.filter((t) => t.isClosed);
  const open = tasks.filter((t) => !t.isClosed);

  // Promedio de tiempo en completar (sólo cerradas con valor numérico válido)
  let sum = 0;
  let count = 0;
  for (const t of closed) {
    const n = t.tiempoCompletado;
    if (n === null || n === undefined) continue;
    const v = typeof n === "number" ? n : parseFloat(String(n));
    if (!isFinite(v) || isNaN(v)) continue;
    sum += v;
    count += 1;
  }
  const avgCompletionDays = count > 0 ? sum / count : 0;

  // Conteo por estado de las abiertas
  const byStatus: Record<string, number> = {};
  for (const t of open) {
    const s = (t.status || "Sin estado").trim() || "Sin estado";
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }
  const inProgressByStatus = Object.entries(byStatus)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCompleted: closed.length,
    avgCompletionDays,
    completedWithTime: count,
    inProgressTotal: open.length,
    inProgressByStatus,
  };
}

export function getTaxReturnByAssignee(
  tasks: TaxReturnTask[],
): { assignee: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (!t.isClosed) continue;
    for (const a of t.assignees) {
      if (!a || a === "Sin asignar") continue;
      counts.set(a, (counts.get(a) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([assignee, count]) => ({ assignee, count }))
    .sort((a, b) => b.count - a.count);
}

