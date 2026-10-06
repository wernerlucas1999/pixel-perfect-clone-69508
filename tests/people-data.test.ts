// Tests de datos por persona (Etapa 2). Correr con: bun test
/* eslint-disable @typescript-eslint/no-explicit-any -- los datos de ejemplo imitan el JSON crudo de ClickUp, que el código de producción también trata como any */
import { beforeAll, describe, expect, test } from "bun:test";

process.env.BETTER_AUTH_SECRET = "test-secret-".padEnd(44, "x");
process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.PEOPLE_DATA_PERMISSIONS = "{}";

type Api = typeof import("../src/lib/clickup-api");
type Perms = typeof import("../src/lib/permissions.server");
let C: Api;
let P: Perms;
let authGate: (request: Request) => Promise<Response | null>;

beforeAll(async () => {
  C = await import("../src/lib/clickup-api");
  P = await import("../src/lib/permissions.server");
  ({ authGate } = await import("../src/server"));
});

// La tabla de permisos de la Etapa 2.
const TABLE = JSON.stringify({
  "ezequiel@firmaway.us": [
    "llc_formation",
    "bank_application",
    "annual_reports",
    "agentes_registrados",
    "tax_return",
  ],
  "gian@firmaway.us": ["tax_return"],
  "lucas@firmaway.us": [
    "llc_formation",
    "bank_application",
    "annual_reports",
    "agentes_registrados",
  ],
});
const ALL = [
  "llc_formation",
  "bank_application",
  "annual_reports",
  "agentes_registrados",
  "tax_return",
];

// ─── Config ────────────────────────────────────────────────
describe("parsePeoplePermissions", () => {
  test("la tabla de la Etapa 2 es válida", () => {
    const p = P.parsePeoplePermissions(TABLE);
    expect([...p.keys()]).toEqual([
      "ezequiel@firmaway.us",
      "gian@firmaway.us",
      "lucas@firmaway.us",
    ]);
  });
  test("{} es válida: nadie ve datos por persona", () => {
    expect(P.parsePeoplePermissions("{}").size).toBe(0);
  });
  test("normaliza los emails de la config a minúsculas", () => {
    const p = P.parsePeoplePermissions('{" Gian@FirmaWay.US ":["tax_return"]}');
    expect([...p.keys()]).toEqual(["gian@firmaway.us"]);
  });
  test.each([
    ["variable ausente", undefined],
    ["variable vacía", "   "],
    ["JSON roto", '{"gian@firmaway.us":["tax_return"]'],
    ["array en vez de objeto", '["tax_return"]'],
    ["null", "null"],
    ["string", '"tax_return"'],
    ["email de otro dominio", '{"gian@gmail.com":["tax_return"]}'],
    ["subdominio", '{"gian@sub.firmaway.us":["tax_return"]}'],
    ["sin @", '{"gian":["tax_return"]}'],
    ["email repetido (por mayúsculas)", '{"gian@firmaway.us":[],"GIAN@firmaway.us":[]}'],
    ["valor que no es lista", '{"gian@firmaway.us":"tax_return"}'],
    ["proceso inexistente", '{"gian@firmaway.us":["taxreturn"]}'],
    ["proceso eliminado (ticketera)", '{"gian@firmaway.us":["ticketera_cx"]}'],
    ['"other" no es un proceso real', '{"gian@firmaway.us":["other"]}'],
    ["comodín", '{"gian@firmaway.us":["*"]}'],
    ["proceso repetido", '{"gian@firmaway.us":["tax_return","tax_return"]}'],
    ["proceso que no es string", '{"gian@firmaway.us":[1]}'],
  ])("rechaza: %s", (_name, raw) => {
    expect(() => P.parsePeoplePermissions(raw)).toThrow(P.PermissionsConfigError);
  });
});

test("la lista de procesos de la config coincide con PROCESSES (sin 'other')", async () => {
  const { DASHBOARD_PROCESS_IDS } = await import("../src/lib/processes");
  expect([...DASHBOARD_PROCESS_IDS]).toEqual(
    C.PROCESSES.map((p) => p.id).filter((id) => id !== "other"),
  );
});

