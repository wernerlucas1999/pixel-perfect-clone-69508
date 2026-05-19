// MOCK_DATA - Simulates ClickUp API structure for Cycle Time measurement

export type ProcessType =
  | "llc_formation"
  | "bank_application"
  | "annual_reports"
  | "agentes_registrados"
  | "ticketera_cx"
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
  | "EIN LISTO";

export type EINStatus = "pendiente" | "solicitado" | "recibido" | "n/a";

// Bank Application specific statuses as per new requirements
export type BankStatus =
  | "PENDIENTE"
  | "ESPERANDO EIN"
  | "ESPERANDO INPUT CLIENTE"
  | "INFO ADICIONAL BANK"
  | "VERIF IDENTIDAD"
  | "INICIADA"
  | "APROBADA"
  | "RECHAZADA"
  | "CUENTA ABIERTA";

// Status colors based on user's image reference
export const BANK_STATUS_COLORS: Record<BankStatus, string> = {
  PENDIENTE: "#6366f1", // Indigo
  "ESPERANDO EIN": "#a16207", // Brown/Amber
  "ESPERANDO INPUT CLIENTE": "#eab308", // Yellow
  "INFO ADICIONAL BANK": "#d946ef", // Fuchsia
  "VERIF IDENTIDAD": "#22c55e", // Green
  INICIADA: "#3b82f6", // Blue
  APROBADA: "#10b981", // Emerald
  RECHAZADA: "#ef4444", // Red
  "CUENTA ABIERTA": "#059669", // Teal
};

// Display statuses for the Bank Status Cards (only in-progress statuses)
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
}

export interface BankCustomFields {
  fecha_creacion: string;
  fecha_aplicacion: string | null;
  fecha_verif_id_pedido: string | null;
  fecha_verif_id_completa: string | null;
  fecha_info_adicional_bank: string | null;
  fecha_aprob_rech: string | null;
  fecha_cuenta_abierta: string | null;
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

// Annual Report Task - Only 3 statuses for measurement
export type AnnualReportStatus = "pendiente" | "proximo_a_hacer" | "completado";

export interface AnnualReportTask {
  id: string;
  name: string;
  entity_name: string;
  due_date: string;
  filed_date: string | null;
  status: AnnualReportStatus;
  state: StateType;
  package: PackageType;
  assignee: string;
}

// Agente Registrado Task - Only 3 statuses for measurement
export type AgenteStatus = "pendiente" | "esperando_invoice" | "completado";

export interface AgenteRegistradoTask {
  id: string;
  name: string;
  entity_name: string;
  state: StateType;
  package: PackageType;
  renewal_date: string;
  status: AgenteStatus;
  assignee: string;
}

// CX Ticket
export interface CXTicket {
  id: string;
  subject: string;
  client_name: string;
  created_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  status: "abierto" | "en_progreso" | "resuelto" | "cerrado";
  priority: "alta" | "media" | "baja";
  state: StateType;
  package: PackageType;
  assignee: string;
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
  { id: "other", name: "Otros", color: "#f59e0b" },
];

// LLC Status Flow (without NO INICIAR for charts)
export const LLC_STATUS_FLOW: LLCStatus[] = [
  "PENDIENTE",
  "ESPERANDO INPUT CLIENTE",
  "ESPERANDO APROB",
  "APROBADA EN ESTADO",
  "1º ENTREGA DOCS",
  "FAXEADO",
  "ESPERANDO EIN",
  "EIN LISTO",
];

// Full LLC Status Flow (including NO INICIAR for data)
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
};

