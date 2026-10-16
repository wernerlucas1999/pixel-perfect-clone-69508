// Tareas de cada persona en el desglose (Etapa 4). Correr con: bun test
/* eslint-disable @typescript-eslint/no-explicit-any -- los datos de ejemplo imitan el JSON crudo de ClickUp */
import { afterEach, beforeAll, describe, expect, test } from "bun:test";

process.env.PEOPLE_DATA_PERMISSIONS = "{}";
process.env.CLICKUP_TOKEN = "token-falso-de-test";

type Api = typeof import("../src/lib/clickup-api");
type Perms = typeof import("../src/lib/permissions.server");
let C: Api;
let P: Perms;
beforeAll(async () => {
  C = await import("../src/lib/clickup-api");
  P = await import("../src/lib/permissions.server");
});
const realFetch = globalThis.fetch;
const realNow = Date.now;
afterEach(() => {
  globalThis.fetch = realFetch;
  Date.now = realNow;
  // El caché es del módulo, compartido con los otros archivos de test: no
  // dejar una carga con el reloj adelantado.
  C.dropScreenCache("annual_reports", Number.MAX_SAFE_INTEGER);
});
// Cada test que toca el caché en su propia hora (caché vencido, ventanas limpias).
let hour = 30;
function freshClock() {
  const offset = hour++ * 3600_000;
  Date.now = () => realNow() + offset;
}

const ALL = [
  "llc_formation",
  "bank_application",
  "annual_reports",
  "agentes_registrados",
  "tax_return",
] as const;

const ALFA = { id: 11, username: "Colaboradora Alfa", email: "alfa@firmaway.us" };
const BETO = { id: 12, username: null, email: "beto@firmaway.us" };
const GAMA = { id: 13, username: "Gama", email: "gama@firmaway.us" };

const STATUSES: Record<string, { open: string; closed: string }> = {
  llc_formation: { open: "PENDIENTE", closed: "ENTREGA COMPLETADA" },
  bank_application: { open: "PENDIENTE", closed: "completada" },
  annual_reports: { open: "pendiente", closed: "complete" },
  agentes_registrados: { open: "pendiente", closed: "complete" },
  tax_return: { open: "en proceso", closed: "complete" },
};
const MAPPERS: Record<string, (raw: any) => any> = {
  llc_formation: (r) => C.mapToTask(r),
  bank_application: (r) => C.mapToBankTask(r),
  annual_reports: (r) => C.mapAnnualReportTask(r),
  agentes_registrados: (r) => C.mapRegisteredAgentTask(r),
  tax_return: (r) => C.mapTaxReturnTask(r),
};
const day = (d: number, h = 15) => Date.UTC(2026, 0, d, h);
// [creada, cerrada (null = abierta), asignados]
const SCENARIO: [number, number | null, any[]][] = [
  [1, 15, [ALFA]],
  [2, 16, [ALFA]],
  [3, 17, [BETO]],
  [4, 18, [ALFA, BETO]],
  [5, 19, []],
  [6, null, [ALFA]],
  [7, null, []],
  [8, 25, [BETO]],
  [9, 26, [ALFA, BETO, GAMA]],
  [10, 27, [ALFA, ALFA]], // repetido en ClickUp: cuenta una vez
  [12, 5, [GAMA]],
  [13, 28, []],
];
const internalFor = (process: string) =>
  SCENARIO.map(([created, closed, people], i) =>
    MAPPERS[process]({
      id: `b${i}`,
      name: `Cliente ${i} LLC`,
      status:
        closed === null
          ? { status: STATUSES[process].open, type: "open" }
          : { status: STATUSES[process].closed, type: "closed" },
      date_created: String(day(created)),
      date_closed: closed === null ? null : String(day(closed)),
      due_date: String(day(28)),
      assignees: people,
      custom_fields: [],
    }),
  ).filter(Boolean);