describe("canSeePeople con la tabla de la Etapa 2", () => {
  const cases: [string, string[]][] = [
    ["ezequiel@firmaway.us", ALL],
    ["gian@firmaway.us", ["tax_return"]],
    ["lucas@firmaway.us", ALL.filter((p) => p !== "tax_return")],
    ["otra@firmaway.us", []],
    // El email de la sesión también se normaliza.
    ["  Gian@FIRMAWAY.us ", ["tax_return"]],
  ];
  test.each(cases)("%s", (email, expected) => {
    const perms = P.parsePeoplePermissions(TABLE);
    expect(P.allowedPeopleProcesses(email, perms)).toEqual(expected as never);
    for (const p of ALL) {
      expect(P.canSeePeople(email, p as never, perms)).toBe(expected.includes(p));
    }
  });
});

describe("falla cerrada: config de permisos rota → 503 en todo", () => {
  test.each([
    ["ausente", undefined],
    ["mal escrita", '{"gian@firmaway.us":["taxreturn"]}'],
  ])("%s", async (_name, raw) => {
    const before = process.env.PEOPLE_DATA_PERMISSIONS;
    if (raw === undefined) delete process.env.PEOPLE_DATA_PERMISSIONS;
    else process.env.PEOPLE_DATA_PERMISSIONS = raw;
    try {
      for (const path of ["/", "/login", "/_serverFn/x", "/api/auth/get-session"]) {
        const res = await authGate(new Request(`http://localhost:8080${path}`));
        expect({ path, status: res?.status }).toEqual({ path, status: 503 });
      }
    } finally {
      process.env.PEOPLE_DATA_PERMISSIONS = before;
    }
  });
});

// ─── Datos de ejemplo con personas ─────────────────────────
// Tareas crudas como las devuelve ClickUp, con dos colaboradores: uno con
// username, email y avatar, y otro solo con email.
const ALICE = {
  id: 11,
  username: "Colaboradora Alfa",
  email: "alfa@firmaway.us",
  profilePicture: "https://avatars.example.com/alfa.png",
  initials: "CA",
  color: "#123456",
};
const BETO = { id: 12, username: null, email: "beto@firmaway.us", profilePicture: null };
const NEEDLES = [
  "Colaboradora Alfa",
  "alfa@firmaway.us",
  "beto@firmaway.us",
  "@firmaway.us",
  "avatars.example.com",
];

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 5, 12);

function rawTasks(statuses: { open: string; closed: string }) {
  const people = [[ALICE], [BETO], [ALICE, BETO], []];
  return Array.from({ length: 8 }, (_, i) => {
    const closed = i % 2 === 0;
    return {
      id: `t${i}`,
      name: `Tarea ${i} LLC`,
      status: closed
        ? { status: statuses.closed, type: "closed" }
        : { status: statuses.open, type: "open" },
      date_created: String(T0 + i * DAY),
      date_closed: closed ? String(T0 + (i + 3 + i * 2) * DAY) : null,
      due_date: String(T0 + 30 * DAY),
      assignees: people[i % people.length],
      custom_fields: [],
    };
  });
}

type ProcessCase = {
  id: string;
  internal: () => any[];
  list: (load: () => Promise<any[]>) => Promise<any[]>;
  kpis: (items: any[]) => unknown[];
};