// Generate realistic LLC formation tasks with state and package
export const MOCK_DATA: Task[] = [
  {
    id: "task-001",
    name: "LLC - Rodriguez Holdings",
    status: "EIN LISTO",
    process_type: "llc_formation",
    assignee: "Maria Garcia",
    created_at: "2026-03-01",
    closed_at: "2026-04-15",
    custom_fields: {
      fecha_creacion: "2026-03-01",
      envio_tramite: "2026-03-05",
      fecha_solicitud_ein: "2026-04-01",
      fecha_recepcion_ein: "2026-04-15",
    },
    time_in_status: {
      PENDIENTE: 2,
      "ESPERANDO INPUT CLIENTE": 3,
      "ESPERANDO APROB": 5,
      "APROBADA EN ESTADO": 2,
      "1º ENTREGA DOCS": 3,
      FAXEADO: 2,
      "ESPERANDO EIN": 14,
      "EIN LISTO": 0,
    },
    ein_status: "recibido",
    current_status_days: 5,
    state: "new_mexico",
    package: "pro",
  },
  {
    id: "task-002",
    name: "LLC - Tech Solutions Corp",
    status: "ESPERANDO EIN",
    process_type: "llc_formation",
    assignee: "Carlos Martinez",
    created_at: "2026-03-15",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-03-15",
      envio_tramite: "2026-03-20",
      fecha_solicitud_ein: "2026-04-20",
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      "ESPERANDO INPUT CLIENTE": 4,
      "ESPERANDO APROB": 7,
      "APROBADA EN ESTADO": 3,
      "1º ENTREGA DOCS": 2,
      FAXEADO: 3,
      "ESPERANDO EIN": 18,
    },
    ein_status: "solicitado",
    current_status_days: 18,
    state: "wyoming",
    package: "all_in",
  },
  {
    id: "task-003",
    name: "LLC - Green Energy Partners",
    status: "FAXEADO",
    process_type: "llc_formation",
    assignee: "Ana Lopez",
    created_at: "2026-04-01",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-01",
      envio_tramite: "2026-04-05",
      fecha_solicitud_ein: null,
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      "ESPERANDO INPUT CLIENTE": 2,
      "ESPERANDO APROB": 6,
      "APROBADA EN ESTADO": 2,
      "1º ENTREGA DOCS": 4,
      FAXEADO: 3,
    },
    ein_status: "pendiente",
    current_status_days: 3,
    state: "delaware",
    package: "starter",
  },
  {
    id: "task-004",
    name: "LLC - Sunset Investments",
    status: "ESPERANDO INPUT CLIENTE",
    process_type: "llc_formation",
    assignee: "Maria Garcia",
    created_at: "2026-04-20",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-20",
      envio_tramite: null,
      fecha_solicitud_ein: null,
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 2,
      "ESPERANDO INPUT CLIENTE": 8,
    },
    ein_status: "n/a",
    current_status_days: 8,
    state: "florida",
    package: "solo_llc",
  },
  {
    id: "task-005",
    name: "LLC - Blue Ocean Ventures",
    status: "APROBADA EN ESTADO",
    process_type: "llc_formation",
    assignee: "Roberto Sanchez",
    created_at: "2026-04-10",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-10",
      envio_tramite: "2026-04-15",
      fecha_solicitud_ein: null,
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      "ESPERANDO INPUT CLIENTE": 3,
      "ESPERANDO APROB": 8,
      "APROBADA EN ESTADO": 4,
    },
    ein_status: "n/a",
    current_status_days: 4,
    state: "texas",
    package: "pro",
  },
  {
    id: "task-006",
    name: "LLC - Mountain Peak LLC",
    status: "EIN LISTO",
    process_type: "llc_formation",
    assignee: "Carlos Martinez",
    created_at: "2026-02-15",
    closed_at: "2026-03-28",
    custom_fields: {
      fecha_creacion: "2026-02-15",
      envio_tramite: "2026-02-18",
      fecha_solicitud_ein: "2026-03-10",
      fecha_recepcion_ein: "2026-03-28",
    },
    time_in_status: {
      PENDIENTE: 1,
      "ESPERANDO INPUT CLIENTE": 2,
      "ESPERANDO APROB": 4,
      "APROBADA EN ESTADO": 3,
      "1º ENTREGA DOCS": 2,
      FAXEADO: 2,
      "ESPERANDO EIN": 18,
      "EIN LISTO": 0,
    },
    ein_status: "recibido",
    current_status_days: 3,
    state: "new_mexico",
    package: "all_in",
  },
  {
    id: "task-007",
    name: "LLC - Coastal Properties",
    status: "ESPERANDO APROB",
    process_type: "llc_formation",
    assignee: "Ana Lopez",
    created_at: "2026-04-25",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-25",
      envio_tramite: null,
      fecha_solicitud_ein: null,
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      "ESPERANDO INPUT CLIENTE": 2,
      "ESPERANDO APROB": 6,
    },
    ein_status: "n/a",
    current_status_days: 6,
    state: "wyoming",
    package: "starter",
  },
  {
    id: "task-008",
    name: "LLC - Digital Nomads Co",
    status: "1º ENTREGA DOCS",
    process_type: "llc_formation",
    assignee: "Maria Garcia",
    created_at: "2026-04-08",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-08",
      envio_tramite: "2026-04-12",
      fecha_solicitud_ein: null,
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      "ESPERANDO INPUT CLIENTE": 3,
      "ESPERANDO APROB": 5,
      "APROBADA EN ESTADO": 2,
      "1º ENTREGA DOCS": 7,
    },
    ein_status: "pendiente",
    current_status_days: 7,
    state: "delaware",
    package: "pro",
  },
  {
    id: "task-009",
    name: "LLC - River Valley Holdings",
    status: "PENDIENTE",
    process_type: "llc_formation",
    assignee: "Roberto Sanchez",
    created_at: "2026-05-01",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-05-01",
      envio_tramite: null,
      fecha_solicitud_ein: null,
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 3,
    },
    ein_status: "n/a",
    current_status_days: 3,
    state: "florida",
    package: "solo_llc",
  },
  {
    id: "task-010",
    name: "LLC - Urban Development Group",
    status: "NO INICIAR",
    process_type: "llc_formation",
    assignee: "Carlos Martinez",
    created_at: "2026-04-28",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-28",
      envio_tramite: null,
      fecha_solicitud_ein: null,
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 2,
      "NO INICIAR": 4,
    },
    ein_status: "n/a",
    current_status_days: 4,
    state: "texas",
    package: "starter",
  },
  {
    id: "task-011",
    name: "LLC - Pacific Traders",
    status: "ESPERANDO EIN",
    process_type: "llc_formation",
    assignee: "Ana Lopez",
    created_at: "2026-03-20",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-03-20",
      envio_tramite: "2026-03-25",
      fecha_solicitud_ein: "2026-04-15",
      fecha_recepcion_ein: null,
    },
    time_in_status: {
      PENDIENTE: 2,
      "ESPERANDO INPUT CLIENTE": 4,
      "ESPERANDO APROB": 6,
      "APROBADA EN ESTADO": 3,
      "1º ENTREGA DOCS": 3,
      FAXEADO: 2,
      "ESPERANDO EIN": 20,
    },
    ein_status: "solicitado",
    current_status_days: 20,
    state: "new_mexico",
    package: "all_in",
  },
  {
    id: "task-012",
    name: "LLC - Sunshine Rentals",
    status: "EIN LISTO",
    process_type: "llc_formation",
    assignee: "Roberto Sanchez",
    created_at: "2026-02-28",
    closed_at: "2026-04-05",
    custom_fields: {
      fecha_creacion: "2026-02-28",
      envio_tramite: "2026-03-02",
      fecha_solicitud_ein: "2026-03-20",
      fecha_recepcion_ein: "2026-04-05",
    },
    time_in_status: {
      PENDIENTE: 1,
      "ESPERANDO INPUT CLIENTE": 2,
      "ESPERANDO APROB": 5,
      "APROBADA EN ESTADO": 2,
      "1º ENTREGA DOCS": 2,
      FAXEADO: 2,
      "ESPERANDO EIN": 16,
      "EIN LISTO": 0,
    },
    ein_status: "recibido",
    current_status_days: 2,
    state: "wyoming",
    package: "pro",
  },
];