const breakdown = (process: string, dateRange?: { from: string | null; to: string | null }) => {
  const internal = internalFor(process);
  return C.buildPeopleBreakdown({ process: process as never, dateRange }, {
    [process]: async () => internal,
  } as never);
};

describe("las filas de cada persona son exactamente su barra", () => {
  for (const process of ALL) {
    for (const range of [undefined, { from: "2026-01-10", to: "2026-01-26" }]) {
      test(`${process} ${range ? "con período" : "sin período"}`, async () => {
        const r = await breakdown(process, range);
        expect(r.tasks).toHaveLength(r.closedTotal);
        expect(r.unassignedTasks).toHaveLength(r.unassignedCount);
        expect(r.people.length).toBeGreaterThan(0);
        for (const p of r.people) {
          // La verificación del usuario: tantas filas como dice la barra.
          expect(p.tasks).toHaveLength(p.metrics.closedCount);
          expect(p.metrics.ownCount + p.metrics.sharedCount).toBe(p.metrics.closedCount);
          expect(new Set(p.tasks).size).toBe(p.tasks.length);
          for (const i of p.tasks) expect(r.tasks[i].assignees).toContain(p.name);
          const shared = p.tasks.filter((i) => r.tasks[i].assignees.length > 1).length;
          expect(shared).toBe(p.metrics.sharedCount);
        }
        for (const i of r.unassignedTasks) expect(r.tasks[i].assignees).toEqual([]);
        // Toda tarea está en al menos una persona o en "Sin asignar".
        const covered = new Set([...r.unassignedTasks, ...r.people.flatMap((p) => p.tasks)]);
        expect(covered.size).toBe(r.tasks.length);
        // De la más reciente a la más vieja.
        const ms = r.tasks.map((t) => t.closedAtMs!);
        expect(ms).toEqual([...ms].sort((a, b) => b - a));
      });
    }
  }

  test("los conteos no cambian respecto del escenario de la Etapa 3", async () => {
    const r = await breakdown("llc_formation", { from: "2026-01-10", to: "2026-01-20" });
    expect({ total: r.closedTotal, sinAsignar: r.unassignedCount }).toEqual({
      total: 5,
      sinAsignar: 1,
    });
    expect(Object.fromEntries(r.people.map((p) => [p.name, p.metrics]))).toEqual({
      "Colaboradora Alfa": { closedCount: 3, ownCount: 2, sharedCount: 1 },
      "beto@firmaway.us": { closedCount: 2, ownCount: 1, sharedCount: 1 },
    });
    // Filas de Alfa: las cerradas el 18 (compartida), 16 y 15.
    const alfa = r.people.find((p) => p.name === "Colaboradora Alfa")!;
    expect(alfa.tasks.map((i) => r.tasks[i].id)).toEqual(["b3", "b1", "b0"]);
  });

  test("un asignado repetido en ClickUp cuenta una sola vez", async () => {
    const r = await breakdown("agentes_registrados");
    const b9 = r.tasks.find((t) => t.id === "b9")!;
    expect(b9.assignees).toEqual(["Colaboradora Alfa"]);
  });
});