const PROCESSES: () => ProcessCase[] = () => [
  {
    id: "llc_formation",
    internal: () =>
      rawTasks({ open: "PENDIENTE", closed: "ENTREGA COMPLETADA" })
        .map(C.mapToTask)
        .filter(Boolean),
    list: (load) => C.listLLCTasks({ processType: "all" }, load),
    kpis: (t) => [
      C.getFunnelData(t),
      C.getAverageTimeByStatus(t),
      C.calculateLeadTime(t),
      C.calculateCycleTimeKPIs(t),
      C.getLLCTaskExtremes(t),
    ],
  },
  {
    id: "bank_application",
    internal: () =>
      rawTasks({ open: "PENDIENTE", closed: "complete" }).map(C.mapToBankTask).filter(Boolean),
    list: (load) => C.listBankTasks({}, load),
    kpis: (t) => [
      C.calculateBankKPIs(t),
      C.calculateBottleneckAnalysis(t),
      C.getBankStatusCounts(t),
      C.getBankTaskExtremes(t),
    ],
  },
  {
    id: "annual_reports",
    internal: () =>
      rawTasks({ open: "pendiente", closed: "completado" }).map(C.mapAnnualReportTask),
    list: (load) => C.listAnnualReports({}, load),
    kpis: (t) => [C.calculateAnnualReportsKPIs(t), C.getAnnualReportsPieData(t)],
  },
  {
    id: "agentes_registrados",
    internal: () =>
      rawTasks({ open: "pendiente", closed: "completado" }).map(C.mapRegisteredAgentTask),
    list: (load) => C.listAgentesRegistrados({}, load),
    kpis: (t) => [C.calculateAgentesKPIs(t), C.getAgentesStatusChartData(t)],
  },
  {
    id: "tax_return",
    internal: () =>
      rawTasks({ open: "en proceso", closed: "complete" }).map(C.mapTaxReturnTask).filter(Boolean),
    list: (load) => C.listTaxReturns({}, load),
    kpis: (t) => [C.calculateTaxReturnKPIs(t), C.getTaxReturnTaskExtremes(t)],
  },
];

// ─── Fuga: ninguna lista devuelve datos de personas ────────
describe("las 5 listas nunca devuelven datos de personas", () => {
  test("los datos de ejemplo cubren los 5 procesos", () => {
    expect(PROCESSES().map((p) => p.id)).toEqual(ALL);
  });

  for (const pid of ALL) {
    test(pid, async () => {
      const p = PROCESSES().find((x) => x.id === pid)!;
      const internal = p.internal();
      // Sanidad: el caché SÍ tiene personas (si no, el test no prueba nada).
      expect(internal.length).toBe(8);
      expect(JSON.stringify(internal)).toContain("Colaboradora Alfa");
      expect(JSON.stringify(internal)).toContain("beto@firmaway.us");

      const out = await p.list(async () => internal);
      expect(out).toHaveLength(internal.length);
      const json = JSON.stringify(out);
      for (const needle of NEEDLES) expect(json).not.toContain(needle);
      for (const item of out) {
        expect(Object.keys(item)).not.toContain("assignees");
        expect(Object.keys(item)).not.toContain("assignee");
      }
    });
  }
});

// ─── Los números no cambian con el recorte ─────────────────
describe("identidad de KPIs: mismos números con y sin datos de personas", () => {
  for (const pid of ALL) {
    test(pid, async () => {
      const p = PROCESSES().find((x) => x.id === pid)!;
      const internal = p.internal();
      const out = await p.list(async () => internal);
      expect(p.kpis(out)).toEqual(p.kpis(internal));
    });
  }

  test("getPeopleBreakdown cuenta igual que el viejo getTaxReturnByAssignee", async () => {
    const internal = PROCESSES()
      .find((x) => x.id === "tax_return")!
      .internal();
    // Copia literal del cálculo que antes corría en el navegador, con el
    // mapeo viejo de assignees (que rellenaba con "Sin asignar").
    const oldAssignees = (raw: any): string[] => {
      const a: string[] = Array.isArray(raw?.assignees)
        ? raw.assignees.map((x: any) => x?.username ?? x?.email ?? "Sin asignar").filter(Boolean)
        : [];
      return a.length > 0 ? a : ["Sin asignar"];
    };
    const raws = rawTasks({ open: "en proceso", closed: "complete" });
    const counts = new Map<string, number>();
    raws.forEach((raw, i) => {
      if (!internal[i].isClosed) return;
      for (const a of oldAssignees(raw)) {
        if (!a || a === "Sin asignar") continue;
        counts.set(a, (counts.get(a) ?? 0) + 1);
      }
    });
    const expected = Array.from(counts.entries())
      .map(([assignee, count]) => ({ assignee, count }))
      .sort((a, b) => b.count - a.count);

    const r = await C.buildPeopleBreakdown(
      { process: "tax_return" },
      { tax_return: async () => internal },
    );
    expect(r.people.map((p) => ({ assignee: p.name, count: p.metrics.closedCount }))).toEqual(
      expected,
    );
    expect(expected.length).toBeGreaterThan(0);
  });
});