// Bank Application Mock Data with state, package, and bank
export const BANK_MOCK_DATA: BankTask[] = [
  {
    id: "bank-001",
    name: "Cuenta Mercury - Rodriguez Holdings",
    status: "CUENTA ABIERTA",
    process_type: "bank_application",
    assignee: "Laura Fernandez",
    created_at: "2026-03-01",
    closed_at: "2026-04-10",
    custom_fields: {
      fecha_creacion: "2026-03-01",
      fecha_aplicacion: "2026-03-05",
      fecha_verif_id_pedido: "2026-03-08",
      fecha_verif_id_completa: "2026-03-15",
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: "2026-04-05",
      fecha_cuenta_abierta: "2026-04-10",
    },
    time_in_status: {
      PENDIENTE: 2,
      INICIADA: 2,
      "ESPERANDO INPUT CLIENTE": 5,
      "VERIF IDENTIDAD": 7,
      APROBADA: 5,
    },
    current_status_days: 0,
    client_wait_days: 12,
    bank_wait_days: 24,
    blocking_alert: null,
    state: "new_mexico",
    package: "pro",
    bank: "mercury",
  },
  {
    id: "bank-002",
    name: "Cuenta Relay - Tech Solutions Corp",
    status: "APROBADA",
    process_type: "bank_application",
    assignee: "Pedro Ramirez",
    created_at: "2026-03-15",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-03-15",
      fecha_aplicacion: "2026-03-18",
      fecha_verif_id_pedido: "2026-03-20",
      fecha_verif_id_completa: "2026-03-25",
      fecha_info_adicional_bank: "2026-04-01",
      fecha_aprob_rech: "2026-04-28",
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 2,
      "ESPERANDO INPUT CLIENTE": 3,
      "VERIF IDENTIDAD": 5,
      "INFO ADICIONAL BANK": 7,
      APROBADA: 10,
    },
    current_status_days: 10,
    client_wait_days: 8,
    bank_wait_days: 34,
    blocking_alert: null,
    state: "wyoming",
    package: "all_in",
    bank: "relay",
  },
  {
    id: "bank-003",
    name: "Cuenta Mercury - Green Energy Partners",
    status: "ESPERANDO INPUT CLIENTE",
    process_type: "bank_application",
    assignee: "Laura Fernandez",
    created_at: "2026-04-10",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-10",
      fecha_aplicacion: "2026-04-12",
      fecha_verif_id_pedido: "2026-04-15",
      fecha_verif_id_completa: null,
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 1,
      "ESPERANDO INPUT CLIENTE": 5,
    },
    current_status_days: 5,
    client_wait_days: 5,
    bank_wait_days: 0,
    blocking_alert: "client_blocked",
    state: "delaware",
    package: "starter",
    bank: "mercury",
  },
  {
    id: "bank-004",
    name: "Cuenta Relay - Sunset Investments",
    status: "VERIF IDENTIDAD",
    process_type: "bank_application",
    assignee: "Pedro Ramirez",
    created_at: "2026-04-01",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-01",
      fecha_aplicacion: "2026-04-03",
      fecha_verif_id_pedido: "2026-04-05",
      fecha_verif_id_completa: null,
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 1,
      "ESPERANDO INPUT CLIENTE": 2,
      "VERIF IDENTIDAD": 10,
    },
    current_status_days: 10,
    client_wait_days: 2,
    bank_wait_days: 10,
    blocking_alert: "bank_delay",
    state: "florida",
    package: "solo_bank",
    bank: "relay",
  },
  {
    id: "bank-005",
    name: "Cuenta Mercury - Blue Ocean Ventures",
    status: "INFO ADICIONAL BANK",
    process_type: "bank_application",
    assignee: "Laura Fernandez",
    created_at: "2026-04-05",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-05",
      fecha_aplicacion: "2026-04-08",
      fecha_verif_id_pedido: "2026-04-10",
      fecha_verif_id_completa: "2026-04-14",
      fecha_info_adicional_bank: "2026-04-20",
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 2,
      "ESPERANDO INPUT CLIENTE": 2,
      "VERIF IDENTIDAD": 4,
      "INFO ADICIONAL BANK": 8,
    },
    current_status_days: 8,
    client_wait_days: 6,
    bank_wait_days: 8,
    blocking_alert: "bank_delay",
    state: "texas",
    package: "pro",
    bank: "mercury",
  },
  {
    id: "bank-006",
    name: "Cuenta Relay - Mountain Peak LLC",
    status: "CUENTA ABIERTA",
    process_type: "bank_application",
    assignee: "Pedro Ramirez",
    created_at: "2026-02-20",
    closed_at: "2026-03-25",
    custom_fields: {
      fecha_creacion: "2026-02-20",
      fecha_aplicacion: "2026-02-22",
      fecha_verif_id_pedido: "2026-02-25",
      fecha_verif_id_completa: "2026-03-01",
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: "2026-03-20",
      fecha_cuenta_abierta: "2026-03-25",
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 1,
      "ESPERANDO INPUT CLIENTE": 3,
      "VERIF IDENTIDAD": 4,
      APROBADA: 5,
    },
    current_status_days: 0,
    client_wait_days: 7,
    bank_wait_days: 19,
    blocking_alert: null,
    state: "new_mexico",
    package: "all_in",
    bank: "relay",
  },
  {
    id: "bank-007",
    name: "Cuenta Mercury - Coastal Properties",
    status: "INICIADA",
    process_type: "bank_application",
    assignee: "Laura Fernandez",
    created_at: "2026-04-25",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-25",
      fecha_aplicacion: "2026-04-28",
      fecha_verif_id_pedido: null,
      fecha_verif_id_completa: null,
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 2,
      INICIADA: 8,
    },
    current_status_days: 8,
    client_wait_days: 0,
    bank_wait_days: 8,
    blocking_alert: "bank_delay",
    state: "wyoming",
    package: "starter",
    bank: "mercury",
  },
  {
    id: "bank-008",
    name: "Cuenta Relay - Digital Nomads Co",
    status: "ESPERANDO INPUT CLIENTE",
    process_type: "bank_application",
    assignee: "Pedro Ramirez",
    created_at: "2026-04-18",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-18",
      fecha_aplicacion: "2026-04-20",
      fecha_verif_id_pedido: "2026-04-22",
      fecha_verif_id_completa: null,
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 1,
      "ESPERANDO INPUT CLIENTE": 8,
    },
    current_status_days: 8,
    client_wait_days: 8,
    bank_wait_days: 0,
    blocking_alert: "client_blocked",
    state: "delaware",
    package: "pro",
    bank: "relay",
  },
  {
    id: "bank-009",
    name: "Cuenta Mercury - Urban Dev Group",
    status: "RECHAZADA",
    process_type: "bank_application",
    assignee: "Laura Fernandez",
    created_at: "2026-03-10",
    closed_at: "2026-04-05",
    custom_fields: {
      fecha_creacion: "2026-03-10",
      fecha_aplicacion: "2026-03-12",
      fecha_verif_id_pedido: "2026-03-15",
      fecha_verif_id_completa: "2026-03-20",
      fecha_info_adicional_bank: "2026-03-25",
      fecha_aprob_rech: "2026-04-05",
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 1,
      "ESPERANDO INPUT CLIENTE": 3,
      "VERIF IDENTIDAD": 5,
      "INFO ADICIONAL BANK": 10,
      RECHAZADA: 0,
    },
    current_status_days: 0,
    client_wait_days: 8,
    bank_wait_days: 14,
    blocking_alert: null,
    state: "florida",
    package: "solo_bank",
    bank: "mercury",
  },
  {
    id: "bank-010",
    name: "Cuenta Relay - River Valley Holdings",
    status: "PENDIENTE",
    process_type: "bank_application",
    assignee: "Pedro Ramirez",
    created_at: "2026-05-01",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-05-01",
      fecha_aplicacion: null,
      fecha_verif_id_pedido: null,
      fecha_verif_id_completa: null,
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 4,
    },
    current_status_days: 4,
    client_wait_days: 0,
    bank_wait_days: 0,
    blocking_alert: null,
    state: "texas",
    package: "starter",
    bank: "relay",
  },
  {
    id: "bank-011",
    name: "Cuenta Lili - Pacific Traders",
    status: "ESPERANDO EIN",
    process_type: "bank_application",
    assignee: "Laura Fernandez",
    created_at: "2026-04-15",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-15",
      fecha_aplicacion: "2026-04-18",
      fecha_verif_id_pedido: null,
      fecha_verif_id_completa: null,
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 2,
      INICIADA: 1,
      "ESPERANDO EIN": 12,
    },
    current_status_days: 12,
    client_wait_days: 0,
    bank_wait_days: 12,
    blocking_alert: "bank_delay",
    state: "new_mexico",
    package: "all_in",
    bank: "lili",
  },
  {
    id: "bank-012",
    name: "Cuenta Lili - Sunshine Rentals",
    status: "VERIF IDENTIDAD",
    process_type: "bank_application",
    assignee: "Pedro Ramirez",
    created_at: "2026-04-20",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-20",
      fecha_aplicacion: "2026-04-22",
      fecha_verif_id_pedido: "2026-04-25",
      fecha_verif_id_completa: null,
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 1,
      "ESPERANDO INPUT CLIENTE": 2,
      "VERIF IDENTIDAD": 5,
    },
    current_status_days: 5,
    client_wait_days: 2,
    bank_wait_days: 5,
    blocking_alert: null,
    state: "wyoming",
    package: "solo_bank",
    bank: "lili",
  },
  {
    id: "bank-013",
    name: "Cuenta Mercury - Alpine Holdings",
    status: "ESPERANDO EIN",
    process_type: "bank_application",
    assignee: "Laura Fernandez",
    created_at: "2026-04-08",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-08",
      fecha_aplicacion: "2026-04-10",
      fecha_verif_id_pedido: null,
      fecha_verif_id_completa: null,
      fecha_info_adicional_bank: null,
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 1,
      "ESPERANDO EIN": 18,
    },
    current_status_days: 18,
    client_wait_days: 0,
    bank_wait_days: 18,
    blocking_alert: "bank_delay",
    state: "delaware",
    package: "pro",
    bank: "mercury",
  },
  {
    id: "bank-014",
    name: "Cuenta Lili - Desert Ventures",
    status: "INFO ADICIONAL BANK",
    process_type: "bank_application",
    assignee: "Pedro Ramirez",
    created_at: "2026-04-12",
    closed_at: null,
    custom_fields: {
      fecha_creacion: "2026-04-12",
      fecha_aplicacion: "2026-04-14",
      fecha_verif_id_pedido: "2026-04-16",
      fecha_verif_id_completa: "2026-04-20",
      fecha_info_adicional_bank: "2026-04-25",
      fecha_aprob_rech: null,
      fecha_cuenta_abierta: null,
    },
    time_in_status: {
      PENDIENTE: 1,
      INICIADA: 1,
      "ESPERANDO INPUT CLIENTE": 2,
      "VERIF IDENTIDAD": 4,
      "INFO ADICIONAL BANK": 10,
    },
    current_status_days: 10,
    client_wait_days: 6,
    bank_wait_days: 10,
    blocking_alert: "bank_delay",
    state: "texas",
    package: "all_in",
    bank: "lili",
  },
];

