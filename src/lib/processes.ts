// Procesos reales del dashboard (los de PROCESSES en clickup-api.ts, sin
// "other"). Es la lista contra la que se valida PEOPLE_DATA_PERMISSIONS;
// tests/people-data.test.ts falla si se desincroniza de PROCESSES.
export const DASHBOARD_PROCESS_IDS = [
  "llc_formation",
  "bank_application",
  "annual_reports",
  "agentes_registrados",
  "tax_return",
] as const;

export type DashboardProcess = (typeof DASHBOARD_PROCESS_IDS)[number];

export function isDashboardProcess(value: unknown): value is DashboardProcess {
  return (DASHBOARD_PROCESS_IDS as readonly unknown[]).includes(value);
}