// ─── getPeopleBreakdown: permiso por proceso ───────────────
describe("peopleBreakdownFor", () => {
  const perms = () => P.parsePeoplePermissions(TABLE);
  const canSee = (e: string, p: any) => P.canSeePeople(e, p, perms());
  const taxLoad = () => {
    const internal = PROCESSES()
      .find((x) => x.id === "tax_return")!
      .internal();
    return { tax_return: async () => internal };
  };

  test("gian@ ve Tax Return", async () => {
    const r = await C.peopleBreakdownFor(
      "gian@firmaway.us",
      { process: "tax_return" },
      canSee,
      taxLoad(),
    );
    expect(JSON.stringify(r)).toContain("Colaboradora Alfa");
  });

  test.each([
    ["lucas@firmaway.us", "tax_return"],
    ["otra@firmaway.us", "tax_return"],
    ["gian@firmaway.us", "llc_formation"],
    ["otra@firmaway.us", "bank_application"],
  ])("%s en %s → Forbidden (403)", async (email, process) => {
    await expect(
      C.peopleBreakdownFor(email, { process: process as never }, canSee, taxLoad()),
    ).rejects.toBeInstanceOf(C.ForbiddenPeopleError);
  });

  test("proceso inválido → InvalidPeopleProcessError (400), antes de mirar permisos", async () => {
    await expect(
      C.peopleBreakdownFor("ezequiel@firmaway.us", { process: "ticketera_cx" as never }, canSee),
    ).rejects.toBeInstanceOf(C.InvalidPeopleProcessError);
  });

  test.each([
    [
      "lucas@firmaway.us",
      ["llc_formation", "bank_application", "annual_reports", "agentes_registrados"],
    ],
    ["ezequiel@firmaway.us", ALL],
  ])("%s ve sus procesos permitidos", async (email, processes) => {
    for (const process of processes) {
      const internal = PROCESSES()
        .find((x) => x.id === process)!
        .internal();
      const r = await C.peopleBreakdownFor(email, { process: process as never }, canSee, {
        [process]: async () => internal,
      });
      expect(r.process).toBe(process as never);
      expect(JSON.stringify(r)).toContain("Colaboradora Alfa");
    }
  });
});

