// Bordes de período en hora argentina. Correr con: bun test
/* eslint-disable @typescript-eslint/no-explicit-any -- los datos de ejemplo imitan el JSON crudo de ClickUp */
import { beforeAll, describe, expect, test } from "bun:test";

process.env.PEOPLE_DATA_PERMISSIONS = "{}";

type Api = typeof import("../src/lib/clickup-api");
type Periods = typeof import("../src/lib/periods");
let C: Api;
let P: Periods;
beforeAll(async () => {
  C = await import("../src/lib/clickup-api");
  P = await import("../src/lib/periods");
});

// Instante a partir de una hora de pared argentina (UTC-3 en 2026).
const ar = (y: number, mo: number, d: number, h: number, mi = 0) =>
  Date.UTC(y, mo - 1, d, h + 3, mi);

// Los dos casos pedidos, en marzo de 2026.
const MAR = { from: "2026-03-01", to: "2026-03-31" };
const FEB = { from: "2026-02-01", to: "2026-02-28" };
const APR = { from: "2026-04-01", to: "2026-04-30" };
const LAST_DAY_2130 = ar(2026, 3, 31, 21, 30); // 31/03 21:30 AR = 01/04 00:30 UTC
const PREV_LAST_DAY_2200 = ar(2026, 2, 28, 22, 0); // 28/02 22:00 AR = 01/03 01:00 UTC

describe("periodBoundsMs: medianoche argentina", () => {
  test("marzo empieza el 01/03 00:00 AR y termina el 31/03 23:59:59.999 AR", () => {
    const b = P.periodBoundsMs(MAR);
    expect(new Date(b.from!).toISOString()).toBe("2026-03-01T03:00:00.000Z");
    expect(new Date(b.to!).toISOString()).toBe("2026-04-01T02:59:59.999Z");
  });
  test("31/03 21:30 AR cae en marzo y no en abril", () => {
    expect(P.inPeriod(LAST_DAY_2130, P.periodBoundsMs(MAR))).toBe(true);
    expect(P.inPeriod(LAST_DAY_2130, P.periodBoundsMs(APR))).toBe(false);
  });
  test("28/02 22:00 AR no cae en marzo y sí en febrero", () => {
    expect(P.inPeriod(PREV_LAST_DAY_2200, P.periodBoundsMs(MAR))).toBe(false);
    expect(P.inPeriod(PREV_LAST_DAY_2200, P.periodBoundsMs(FEB))).toBe(true);
  });
  test("los bordes exactos: 00:00 AR entra, un milisegundo antes no", () => {
    const b = P.periodBoundsMs(MAR);
    expect(P.inPeriod(ar(2026, 3, 1, 0), b)).toBe(true);
    expect(P.inPeriod(ar(2026, 3, 1, 0) - 1, b)).toBe(false);
    expect(P.inPeriod(ar(2026, 4, 1, 0) - 1, b)).toBe(true);
    expect(P.inPeriod(ar(2026, 4, 1, 0), b)).toBe(false);
  });
  test("no depende de la zona horaria del servidor", () => {
    const before = process.env.TZ;
    const results = [
      "UTC",
      "America/Argentina/Buenos_Aires",
      "Asia/Tokyo",
      "America/Los_Angeles",
    ].map((tz) => {
      process.env.TZ = tz;
      return P.periodBoundsMs(MAR);
    });
    process.env.TZ = before;
    for (const r of results) expect(r).toEqual(results[0]);
  });
  test("día inválido → error", () => {
    expect(() => P.periodBoundsMs({ from: "31/03/2026", to: null })).toThrow();
  });
  test("toDayString usa el día de calendario local del selector", () => {
    expect(P.toDayString(new Date(2026, 2, 31))).toBe("2026-03-31");
    expect(P.toDayString(null)).toBeNull();
  });
});

// ─── Las 5 listas y el breakdown ───────────────────────────
// Dos tareas cerradas: una el último día del mes a las 21:30 AR y otra el
// último día del mes anterior a las 22:00 AR. Para Annual Reports (cuya lista
// filtra por creación) los mismos instantes van en la fecha de creación.
const STATUSES: Record<string, { closed: string }> = {
  llc_formation: { closed: "ENTREGA COMPLETADA" },
  bank_application: { closed: "completada" },
  annual_reports: { closed: "complete" },
  agentes_registrados: { closed: "complete" },
  tax_return: { closed: "complete" },
};
const PROCS = Object.keys(STATUSES);