// Annual Reports Mock Data - Only 3 statuses: PENDIENTE, PROXIMO_A_HACER, COMPLETADO
export const ANNUAL_REPORTS_DATA: AnnualReportTask[] = [
  {
    id: "ar-001",
    name: "Annual Report - Rodriguez Holdings",
    entity_name: "Rodriguez Holdings LLC",
    due_date: "2026-06-15",
    filed_date: "2026-05-10",
    status: "completado",
    state: "new_mexico",
    package: "pro",
    assignee: "Maria Garcia",
  },
  {
    id: "ar-002",
    name: "Annual Report - Tech Solutions",
    entity_name: "Tech Solutions Corp",
    due_date: "2026-05-30",
    filed_date: null,
    status: "proximo_a_hacer",
    state: "wyoming",
    package: "all_in",
    assignee: "Carlos Martinez",
  },
  {
    id: "ar-003",
    name: "Annual Report - Green Energy",
    entity_name: "Green Energy Partners LLC",
    due_date: "2026-04-15",
    filed_date: null,
    status: "pendiente",
    state: "delaware",
    package: "starter",
    assignee: "Ana Lopez",
  },
  {
    id: "ar-004",
    name: "Annual Report - Sunset Inv",
    entity_name: "Sunset Investments LLC",
    due_date: "2026-07-20",
    filed_date: "2026-07-01",
    status: "completado",
    state: "florida",
    package: "solo_llc",
    assignee: "Maria Garcia",
  },
  {
    id: "ar-005",
    name: "Annual Report - Blue Ocean",
    entity_name: "Blue Ocean Ventures LLC",
    due_date: "2026-05-25",
    filed_date: null,
    status: "proximo_a_hacer",
    state: "texas",
    package: "pro",
    assignee: "Roberto Sanchez",
  },
  {
    id: "ar-006",
    name: "Annual Report - Mountain Peak",
    entity_name: "Mountain Peak LLC",
    due_date: "2026-08-10",
    filed_date: "2026-07-28",
    status: "completado",
    state: "new_mexico",
    package: "all_in",
    assignee: "Carlos Martinez",
  },
  {
    id: "ar-007",
    name: "Annual Report - Coastal Props",
    entity_name: "Coastal Properties LLC",
    due_date: "2026-06-01",
    filed_date: null,
    status: "proximo_a_hacer",
    state: "wyoming",
    package: "starter",
    assignee: "Ana Lopez",
  },
  {
    id: "ar-008",
    name: "Annual Report - Digital Nomads",
    entity_name: "Digital Nomads Co LLC",
    due_date: "2026-09-15",
    filed_date: "2026-08-20",
    status: "completado",
    state: "delaware",
    package: "pro",
    assignee: "Maria Garcia",
  },
  {
    id: "ar-009",
    name: "Annual Report - River Valley",
    entity_name: "River Valley Holdings LLC",
    due_date: "2026-05-01",
    filed_date: null,
    status: "pendiente",
    state: "florida",
    package: "solo_llc",
    assignee: "Roberto Sanchez",
  },
  {
    id: "ar-010",
    name: "Annual Report - Urban Dev",
    entity_name: "Urban Development Group LLC",
    due_date: "2026-07-10",
    filed_date: "2026-06-25",
    status: "completado",
    state: "texas",
    package: "starter",
    assignee: "Carlos Martinez",
  },
  {
    id: "ar-011",
    name: "Annual Report - Pacific Traders",
    entity_name: "Pacific Traders LLC",
    due_date: "2026-06-20",
    filed_date: null,
    status: "proximo_a_hacer",
    state: "new_mexico",
    package: "all_in",
    assignee: "Ana Lopez",
  },
  {
    id: "ar-012",
    name: "Annual Report - Sunshine Rentals",
    entity_name: "Sunshine Rentals LLC",
    due_date: "2026-08-05",
    filed_date: "2026-07-15",
    status: "completado",
    state: "wyoming",
    package: "pro",
    assignee: "Maria Garcia",
  },
];

