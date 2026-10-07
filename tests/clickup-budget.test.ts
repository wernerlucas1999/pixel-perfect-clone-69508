// Tope de espera ante ClickUp saturado (commit B). Correr con: bun test
/* eslint-disable @typescript-eslint/no-explicit-any -- respuestas falsas de ClickUp */
import { afterEach, beforeAll, describe, expect, test } from "bun:test";

process.env.PEOPLE_DATA_PERMISSIONS = "{}";
process.env.CLICKUP_TOKEN = "token-falso-de-test";

type Api = typeof import("../src/lib/clickup-api");
type Errors = typeof import("../src/lib/load-errors");
let C: Api;
let E: Errors;
beforeAll(async () => {
  C = await import("../src/lib/clickup-api");
  E = await import("../src/lib/load-errors");
});

const realFetch = globalThis.fetch;
const realNow = Date.now;
afterEach(() => {
  globalThis.fetch = realFetch;
  Date.now = realNow;
});
// Adelanta el reloj (para que venza la pausa por 429 que dejó un test anterior).
function shiftClock(ms: number) {
  const base = Date.now;
  Date.now = () => base() + ms;
}

const page0 = (url: string, tasks: any[]) =>
  new Response(
    JSON.stringify({
      tasks: new URL(url).searchParams.get("page") === "0" ? tasks : [],
      last_page: true,
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
const rawTask = (id: string) => ({
  id,
  name: `Cliente ${id} LLC`,
  status: { status: "complete", type: "closed" },
  date_created: "1767225600000",
  date_closed: "1767312000000",
  assignees: [],
  custom_fields: [],
});

describe("tope de espera por saturación de ClickUp", () => {
  test("el tope es de 40 s, bien por debajo de los 60 s de Vercel", () => {
    expect(C.CLICKUP_LOAD_BUDGET_MS).toBe(40_000);
  });

  test("429 que pide esperar 60 s → corta en el momento con 'saturado'", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return new Response("", { status: 429, headers: { "retry-after": "60" } });
    }) as any;
    const t0 = realNow();
    const err = await C.fetchAnnualReportsTasks().catch((e) => e);
    expect(err).toBeInstanceOf(C.ClickUpUnavailableError);
    expect(err.reason).toBe("saturado");
    expect(realNow() - t0).toBeLessThan(3_000); // no se cuelga un minuto
    expect(calls).toBeLessThanOrEqual(6); // una tanda de páginas, sin reintentos
  });

  test("después del corte no quedó nada en caché: la próxima carga trae datos completos", async () => {
    shiftClock(61_000); // vence la pausa que pidió ClickUp
    globalThis.fetch = (async (url: string) => page0(url, [rawTask("a"), rawTask("b")])) as any;
    const tasks = await C.fetchAnnualReportsTasks();
    expect(tasks.map((t) => t.id)).toEqual(["a", "b"]);
  });

  test("429 con espera corta que entra en el tope → reintenta y la carga termina bien", async () => {
    shiftClock(61_000);
    let first = true;
    globalThis.fetch = (async (url: string) => {
      if (first) {
        first = false;
        return new Response("", { status: 429, headers: { "retry-after": "1" } });
      }
      return page0(url, [rawTask("x")]);
    }) as any;
    const t0 = realNow();
    const tasks = await C.fetchRegisteredAgentsTasks();
    expect(tasks.map((t) => t.id)).toEqual(["x"]);
    expect(realNow() - t0).toBeGreaterThanOrEqual(900);
  });

  test("falla de red → 'sin respuesta', sin datos", async () => {
    shiftClock(61_000);
    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as any;
    const err = await C.fetchTaxReturnTasks().catch((e) => e);
    expect(err).toBeInstanceOf(C.ClickUpUnavailableError);
    expect(err.reason).toBe("sin_respuesta");
  });
});

describe("mensaje en pantalla", () => {
  test.each([
    [
      new Error("CLICKUP_SATURADO"),
      "ClickUp está saturado en este momento y no respondió a tiempo. Reintentá en un minuto.",
    ],
    [new Error("CLICKUP_NO_RESPONDE"), "ClickUp no responde. Reintentá en un minuto."],
    [
      new Error("otra cosa"),
      "No se pudieron cargar los datos de Annual Reports. Reintentá en un momento.",
    ],
  ])("%s", (err, expected) => {
    expect(E.loadErrorMessage(err, "Annual Reports")).toBe(expected);
  });
});
