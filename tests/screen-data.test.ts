// Lista y gráfico por colaborador en un solo pedido (commit G). Correr con: bun test
/* eslint-disable @typescript-eslint/no-explicit-any -- respuestas falsas de ClickUp */
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
});
// Cada test en su propia hora: caché de 5 min vencido y ventanas de minuto limpias.
let hour = 7;
function freshClock() {
  const offset = hour++ * 3600_000;
  Date.now = () => realNow() + offset;
}

const TABLE = JSON.stringify({
  "lucas@firmaway.us": [
    "llc_formation",
    "bank_application",
    "annual_reports",
    "agentes_registrados",
  ],
});
const canSee = (e: string, p: any) => P.canSeePeople(e, p, P.parsePeoplePermissions(TABLE));

// Annual Reports falso: 3 cerradas (Alfa sola, Alfa+Beto, sin asignar) y 1 abierta.
function fakeAnnualReports() {
  let requests = 0;
  const raw = (id: string, closed: boolean, people: any[]) => ({
    id,
    name: `Cliente ${id} LLC`,
    status: closed ? { status: "complete", type: "closed" } : { status: "pendiente", type: "open" },
    date_created: "1767225600000",
    date_closed: closed ? "1767312000000" : null,
    assignees: people,
    custom_fields: [],
  });
  const ALFA = { id: 1, username: "Colaboradora Alfa", email: "alfa@firmaway.us" };
  const BETO = { id: 2, username: "Beto Beta", email: "beto@firmaway.us" };
  const tasks = [
    raw("a", true, [ALFA]),
    raw("b", true, [ALFA, BETO]),
    raw("c", true, []),
    raw("d", false, [BETO]),
  ];
  globalThis.fetch = (async (url: string) => {
    requests++;
    const page = Number(new URL(url).searchParams.get("page"));
    return new Response(JSON.stringify({ tasks: page === 0 ? tasks : [] }), { status: 200 });
  }) as any;
  return () => requests;
}

describe("screenDataFor: lista y gráfico de la misma carga", () => {
  test("con permiso: una sola carga de ClickUp alimenta lista y gráfico", async () => {
    // Misma pantalla en frío, sin y con gráfico: tienen que hacer los mismos pedidos.
    freshClock();
    const soloLista = fakeAnnualReports();
    await C.screenDataFor(
      "lucas@firmaway.us",
      "annual_reports",
      {},
      (i) => C.listAnnualReports(i),
      canSee,
    );
    freshClock();
    const requests = fakeAnnualReports();
    const r = await C.screenDataFor(
      "lucas@firmaway.us",
      "annual_reports",
      { withPeople: true },
      (i) => C.listAnnualReports(i),
      canSee,
    );
    expect(soloLista()).toBeGreaterThan(0);
    expect(requests()).toBe(soloLista()); // el gráfico no suma ni un pedido
    expect(r.tasks).toHaveLength(4);
    expect(r.people).not.toBeNull();
    expect(r.people!.closedTotal).toBe(3);
    expect(r.people!.unassignedCount).toBe(1);
    expect(r.people!.people.map((p) => [p.name, p.metrics])).toEqual([
      ["Colaboradora Alfa", { closedCount: 2, ownCount: 1, sharedCount: 1 }],
      ["Beto Beta", { closedCount: 1, ownCount: 0, sharedCount: 1 }],
    ]);
    // Los nombres viajan solo en `people`, nunca en la lista.
    const tasksJson = JSON.stringify(r.tasks);
    for (const n of ["Colaboradora Alfa", "Beto Beta", "@firmaway.us"])
      expect(tasksJson).not.toContain(n);
  });

  test.each([
    ["sin permiso para ese proceso", "lucas@firmaway.us", "tax_return"],
    ["cuenta sin permisos", "otra@firmaway.us", "annual_reports"],
    ["sin sesión", null, "annual_reports"],
  ])("withPeople %s → 403 sin tocar ClickUp", async (_name, email, process) => {
    freshClock();
    const requests = fakeAnnualReports();
    await expect(
      C.screenDataFor(
        email as any,
        process as any,
        { withPeople: true },
        (i) => C.listAnnualReports(i),
        canSee,
      ),
    ).rejects.toBeInstanceOf(C.ForbiddenPeopleError);
    expect(requests()).toBe(0);
  });

  test("sin withPeople: solo la lista, sin gráfico y sin nombres", async () => {
    freshClock();
    fakeAnnualReports();
    const r = await C.screenDataFor(
      "otra@firmaway.us",
      "annual_reports",
      {},
      (i) => C.listAnnualReports(i),
      canSee,
    );
    expect(r.people).toBeNull();
    expect(r.tasks).toHaveLength(4);
    expect(JSON.stringify(r)).not.toContain("Colaboradora Alfa");
  });
});