// Agentes Registrados Mock Data - Only 3 statuses: PENDIENTE, ESPERANDO_INVOICE, COMPLETADO
export const AGENTES_REGISTRADOS_DATA: AgenteRegistradoTask[] = [
  {
    id: "ag-001",
    name: "Agente - Rodriguez Holdings",
    entity_name: "Rodriguez Holdings LLC",
    state: "new_mexico",
    package: "pro",
    renewal_date: "2027-03-01",
    status: "completado",
    assignee: "Maria Garcia",
  },
  {
    id: "ag-002",
    name: "Agente - Tech Solutions",
    entity_name: "Tech Solutions Corp",
    state: "wyoming",
    package: "all_in",
    renewal_date: "2026-06-15",
    status: "esperando_invoice",
    assignee: "Carlos Martinez",
  },
  {
    id: "ag-003",
    name: "Agente - Green Energy",
    entity_name: "Green Energy Partners LLC",
    state: "delaware",
    package: "starter",
    renewal_date: "2026-04-01",
    status: "pendiente",
    assignee: "Ana Lopez",
  },
  {
    id: "ag-004",
    name: "Agente - Sunset Investments",
    entity_name: "Sunset Investments LLC",
    state: "florida",
    package: "solo_llc",
    renewal_date: "2027-01-20",
    status: "completado",
    assignee: "Maria Garcia",
  },
  {
    id: "ag-005",
    name: "Agente - Blue Ocean",
    entity_name: "Blue Ocean Ventures LLC",
    state: "texas",
    package: "pro",
    renewal_date: "2026-05-30",
    status: "esperando_invoice",
    assignee: "Roberto Sanchez",
  },
  {
    id: "ag-006",
    name: "Agente - Mountain Peak",
    entity_name: "Mountain Peak LLC",
    state: "new_mexico",
    package: "all_in",
    renewal_date: "2027-02-10",
    status: "completado",
    assignee: "Carlos Martinez",
  },
  {
    id: "ag-007",
    name: "Agente - Coastal Props",
    entity_name: "Coastal Properties LLC",
    state: "wyoming",
    package: "starter",
    renewal_date: "2026-06-01",
    status: "esperando_invoice",
    assignee: "Ana Lopez",
  },
  {
    id: "ag-008",
    name: "Agente - Digital Nomads",
    entity_name: "Digital Nomads Co LLC",
    state: "delaware",
    package: "pro",
    renewal_date: "2027-04-15",
    status: "completado",
    assignee: "Maria Garcia",
  },
  {
    id: "ag-009",
    name: "Agente - River Valley",
    entity_name: "River Valley Holdings LLC",
    state: "florida",
    package: "solo_llc",
    renewal_date: "2026-03-15",
    status: "pendiente",
    assignee: "Roberto Sanchez",
  },
  {
    id: "ag-010",
    name: "Agente - Urban Dev",
    entity_name: "Urban Development Group LLC",
    state: "texas",
    package: "starter",
    renewal_date: "2027-01-10",
    status: "completado",
    assignee: "Carlos Martinez",
  },
];