describe("días de cada tarea: la medida de su proceso, sin una nueva", () => {
  test("LLC y Bancaria: la misma cuenta que el KPI Lead Time Promedio", async () => {
    for (const process of ["llc_formation", "bank_application"]) {
      const internal = internalFor(process);
      const r = await breakdown(process);
      for (const row of r.tasks) {
        const t = internal.find((x: any) => x.id === row.id);
        expect(row.days).toBe(C.leadTimeDays(t));
        expect(typeof row.days).toBe("number");
      }
    }
    // El promedio de las filas es el KPI (mismas tareas cerradas).
    const internal = internalFor("llc_formation");
    const r = await breakdown("llc_formation");
    const avg =
      Math.round((r.tasks.reduce((s, t) => s + (t.days ?? 0), 0) / r.tasks.length) * 10) / 10;
    expect(avg).toBe(C.calculateLeadTime(internal));
  });

  test("Tax Return: Lead Time desde Compra (regla 18 h)", async () => {
    const internal = internalFor("tax_return");
    const r = await breakdown("tax_return");
    for (const row of r.tasks) {
      const t = internal.find((x: any) => x.id === row.id);
      expect(row.days).toBe(t.diasLeadTime);
    }
    expect(r.tasks.some((t) => t.days !== null)).toBe(true);
  });

  test("Annual Reports y Agentes no miden tiempo: sin días y sin definición", async () => {
    for (const process of ["annual_reports", "agentes_registrados"] as const) {
      const r = await breakdown(process);
      expect(r.tasks.length).toBeGreaterThan(0);
      expect(r.tasks.every((t) => t.days === null)).toBe(true);
      expect(C.LEAD_TIME_DEFINITIONS[process]).toBeNull();
    }
    for (const process of ["llc_formation", "bank_application", "tax_return"] as const) {
      expect(C.LEAD_TIME_DEFINITIONS[process]).not.toBeNull();
    }
  });
});

// ─── "Todos los procesos": solo el desglose, mismo permiso ─
const TABLE = JSON.stringify({
  "lucas@firmaway.us": [
    "llc_formation",
    "bank_application",
    "annual_reports",
    "agentes_registrados",
  ],
});
const canSee = (e: string, p: any) => P.canSeePeople(e, p, P.parsePeoplePermissions(TABLE));

function fakeAnnualReports() {
  let requests = 0;
  const tasks = [
    {
      id: "a",
      name: "Cliente a LLC",
      status: { status: "complete", type: "closed" },
      date_created: "1767225600000",
      date_closed: "1767312000000",
      assignees: [ALFA],
      custom_fields: [],
    },
  ];
  globalThis.fetch = (async (url: string) => {
    requests++;
    const page = Number(new URL(url).searchParams.get("page"));
    return new Response(JSON.stringify({ tasks: page === 0 ? tasks : [] }), { status: 200 });
  }) as any;
  return () => requests;
}

describe("peopleOnly", () => {
  test("con permiso: el desglose con sus filas, sin la lista de la pantalla", async () => {
    freshClock();
    fakeAnnualReports();
    const r = await C.screenDataFor(
      "lucas@firmaway.us",
      "annual_reports",
      { peopleOnly: true },
      (i) => C.listAnnualReports(i),
      canSee,
    );
    expect(r.tasks).toEqual([]);
    expect(r.people!.closedTotal).toBe(1);
    expect(r.people!.people[0].tasks).toHaveLength(1);
    expect(r.fetchedAt).not.toBeNull();
  });

  test.each([
    ["sin permiso para ese proceso", "lucas@firmaway.us", "tax_return"],
    ["cuenta sin permisos", "otra@firmaway.us", "annual_reports"],
    ["sin sesión", null, "annual_reports"],
  ])("%s → 403 sin tocar ClickUp", async (_name, email, process) => {
    freshClock();
    const requests = fakeAnnualReports();
    await expect(
      C.screenDataFor(
        email as any,
        process as any,
        { peopleOnly: true, withPeople: false },
        (i) => C.listAnnualReports(i),
        canSee,
      ),
    ).rejects.toBeInstanceOf(C.ForbiddenPeopleError);
    expect(requests()).toBe(0);
  });
});

describe("cacheAges", () => {
  test("informa solo los cachés vigentes y no pide nada a ClickUp", async () => {
    freshClock();
    fakeAnnualReports();
    await C.screenDataFor(
      "otra@firmaway.us",
      "annual_reports",
      {},
      (i) => C.listAnnualReports(i),
      canSee,
    );
    const requests = fakeAnnualReports();
    const now = Date.now();
    const ages = C.cacheAges(now);
    expect(Object.keys(ages)).toEqual([...ALL]);
    expect(ages.annual_reports).not.toBeNull();
    expect(C.cacheAges(now + C.CACHE_TTL_MS).annual_reports).toBeNull();
    expect(requests()).toBe(0);
  });
});