function fixtures(process: string) {
  const map: Record<string, (r: any) => any> = {
    llc_formation: (r) => C.mapToTask(r),
    bank_application: (r) => C.mapToBankTask(r),
    annual_reports: (r) => C.mapAnnualReportTask(r),
    agentes_registrados: (r) => C.mapRegisteredAgentTask(r),
    tax_return: (r) => C.mapTaxReturnTask(r),
  };
  const raw = (id: string, ms: number) => ({
    id,
    name: `Cliente ${id} LLC`,
    status: { status: STATUSES[process].closed, type: "closed" },
    date_created: String(process === "annual_reports" ? ms : ar(2026, 1, 10, 12)),
    date_closed: String(ms),
    due_date: String(ar(2026, 5, 1, 12)),
    assignees: [{ id: 1, username: "Alguien" }],
    custom_fields: [],
  });
  return [raw("fin-de-mes", LAST_DAY_2130), raw("fin-mes-anterior", PREV_LAST_DAY_2200)]
    .map(map[process])
    .filter(Boolean);
}

async function listIds(process: string, dateRange: { from: string; to: string }) {
  const items = fixtures(process);
  const load = async () => items as any[];
  const out: any[] = await {
    llc_formation: () => C.listLLCTasks({ processType: "all", dateRange }, load),
    bank_application: () => C.listBankTasks({ dateRange }, load),
    annual_reports: () => C.listAnnualReports({ dateRange }, load),
    agentes_registrados: () => C.listAgentesRegistrados({ dateRange }, load),
    tax_return: () => C.listTaxReturns({ dateRange }, load),
  }[process]!();
  return out.map((t) => t.id).sort();
}

describe("listas: el borde del mes en hora argentina", () => {
  for (const process of PROCS) {
    test(`${process}: 31/03 21:30 AR en marzo; 28/02 22:00 AR fuera de marzo`, async () => {
      expect(await listIds(process, MAR)).toEqual(["fin-de-mes"]);
      expect(await listIds(process, APR)).toEqual([]);
      expect(await listIds(process, FEB)).toEqual(["fin-mes-anterior"]);
    });
  }
});

describe("breakdown: el borde del mes en hora argentina", () => {
  for (const process of PROCS) {
    test(`${process}`, async () => {
      const items = fixtures(process);
      const run = (dateRange: { from: string; to: string }) =>
        C.buildPeopleBreakdown(
          { process: process as never, dateRange },
          {
            [process]: async () => items,
          },
        );
      expect((await run(MAR)).closedTotal).toBe(1);
      expect((await run(APR)).closedTotal).toBe(0);
      expect((await run(FEB)).closedTotal).toBe(1);
      expect((await run(MAR)).period).toEqual({
        from: "2026-03-01",
        to: "2026-03-31",
        basis: "closed_at",
      });
    });
  }
});

describe("LLC: una tarea abierta se corta por su creación, también en hora argentina", () => {
  test("creada el 31/03 21:30 AR, abierta → marzo", async () => {
    const t = C.mapToTask({
      id: "abierta",
      name: "Cliente abierta LLC",
      status: { status: "PENDIENTE", type: "open" },
      date_created: String(LAST_DAY_2130),
      date_closed: null,
      assignees: [],
      custom_fields: [],
    })!;
    const ids = async (dateRange: { from: string; to: string }) =>
      (await C.listLLCTasks({ processType: "all", dateRange }, async () => [t])).map((x) => x.id);
    expect(await ids(MAR)).toEqual(["abierta"]);
    expect(await ids(APR)).toEqual([]);
  });
});

describe("las duraciones no cambian: created_at/closed_at siguen siendo el día UTC", () => {
  test("LLC cerrada el 31/03 21:30 AR conserva closed_at = 2026-04-01 (día UTC)", () => {
    const t = fixtures("llc_formation")[0];
    expect(t.closed_at).toBe("2026-04-01");
    expect(t.closed_at_ms).toBe(LAST_DAY_2130);
  });
});