// CX Tickets Mock Data
export const CX_TICKETS_DATA: CXTicket[] = [
  {
    id: "cx-001",
    subject: "Consulta sobre estado de LLC",
    client_name: "Rodriguez Holdings",
    created_at: "2026-05-10T09:30:00",
    first_response_at: "2026-05-10T10:15:00",
    resolved_at: "2026-05-10T14:00:00",
    status: "cerrado",
    priority: "media",
    state: "new_mexico",
    package: "pro",
    assignee: "Laura Fernandez",
  },
  {
    id: "cx-002",
    subject: "Problema con documentos EIN",
    client_name: "Tech Solutions",
    created_at: "2026-05-12T11:00:00",
    first_response_at: "2026-05-12T11:20:00",
    resolved_at: null,
    status: "en_progreso",
    priority: "alta",
    state: "wyoming",
    package: "all_in",
    assignee: "Pedro Ramirez",
  },
  {
    id: "cx-003",
    subject: "Actualizacion de datos",
    client_name: "Green Energy",
    created_at: "2026-05-13T08:45:00",
    first_response_at: null,
    resolved_at: null,
    status: "abierto",
    priority: "baja",
    state: "delaware",
    package: "starter",
    assignee: "Laura Fernandez",
  },
  {
    id: "cx-004",
    subject: "Solicitud de Annual Report",
    client_name: "Sunset Investments",
    created_at: "2026-05-11T14:20:00",
    first_response_at: "2026-05-11T14:35:00",
    resolved_at: "2026-05-11T16:00:00",
    status: "resuelto",
    priority: "media",
    state: "florida",
    package: "solo_llc",
    assignee: "Pedro Ramirez",
  },
  {
    id: "cx-005",
    subject: "Error en facturacion",
    client_name: "Blue Ocean",
    created_at: "2026-05-14T10:00:00",
    first_response_at: "2026-05-14T10:10:00",
    resolved_at: null,
    status: "en_progreso",
    priority: "alta",
    state: "texas",
    package: "pro",
    assignee: "Laura Fernandez",
  },
  {
    id: "cx-006",
    subject: "Cambio de agente registrado",
    client_name: "Mountain Peak",
    created_at: "2026-05-09T16:30:00",
    first_response_at: "2026-05-09T16:45:00",
    resolved_at: "2026-05-10T09:00:00",
    status: "cerrado",
    priority: "media",
    state: "new_mexico",
    package: "all_in",
    assignee: "Pedro Ramirez",
  },
  {
    id: "cx-007",
    subject: "Consulta sobre renovacion",
    client_name: "Coastal Properties",
    created_at: "2026-05-14T09:15:00",
    first_response_at: null,
    resolved_at: null,
    status: "abierto",
    priority: "media",
    state: "wyoming",
    package: "starter",
    assignee: "Laura Fernandez",
  },
  {
    id: "cx-008",
    subject: "Urgente: Documento faltante",
    client_name: "Digital Nomads",
    created_at: "2026-05-14T08:00:00",
    first_response_at: "2026-05-14T08:05:00",
    resolved_at: null,
    status: "en_progreso",
    priority: "alta",
    state: "delaware",
    package: "pro",
    assignee: "Pedro Ramirez",
  },
  {
    id: "cx-009",
    subject: "Informacion de cuenta bancaria",
    client_name: "River Valley",
    created_at: "2026-05-13T13:00:00",
    first_response_at: "2026-05-13T13:30:00",
    resolved_at: "2026-05-13T15:00:00",
    status: "resuelto",
    priority: "baja",
    state: "florida",
    package: "solo_llc",
    assignee: "Laura Fernandez",
  },
  {
    id: "cx-010",
    subject: "Pregunta sobre paquetes",
    client_name: "Urban Dev",
    created_at: "2026-05-14T11:30:00",
    first_response_at: null,
    resolved_at: null,
    status: "abierto",
    priority: "baja",
    state: "texas",
    package: "starter",
    assignee: "Pedro Ramirez",
  },
  {
    id: "cx-011",
    subject: "Reenvio de certificados",
    client_name: "Pacific Traders",
    created_at: "2026-05-12T15:00:00",
    first_response_at: "2026-05-12T15:10:00",
    resolved_at: "2026-05-12T17:00:00",
    status: "cerrado",
    priority: "media",
    state: "new_mexico",
    package: "all_in",
    assignee: "Laura Fernandez",
  },
  {
    id: "cx-012",
    subject: "Cancelacion de servicio",
    client_name: "Sunshine Rentals",
    created_at: "2026-05-13T10:45:00",
    first_response_at: "2026-05-13T11:00:00",
    resolved_at: null,
    status: "en_progreso",
    priority: "alta",
    state: "wyoming",
    package: "pro",
    assignee: "Pedro Ramirez",
  },
];

// Filter interface for all filters
export interface FilterOptions {
  state?: StateType | "all";
  package?: PackageType | "all";
  bank?: BankType | "all";
  dateRange?: { from: Date | null; to: Date | null };
}

// Helper function to get filtered LLC tasks
export function getFilteredTasks(
  processType: ProcessType | "all",
  dateRange?: { from: Date | null; to: Date | null },
  state?: StateType | "all",
  pkg?: PackageType | "all",
): Task[] {
  let filtered = MOCK_DATA;

  // Filter by process type
  if (processType !== "all") {
    filtered = filtered.filter((task) => task.process_type === processType);
  }

  // Filter by state
  if (state && state !== "all") {
    filtered = filtered.filter((task) => task.state === state);
  }

  // Filter by package
  if (pkg && pkg !== "all") {
    filtered = filtered.filter((task) => task.package === pkg);
  }

  // Filter by date range
  if (dateRange?.from || dateRange?.to) {
    filtered = filtered.filter((task) => {
      const closedDate = task.closed_at ? new Date(task.closed_at) : null;
      if (!closedDate) return true;
      if (dateRange.from && closedDate < dateRange.from) return false;
      if (dateRange.to && closedDate > dateRange.to) return false;
      return true;
    });
  }

  return filtered;
}

// Helper function to get filtered Bank tasks
export function getFilteredBankTasks(
  dateRange?: { from: Date | null; to: Date | null },
  state?: StateType | "all",
  pkg?: PackageType | "all",
  bank?: BankType | "all",
): BankTask[] {
  let filtered = BANK_MOCK_DATA;

  // Filter by state
  if (state && state !== "all") {
    filtered = filtered.filter((task) => task.state === state);
  }

  // Filter by package
  if (pkg && pkg !== "all") {
    filtered = filtered.filter((task) => task.package === pkg);
  }

  // Filter by bank
  if (bank && bank !== "all") {
    filtered = filtered.filter((task) => task.bank === bank);
  }

  // Filter by date range
  if (dateRange?.from || dateRange?.to) {
    filtered = filtered.filter((task) => {
      const closedDate = task.closed_at ? new Date(task.closed_at) : null;
      if (!closedDate) return true;
      if (dateRange.from && closedDate < dateRange.from) return false;
      if (dateRange.to && closedDate > dateRange.to) return false;
      return true;
    });
  }

  return filtered;
}

// Calculate funnel data (tasks per status) - excluding NO INICIAR
export function getFunnelData(tasks: Task[]) {
  const statusCounts: Record<LLCStatus, number> = {
    PENDIENTE: 0,
    "NO INICIAR": 0,
    "ESPERANDO INPUT CLIENTE": 0,
    "ESPERANDO APROB": 0,
    "APROBADA EN ESTADO": 0,
    "1º ENTREGA DOCS": 0,
    FAXEADO: 0,
    "ESPERANDO EIN": 0,
    "EIN LISTO": 0,
  };

  tasks.forEach((task) => {
    statusCounts[task.status]++;
  });

  // Use LLC_STATUS_FLOW which excludes NO INICIAR
  return LLC_STATUS_FLOW.map((status) => ({
    status,
    count: statusCounts[status],
    fill: STATUS_COLORS[status],
  }));
}

