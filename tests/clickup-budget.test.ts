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
  test("dos topes: 45 s para una carga que recibe respuestas, 20 s para esperar cupo", () => {
    expect(C.CLICKUP_LOAD_BUDGET_MS).toBe(45_000);
    expect(C.CLICKUP_RATE_WAIT_BUDGET_MS).toBe(20_000);
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

describe("autolímite: el dashboard se frena antes de chocar con ClickUp", () => {
  // Relojes muy adelantados: cada test en su propio minuto, lejos de los pedidos
  // que contaron otros tests.
  const onePage = (headers: Record<string, string> = {}) =>
    (async () =>
      new Response(JSON.stringify({ tasks: [{ id: "x" }] }), { status: 200, headers })) as any;
  const paginate = () =>
    C.fetchPagesConcurrently(
      (page) => `https://api.clickup.com/api/v2/list/autolimite/task?page=${page}`,
      (_d, batch) => batch.length < 100,
      "test",
      0, // una sola página
    );

  test("ClickUp avisa que no queda cupo: espera al reinicio (2 s) antes de mandar", async () => {
    shiftClock(2 * 3600_000);
    const reset = Math.ceil((Date.now() + 2_000) / 1000);
    globalThis.fetch = onePage({
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(reset),
    });
    await paginate(); // deja anotado: no queda cupo, se reinicia en ~2 s
    let sent = 0;
    globalThis.fetch = (async (...a: any[]) => {
      sent++;
      return onePage()(...a);
    }) as any;
    const t0 = realNow();
    await paginate();
    expect(sent).toBe(1);
    expect(realNow() - t0).toBeGreaterThanOrEqual(900);
  });

  test("el cupo se libera después del tope → corta en el momento sin mandar el pedido", async () => {
    shiftClock(3 * 3600_000);
    const reset = Math.ceil((Date.now() + 60_000) / 1000);
    globalThis.fetch = onePage({
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(reset),
    });
    await paginate();
    let sent = 0;
    globalThis.fetch = (async () => {
      sent++;
      return new Response("{}", { status: 200 });
    }) as any;
    const t0 = realNow();
    const err = await paginate().catch((e) => e);
    expect(err).toBeInstanceOf(C.ClickUpUnavailableError);
    expect(err.reason).toBe("saturado");
    expect(sent).toBe(0);
    expect(realNow() - t0).toBeLessThan(1_000);
  });

  test("no manda más pedidos por minuto que el límite del token (100)", async () => {
    shiftClock(4 * 3600_000);
    let sent = 0;
    globalThis.fetch = (async (...a: any[]) => {
      sent++;
      return onePage()(...a);
    }) as any;
    for (let i = 0; i < 100; i++) await paginate();
    expect(sent).toBe(100);
    expect(C.clickUpRequestsLastMinute()).toBe(100);
    const err = await paginate().catch((e) => e);
    expect(err).toBeInstanceOf(C.ClickUpUnavailableError);
    expect(sent).toBe(100); // el 101 no salió
  });
});

describe("registro de cortes en los logs", () => {
  test("el evento trae pantalla, motivo, horas y pedidos de esa carga, sin datos de personas", async () => {
    shiftClock(5 * 3600_000);
    let sent = 0;
    globalThis.fetch = (async () => {
      sent++;
      return new Response("", {
        status: 429,
        headers: { "retry-after": "60", "x-ratelimit-limit": "100", "x-ratelimit-remaining": "0" },
      });
    }) as any;
    const err = await C.fetchPagesConcurrently(
      (page) => `https://api.clickup.com/api/v2/list/registro/task?page=${page}`,
      (_d, batch) => batch.length < 100,
      "test",
      0,
    ).catch((e) => e);
    expect(err).toBeInstanceOf(C.ClickUpUnavailableError);
    expect(err.requestsInLoad).toBe(sent);

    const ev = C.clickUpCutEvent("Agentes Registrados", err, new Date(Date.UTC(2026, 9, 8, 0, 30)));
    expect(ev).toMatchObject({
      evento: "clickup_corte",
      pantalla: "Agentes Registrados",
      motivo: "saturado",
      hora_utc: "2026-10-08T00:30:00.000Z",
      pedidos_en_esta_carga: 1,
      clickup_limite: 100,
    });
    expect(ev.hora_ar).toBe("07/10/2026, 21:30:00"); // hora argentina
    expect(typeof ev.instancia).toBe("string");
    expect(JSON.stringify(ev)).not.toContain("@firmaway.us");
  });
});

describe("los dos topes son independientes", () => {
  test("una carga lenta que ya lleva 30 s recibiendo respuestas no se corta", async () => {
    shiftClock(6 * 3600_000);
    // Cada respuesta "tarda" 4 s (reloj adelantado), sin ningún 429: 12 páginas.
    let fakeOffset = 0;
    const base = Date.now;
    Date.now = () => base() + fakeOffset;
    globalThis.fetch = (async (url: string) => {
      fakeOffset += 4_000;
      const page = Number(new URL(url).searchParams.get("page"));
      const n = Math.max(0, Math.min(100, 1150 - page * 100));
      return new Response(
        JSON.stringify({ tasks: Array.from({ length: n }, (_, i) => ({ id: `${page}-${i}` })) }),
        { status: 200 },
      );
    }) as any;
    const tasks = await C.fetchPagesConcurrently(
      (page) => `https://api.clickup.com/api/v2/list/lenta/task?page=${page}`,
      (_d, batch) => batch.length < 100,
      "test",
    );
    expect(tasks).toHaveLength(1150);
    expect(fakeOffset).toBeGreaterThan(20_000); // antes se habría cortado a los 20 s
  });

  test("una carga que lleva 30 s recibiendo respuestas todavía puede esperar cupo", () => {
    const t0 = 1_000_000;
    const load = C.newClickUpLoad(t0);
    // Con el tope único de 20 s esto se cortaba; ahora entra (5 s de espera, 35 s de carga).
    expect(C.reserveWait(load, t0 + 35_000, t0 + 30_000)).toBe(true);
  });

  test("esperar cupo: como máximo 20 s en total por carga", () => {
    const t0 = 1_500_000;
    const load = C.newClickUpLoad(t0);
    expect(C.reserveWait(load, t0 + 13_000, t0 + 1_000)).toBe(true); // 12 s
    expect(C.reserveWait(load, t0 + 21_000, t0 + 14_000)).toBe(true); // +7 s = 19 s
    expect(C.reserveWait(load, t0 + 24_000, t0 + 22_000)).toBe(false); // +2 s = 21 s → "saturado"
  });

  test("varias páginas esperando la misma pausa la descuentan una sola vez", () => {
    const t0 = 2_000_000;
    const load = C.newClickUpLoad(t0);
    for (let i = 0; i < 6; i++) expect(C.reserveWait(load, t0 + 15_000, t0)).toBe(true);
    expect(load.waitLeft).toBe(5_000);
  });

  test("ninguna espera puede pasarse del tope total de 45 s", () => {
    const t0 = 3_000_000;
    const load = C.newClickUpLoad(t0);
    expect(C.reserveWait(load, t0 + 46_000, t0 + 40_000)).toBe(false);
  });
});
