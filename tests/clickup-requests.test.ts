// Menos pedidos a ClickUp sin cambiar resultados (commit D1). Correr con: bun test
/* eslint-disable @typescript-eslint/no-explicit-any -- respuestas falsas de ClickUp */
import { afterEach, beforeAll, describe, expect, test } from "bun:test";

process.env.PEOPLE_DATA_PERMISSIONS = "{}";
process.env.CLICKUP_TOKEN = "token-falso-de-test";

type Api = typeof import("../src/lib/clickup-api");
let C: Api;
beforeAll(async () => {
  C = await import("../src/lib/clickup-api");
});
const realFetch = globalThis.fetch;
const realNow = Date.now;
afterEach(() => {
  globalThis.fetch = realFetch;
  Date.now = realNow;
});
// Reloj adelantado: vence pausas por 429 de otros tests y el caché de 5 min.
let offset = 0;
function advance(ms: number) {
  offset += ms;
  Date.now = () => realNow() + offset;
}

// ClickUp falso con `total` tareas en páginas de 100; cuenta las páginas pedidas.
function fakeList(total: () => number) {
  const asked: number[] = [];
  const fetchFn = (async (url: string) => {
    const page = Number(new URL(url).searchParams.get("page"));
    asked.push(page);
    const n = Math.max(0, Math.min(100, total() - page * 100));
    const tasks = Array.from({ length: n }, (_, i) => ({ id: `t${page * 100 + i}` }));
    return new Response(JSON.stringify({ tasks, last_page: n < 100 }), { status: 200 });
  }) as any;
  return { fetchFn, asked };
}
const paginate = (key: string) =>
  C.fetchPagesConcurrently(
    (page) => `https://api.clickup.com/api/v2/list/x/task?page=${page}`,
    (_d, batch) => batch.length < 100,
    "test",
    Infinity,
    undefined,
    key,
  );
const ids = (n: number) => Array.from({ length: n }, (_, i) => `t${i}`);

describe("memoria de páginas por lista", () => {
  test("en frío pide en tandas como siempre; en la recarga, solo las páginas que existen", async () => {
    advance(120_000);
    let total = 250;
    const f = fakeList(() => total);
    globalThis.fetch = f.fetchFn;
    // Frío: tanda de 6 páginas (0-5), como antes.
    expect((await paginate("lista-a")).map((t) => t.id)).toEqual(ids(250));
    expect(f.asked.length).toBe(6);
    // Recarga: exactamente las 3 páginas que hacían falta.
    f.asked.length = 0;
    expect((await paginate("lista-a")).map((t) => t.id)).toEqual(ids(250));
    expect(f.asked.sort()).toEqual([0, 1, 2]);
    // La lista creció y la última planeada vino llena: sigue y no pierde nada.
    total = 320;
    f.asked.length = 0;
    expect((await paginate("lista-a")).map((t) => t.id)).toEqual(ids(320));
    expect(f.asked.slice(0, 3).sort()).toEqual([0, 1, 2]);
    // La lista se achicó: corta en la primera página corta, sin perder nada.
    total = 150;
    f.asked.length = 0;
    expect((await paginate("lista-a")).map((t) => t.id)).toEqual(ids(150));
  });

  test("múltiplo exacto de 100: pide la página vacía que confirma el final", async () => {
    advance(1_000);
    const f = fakeList(() => 200);
    globalThis.fetch = f.fetchFn;
    expect((await paginate("lista-b")).map((t) => t.id)).toEqual(ids(200));
    f.asked.length = 0;
    expect((await paginate("lista-b")).map((t) => t.id)).toEqual(ids(200));
    expect(f.asked.sort()).toEqual([0, 1, 2]);
  });

  test("da exactamente lo mismo que paginar sin memoria", async () => {
    advance(1_000);
    for (const total of [0, 1, 99, 100, 101, 599, 600, 601, 1234]) {
      const f = fakeList(() => total);
      globalThis.fetch = f.fetchFn;
      const sinMemoria = await C.fetchPagesConcurrently(
        (page) => `https://api.clickup.com/api/v2/list/x/task?page=${page}`,
        (_d, batch) => batch.length < 100,
        "test",
      );
      await paginate(`lista-${total}`);
      const conMemoria = await paginate(`lista-${total}`);
      expect(conMemoria.map((t) => t.id)).toEqual(sinMemoria.map((t) => t.id));
      expect(conMemoria).toHaveLength(total);
    }
  });
});

describe("pedido compartido", () => {
  test("dos personas abren LLC a la vez con el caché vacío → una sola carga", async () => {
    advance(10 * 60_000);
    let requests = 0;
    globalThis.fetch = (async (url: string) => {
      requests++;
      await new Promise((r) => setTimeout(r, 30));
      const page = Number(new URL(url).searchParams.get("page"));
      const tasks =
        page === 0
          ? [
              {
                id: "llc1",
                name: "Cliente LLC",
                status: { status: "complete", type: "closed" },
                date_created: "1767225600000",
                date_closed: "1767312000000",
                assignees: [],
                custom_fields: [],
              },
            ]
          : [];
      return new Response(JSON.stringify({ tasks }), { status: 200 });
    }) as any;
    const [a, b] = await Promise.all([C.fetchLLCTasks(), C.fetchLLCTasks()]);
    expect(a).toBe(b);
    expect(a.map((t) => t.id)).toEqual(["llc1"]);
    expect(requests).toBe(6); // una tanda, no dos
  });

  test("si la carga compartida falla, falla para todas y la siguiente vuelve a pedir", async () => {
    let calls = 0;
    const load = C.singleFlight(async () => {
      calls++;
      if (calls === 1) throw new Error("falló");
      return "ok";
    });
    const results = await Promise.allSettled([load(), load()]);
    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected"]);
    expect(calls).toBe(1);
    expect(await load()).toBe("ok");
    expect(calls).toBe(2);
  });
});