// Calculate average time per status - excluding NO INICIAR
export function getAverageTimeByStatus(tasks: Task[]) {
  const statusTimes: Record<LLCStatus, number[]> = {
    PENDIENTE: [],
    "NO INICIAR": [],
    "ESPERANDO INPUT CLIENTE": [],
    "ESPERANDO APROB": [],
    "APROBADA EN ESTADO": [],
    "1º ENTREGA DOCS": [],
    FAXEADO: [],
    "ESPERANDO EIN": [],
    "EIN LISTO": [],
  };

  tasks.forEach((task) => {
    Object.entries(task.time_in_status).forEach(([status, days]) => {
      if (statusTimes[status as LLCStatus] !== undefined && status !== "NO INICIAR") {
        statusTimes[status as LLCStatus].push(days);
      }
    });
  });

  // Use LLC_STATUS_FLOW which excludes NO INICIAR
  return LLC_STATUS_FLOW.map((status) => {
    const times = statusTimes[status];
    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    return {
      status,
      avgDays: Math.round(avg * 10) / 10,
      fill: STATUS_COLORS[status],
    };
  });
}

// Calculate Lead Time
export function calculateLeadTime(tasks: Task[]) {
  const completedTasks = tasks.filter((t) => t.closed_at !== null);
  if (completedTasks.length === 0) return 0;

  const leadTimes = completedTasks.map((task) => {
    const created = new Date(task.created_at);
    const closed = new Date(task.closed_at!);
    return Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  });

  return Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length);
}

// Helper function to safely calculate days between two dates
function daysBetween(date1: string | null, date2: string | null): number {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Calculate Bottleneck Analysis data for Bank Application
// Formula Cliente: (fecha_recepcion_ein - fecha_solicitud_ein) + (completa_verif_id - pedido_verif_id)
// Formula Banco: (fecha_aprob_rech - fecha_aplicacion) - (dias_en_info_adicional_bank)
export function calculateBottleneckAnalysis(tasks: BankTask[]) {
  const comparisonData = tasks.map((task) => {
    const cf = task.custom_fields;

    // Calculate client wait days using actual dates
    const einWaitDays = daysBetween(cf.fecha_aplicacion, cf.fecha_verif_id_pedido); // Simplified: days waiting for ID request
    const verifWaitDays = daysBetween(cf.fecha_verif_id_pedido, cf.fecha_verif_id_completa);
    const clientDays =
      einWaitDays + verifWaitDays + (task.time_in_status["ESPERANDO INPUT CLIENTE"] || 0);

    // Calculate bank wait days using actual dates
    let bankDays = 0;
    if (cf.fecha_aplicacion && cf.fecha_aprob_rech) {
      const totalProcessDays = daysBetween(cf.fecha_aplicacion, cf.fecha_aprob_rech);
      const infoAdicionalDays = task.time_in_status["INFO ADICIONAL BANK"] || 0;
      bankDays = Math.max(0, totalProcessDays - clientDays - infoAdicionalDays);
    } else if (cf.fecha_aplicacion) {
      // Still in progress - use current status time as estimate
      bankDays = task.bank_wait_days;
    }

    // Determine status display
    const isPending =
      !cf.fecha_aplicacion ||
      (!cf.fecha_aprob_rech && task.status !== "CUENTA ABIERTA" && task.status !== "RECHAZADA");
    const statusLabel = isPending ? "En curso" : task.status;

    return {
      name: task.name
        .replace("Cuenta Mercury - ", "")
        .replace("Cuenta Relay - ", "")
        .replace("Cuenta Lili - ", ""),
      clientDays: Math.max(0, clientDays),
      bankDays: Math.max(0, bankDays),
      fullName: task.name,
      status: statusLabel,
      blockingAlert: task.blocking_alert,
      isPending,
    };
  });

  const totalClientDays = comparisonData.reduce((sum, t) => sum + t.clientDays, 0);
  const totalBankDays = comparisonData.reduce((sum, t) => sum + t.bankDays, 0);
  const totalDays = totalClientDays + totalBankDays;
  const clientResponsibilityRatio =
    totalDays > 0 ? Math.round((totalClientDays / totalDays) * 100) : 0;

  const clientBlockedCount = tasks.filter((t) => t.blocking_alert === "client_blocked").length;
  const bankDelayCount = tasks.filter((t) => t.blocking_alert === "bank_delay").length;

  return {
    comparisonData,
    clientResponsibilityRatio,
    totalClientDays,
    totalBankDays,
    clientBlockedCount,
    bankDelayCount,
  };
}

// Get Bank Status Counts for Status Cards
export function getBankStatusCounts(tasks: BankTask[]) {
  const counts: Record<BankStatus, number> = {
    PENDIENTE: 0,
    "ESPERANDO EIN": 0,
    "ESPERANDO INPUT CLIENTE": 0,
    "INFO ADICIONAL BANK": 0,
    "VERIF IDENTIDAD": 0,
    INICIADA: 0,
    APROBADA: 0,
    RECHAZADA: 0,
    "CUENTA ABIERTA": 0,
  };

  tasks.forEach((task) => {
    counts[task.status]++;
  });

  return BANK_DISPLAY_STATUSES.map((status) => ({
    status,
    count: counts[status],
    color: BANK_STATUS_COLORS[status],
  }));
}

// Calculate Bank KPIs
export function calculateBankKPIs(tasks: BankTask[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "CUENTA ABIERTA").length;
  const rejectedTasks = tasks.filter((t) => t.status === "RECHAZADA").length;
  const inProgressTasks = tasks.filter(
    (t) => !["CUENTA ABIERTA", "RECHAZADA", "PENDIENTE"].includes(t.status),
  ).length;

  const completedWithDates = tasks.filter((t) => t.closed_at !== null);
  const avgLeadTime =
    completedWithDates.length > 0
      ? Math.round(
          completedWithDates.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const closed = new Date(t.closed_at!);
            return sum + Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / completedWithDates.length,
        )
      : 0;

  return {
    totalTasks,
    completedTasks,
    rejectedTasks,
    inProgressTasks,
    avgLeadTime,
  };
}

// Calculate KPIs for Cycle Time dashboard
export function calculateCycleTimeKPIs(tasks: Task[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "EIN LISTO").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status !== "EIN LISTO" && t.status !== "PENDIENTE",
  ).length;
  const avgLeadTime = calculateLeadTime(tasks);

  const einWaitTasks = tasks.filter((t) => t.time_in_status["ESPERANDO EIN"] !== undefined);
  const avgEINWait =
    einWaitTasks.length > 0
      ? Math.round(
          einWaitTasks.reduce((sum, t) => sum + (t.time_in_status["ESPERANDO EIN"] || 0), 0) /
            einWaitTasks.length,
        )
      : 0;

  const delayedTasks = tasks.filter((t) => {
    const intermediateStatuses: LLCStatus[] = [
      "ESPERANDO INPUT CLIENTE",
      "ESPERANDO APROB",
      "FAXEADO",
      "ESPERANDO EIN",
    ];
    return intermediateStatuses.some((status) => (t.time_in_status[status] || 0) > 5);
  }).length;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    avgLeadTime,
    avgEINWait,
    delayedTasks,
  };
}

