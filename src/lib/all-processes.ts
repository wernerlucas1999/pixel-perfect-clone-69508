import { PROCESSES, type PeopleBreakdown } from "./clickup-api";
import type { DashboardProcess } from "./processes";

// Lógica de "Todos los procesos" (all-processes-view.tsx), sin interfaz.

// Si ClickUp está saturado, se espera esto y se reintenta ese proceso una vez.
export const SATURATED_RETRY_MS = 60_000;

export function processLabel(process: DashboardProcess) {
  const p = PROCESSES.find((x) => x.id === process);
  return { name: p?.name ?? process, color: p?.color ?? "#888" };
}

// Orden de carga: primero los que el servidor tiene en caché (no le piden
// nada a ClickUp), después el resto, cada grupo en el orden de siempre.
export function loadOrder(
  processes: readonly DashboardProcess[],
  ages: Partial<Record<DashboardProcess, number | null>>,
): DashboardProcess[] {
  const cached = processes.filter((p) => typeof ages[p] === "number");
  return [...cached, ...processes.filter((p) => !cached.includes(p))];
}

// Una fila del gráfico por persona: un tramo por proceso (su barra en la
// pantalla de ese proceso) y el total, que es la suma de esos tramos.
export type CombinedRow = { name: string; total: number } & Partial<
  Record<DashboardProcess, number>
>;

export function combinePeople(breakdowns: readonly PeopleBreakdown[]): CombinedRow[] {
  const rows = new Map<string, CombinedRow>();
  for (const b of breakdowns) {
    for (const p of b.people) {
      const row = rows.get(p.name) ?? { name: p.name, total: 0 };
      row[b.process] = p.tasks.length;
      row.total += p.tasks.length;
      rows.set(p.name, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.total - a.total);
}
