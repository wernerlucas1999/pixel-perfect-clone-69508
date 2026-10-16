// "Todos los procesos" (Etapa 4). Correr con: bun test
/* eslint-disable @typescript-eslint/no-explicit-any -- tareas de ejemplo */
import { beforeAll, describe, expect, test } from "bun:test";

process.env.PEOPLE_DATA_PERMISSIONS = "{}";

type Api = typeof import("../src/lib/clickup-api");
type All = typeof import("../src/lib/all-processes");
let C: Api;
let A: All;
beforeAll(async () => {
  C = await import("../src/lib/clickup-api");
  A = await import("../src/lib/all-processes");
});

describe("orden de carga", () => {
  test("primero los que están en caché, después el resto, en el orden de siempre", () => {
    const procs = [
      "llc_formation",
      "bank_application",
      "annual_reports",
      "agentes_registrados",
    ] as const;
    expect(
      A.loadOrder(procs, { annual_reports: 1, bank_application: null, agentes_registrados: 2 }),
    ).toEqual(["annual_reports", "agentes_registrados", "llc_formation", "bank_application"]);
    // Sin datos de caché (falló la consulta): el orden de siempre.
    expect(A.loadOrder(procs, {})).toEqual([...procs]);
  });
});

describe("barras combinadas", () => {
  const raw = (id: string, people: string[]) => ({
    id,
    name: `Cliente ${id} LLC`,
    status: { status: "complete", type: "closed" },
    date_created: String(Date.UTC(2026, 9, 1, 15)),
    date_closed: String(Date.UTC(2026, 9, 5, 15)),
    assignees: people.map((username) => ({ username })),
    custom_fields: [],
  });
  const build = async (process: "llc_formation" | "agentes_registrados", tasks: any[]) => {
    const map = process === "llc_formation" ? C.mapToTask : C.mapRegisteredAgentTask;
    const internal = tasks.map(map as any).filter(Boolean);
    return C.buildPeopleBreakdown({ process }, { [process]: async () => internal } as any);
  };

  test("cada tramo es la barra del proceso y el total es su suma", async () => {
    const llc = await build("llc_formation", [
      raw("1", ["Tomás"]),
      raw("2", ["Tomás", "Camila"]),
      raw("3", ["Camila"]),
    ]);
    const ag = await build("agentes_registrados", [
      raw("4", ["Camila"]),
      raw("5", ["Camila"]),
      raw("6", ["Camila"]),
      raw("7", []),
    ]);
    const rows = A.combinePeople([llc, ag]);
    expect(rows).toEqual([
      { name: "Camila", total: 5, llc_formation: 2, agentes_registrados: 3 },
      { name: "Tomás", total: 2, llc_formation: 2 },
    ]);
    for (const row of rows) {
      for (const b of [llc, ag]) {
        const bar = b.people.find((p) => p.name === row.name)?.metrics.closedCount;
        expect(row[b.process]).toBe(bar);
      }
    }
  });
});