// Filter Annual Reports by state and package
export function getFilteredAnnualReports(
  state?: StateType | "all",
  pkg?: PackageType | "all",
): AnnualReportTask[] {
  let filtered = ANNUAL_REPORTS_DATA;
  if (state && state !== "all") filtered = filtered.filter((t) => t.state === state);
  if (pkg && pkg !== "all") filtered = filtered.filter((t) => t.package === pkg);
  return filtered;
}

// Filter Agentes Registrados by state and package
export function getFilteredAgentesRegistrados(
  state?: StateType | "all",
  pkg?: PackageType | "all",
): AgenteRegistradoTask[] {
  let filtered = AGENTES_REGISTRADOS_DATA;
  if (state && state !== "all") filtered = filtered.filter((t) => t.state === state);
  if (pkg && pkg !== "all") filtered = filtered.filter((t) => t.package === pkg);
  return filtered;
}

// Filter CX Tickets by state and package
export function getFilteredCXTickets(
  state?: StateType | "all",
  pkg?: PackageType | "all",
): CXTicket[] {
  let filtered = CX_TICKETS_DATA;
  if (state && state !== "all") filtered = filtered.filter((t) => t.state === state);
  if (pkg && pkg !== "all") filtered = filtered.filter((t) => t.package === pkg);
  return filtered;
}

// Calculate Annual Reports KPIs - Only 3 statuses
export function calculateAnnualReportsKPIs(tasks: AnnualReportTask[]) {
  const total = tasks.length;
  const pendiente = tasks.filter((t) => t.status === "pendiente").length;
  const proximoAHacer = tasks.filter((t) => t.status === "proximo_a_hacer").length;
  const completado = tasks.filter((t) => t.status === "completado").length;

  return { total, pendiente, proximoAHacer, completado };
}

// Get Annual Reports Health Check Data (Pie Chart)
export function getAnnualReportsPieData(tasks: AnnualReportTask[]) {
  const pendiente = tasks.filter((t) => t.status === "pendiente").length;
  const proximoAHacer = tasks.filter((t) => t.status === "proximo_a_hacer").length;
  const completado = tasks.filter((t) => t.status === "completado").length;

  return [
    { name: "Completado", value: completado, fill: "#22c55e" },
    { name: "Proximo a Hacer", value: proximoAHacer, fill: "#f59e0b" },
    { name: "Pendiente", value: pendiente, fill: "#6366f1" },
  ];
}

// Calculate Agentes Registrados KPIs - Only 3 statuses
export function calculateAgentesKPIs(tasks: AgenteRegistradoTask[]) {
  const total = tasks.length;
  const pendiente = tasks.filter((t) => t.status === "pendiente").length;
  const esperandoInvoice = tasks.filter((t) => t.status === "esperando_invoice").length;
  const completado = tasks.filter((t) => t.status === "completado").length;
  const completionRate = total > 0 ? Math.round((completado / total) * 100) : 0;

  return { total, pendiente, esperandoInvoice, completado, completionRate };
}

// Get Agentes Status Chart Data (Bar Chart)
export function getAgentesStatusChartData(tasks: AgenteRegistradoTask[]) {
  const pendiente = tasks.filter((t) => t.status === "pendiente").length;
  const esperandoInvoice = tasks.filter((t) => t.status === "esperando_invoice").length;
  const completado = tasks.filter((t) => t.status === "completado").length;

  return [
    { status: "Pendiente", count: pendiente, fill: "#6366f1" },
    { status: "Esperando Invoice", count: esperandoInvoice, fill: "#f59e0b" },
    { status: "Completado", count: completado, fill: "#22c55e" },
  ];
}

// Calculate CX Tickets KPIs - Priority counts and avg resolution time
export function calculateCXTicketsKPIs(tickets: CXTicket[]) {
  const totalTickets = tickets.length;
  const abiertos = tickets.filter(
    (t) => t.status === "abierto" || t.status === "en_progreso",
  ).length;
  const resueltos = tickets.filter((t) => t.status === "resuelto" || t.status === "cerrado").length;

  // Priority counts
  const prioridadAlta = tickets.filter((t) => t.priority === "alta").length;
  const prioridadMedia = tickets.filter((t) => t.priority === "media").length;
  const prioridadBaja = tickets.filter((t) => t.priority === "baja").length;

  // Calculate average resolution time (difference between created_at and resolved_at for closed tickets)
  const closedTickets = tickets.filter((t) => t.resolved_at !== null);
  const avgResolutionTime =
    closedTickets.length > 0
      ? Math.round(
          closedTickets.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const resolved = new Date(t.resolved_at!);
            return sum + (resolved.getTime() - created.getTime()) / (1000 * 60); // minutes
          }, 0) / closedTickets.length,
        )
      : 0;

  // Calculate average first response time
  const ticketsWithResponse = tickets.filter((t) => t.first_response_at !== null);
  const avgResponseTime =
    ticketsWithResponse.length > 0
      ? Math.round(
          ticketsWithResponse.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const responded = new Date(t.first_response_at!);
            return sum + (responded.getTime() - created.getTime()) / (1000 * 60); // minutes
          }, 0) / ticketsWithResponse.length,
        )
      : 0;

  const resolutionRate = totalTickets > 0 ? Math.round((resueltos / totalTickets) * 100) : 0;

  return {
    totalTickets,
    abiertos,
    resueltos,
    prioridadAlta,
    prioridadMedia,
    prioridadBaja,
    avgResolutionTime,
    avgResponseTime,
    resolutionRate,
  };
}