// ─── Breakdown de los 5 procesos: qué cuenta ───────────────
// Tareas cerradas con fecha de cierre en el período, agrupadas por asignado
// actual; las compartidas suman a cada participante y las sin asignado van
// aparte.
describe("buildPeopleBreakdown en los 5 procesos", () => {
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
  const day = (d: number) => Date.UTC(2026, 0, d, 15);
  // [creada, cerrada (null = abierta), asignados]
  const SCENARIO: [number, number | null, any[]][] = [
    [1, 15, [ALICE]], // propia de Alfa
    [2, 16, [ALICE]], // propia de Alfa
    [3, 17, [BETO]], // propia de Beto
    [4, 18, [ALICE, BETO]], // compartida
    [5, 19, []], // sin asignar
    [6, null, [ALICE]], // abierta: no cuenta
    [7, null, []], // abierta sin asignar: no cuenta
    [8, 25, [BETO]], // cerrada fuera del rango del 10 al 20
    [12, 5, [ALICE]], // creada dentro del rango pero cerrada antes: no cuenta con rango
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
  const pick = (r: any) => ({
    closedTotal: r.closedTotal,
    unassignedCount: r.unassignedCount,
    people: Object.fromEntries(r.people.map((p: any) => [p.name, p.metrics])),
  });

  for (const process of ALL) {
    test(`${process}: sin rango de fechas`, async () => {
      const internal = internalFor(process);
      expect(internal).toHaveLength(SCENARIO.length);
      const r = await C.buildPeopleBreakdown(
        { process: process as never },
        {
          [process]: async () => internal,
        },
      );
      expect(pick(r)).toEqual({
        closedTotal: 7,
        unassignedCount: 1,
        people: {
          "Colaboradora Alfa": { closedCount: 4, ownCount: 3, sharedCount: 1 },
          "beto@firmaway.us": { closedCount: 3, ownCount: 2, sharedCount: 1 },
        },
      });
      expect(r.period).toEqual({ from: null, to: null, basis: "closed_at" });
      // La persona con más tareas va primero; "Sin asignar" no es una persona.
      expect(r.people.map((p: any) => p.name)).toEqual(["Colaboradora Alfa", "beto@firmaway.us"]);
    });

    test(`${process}: con rango, por fecha de cierre`, async () => {
      const internal = internalFor(process);
      const r = await C.buildPeopleBreakdown(
        {
          process: process as never,
          dateRange: { from: new Date(2026, 0, 10), to: new Date(2026, 0, 20) },
        },
        { [process]: async () => internal },
      );
      // Entran solo las cerradas del 15 al 19; la cerrada el 25 y la creada el
      // 12 pero cerrada el 5 quedan afuera (también en Annual Reports, cuya
      // pantalla filtra por creación).
      expect(pick(r)).toEqual({
        closedTotal: 5,
        unassignedCount: 1,
        people: {
          "Colaboradora Alfa": { closedCount: 3, ownCount: 2, sharedCount: 1 },
          "beto@firmaway.us": { closedCount: 2, ownCount: 1, sharedCount: 1 },
        },
      });
    });
  }

  test("aplica los mismos filtros que la pantalla (Bancaria por banco)", async () => {
    const internal = internalFor("bank_application").map((t: any, i: number) => ({
      ...t,
      bank: i % 2 === 0 ? "mercury" : "relay",
    }));
    const all = await C.buildPeopleBreakdown(
      { process: "bank_application" },
      { bank_application: async () => internal },
    );
    const mercury = await C.buildPeopleBreakdown(
      { process: "bank_application", filters: { bank: "mercury" } },
      { bank_application: async () => internal },
    );
    const listMercury = await C.listBankTasks({ bank: "mercury" }, async () => internal);
    expect(mercury.closedTotal).toBeLessThan(all.closedTotal);
    expect(mercury.closedTotal).toBe(listMercury.filter((t) => t.closed_at).length);
  });
});

// ─── El caché compartido no se contamina ───────────────────
describe("caché compartido entre usuarios", () => {
  test("pedidos seguidos con permisos distintos no se pisan", async () => {
    // Un único array, como el caché en memoria del servidor.
    const cache = PROCESSES()
      .find((x) => x.id === "tax_return")!
      .internal();
    const snapshot = structuredClone(cache);
    const load = { tax_return: async () => cache };
    const canSee = (e: string, p: any) => P.canSeePeople(e, p, P.parsePeoplePermissions(TABLE));

    // 1) gian@ (con permiso) pide el breakdown y la lista.
    const gian1 = await C.peopleBreakdownFor(
      "gian@firmaway.us",
      { process: "tax_return" },
      canSee,
      load,
    );
    const list1 = await C.listTaxReturns({}, load.tax_return);
    // 2) una cuenta sin permiso: 403 en el breakdown, lista recortada.
    await expect(
      C.peopleBreakdownFor("otra@firmaway.us", { process: "tax_return" }, canSee, load),
    ).rejects.toBeInstanceOf(C.ForbiddenPeopleError);
    const list2 = await C.listTaxReturns({}, load.tax_return);
    // 3) gian@ otra vez: igual que la primera.
    const gian2 = await C.peopleBreakdownFor(
      "gian@firmaway.us",
      { process: "tax_return" },
      canSee,
      load,
    );

    expect(gian2).toEqual(gian1);
    expect(gian1.people.length).toBeGreaterThan(0);
    expect(list2).toEqual(list1);
    for (const needle of NEEDLES) expect(JSON.stringify(list2)).not.toContain(needle);
    // El recorte trabajó sobre copias: el caché quedó intacto.
    expect(cache).toEqual(snapshot);
    expect(cache.some((t) => t.assignees.length > 0)).toBe(true);
  });

  test("redactPeople no modifica los objetos que recibe", () => {
    const items = [{ id: "1", assignees: ["Colaboradora Alfa"] }];
    const out = C.redactPeople(items);
    expect(out).toEqual([{ id: "1" }] as never);
    expect(items[0].assignees).toEqual(["Colaboradora Alfa"]);
    expect(out[0]).not.toBe(items[0] as never);
  });
});
