// Indicador de carga (commit I). Correr con: bun test
import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { LoadingProgress } from "../src/components/dashboard/loading-progress";

const at = (seconds: number) =>
  renderToString(<LoadingProgress startedAt={Date.now() - seconds * 1000} />).replace(
    /<!-- -->/g,
    "",
  );

describe("indicador de carga", () => {
  test("al principio: solo 'Cargando tareas'", () => {
    const html = at(3);
    expect(html).toContain("Cargando tareas desde ClickUp…");
    expect(html).not.toContain("No hace falta recargar");
  });
  test("desde los 8 s: contador y aviso de no recargar", () => {
    const html = at(12);
    expect(html).toContain("Cargando tareas desde ClickUp… 12 s");
    expect(html).toContain("No hace falta recargar la página");
  });
  test("desde los 20 s: avisa que ClickUp está lento y hasta cuándo puede tardar", () => {
    const html = at(25);
    expect(html).toContain(
      "ClickUp está respondiendo lento. Sigue cargando (25 s; puede tardar hasta 45 s).",
    );
  });
});

import { DataFreshness } from "../src/components/dashboard/data-freshness";
import { dataAgeLabel } from "../src/lib/data-age";

describe("antigüedad de los datos", () => {
  test.each([
    [10_000, "hace menos de 1 min"],
    [61_000, "hace 1 min"],
    [14 * 60_000 + 5_000, "hace 14 min"],
  ])("%d ms → %s", (ms, label) => {
    expect(dataAgeLabel(0, ms)).toBe(label);
  });
  test("se ve siempre, con la hora y el botón Actualizar", () => {
    const html = renderToString(
      <DataFreshness fetchedAt={Date.now() - 30_000} refreshing={false} onRefresh={() => {}} />,
    ).replace(/<!-- -->/g, "");
    expect(html).toContain("Datos de ClickUp de hace menos de 1 min");
    expect(html).toContain("Actualizar");
  });
});

describe("aviso cuando Actualizar no vuelve a pedir", () => {
  test("muestra que los datos ya están actualizados", () => {
    const html = renderToString(
      <DataFreshness
        fetchedAt={Date.now() - 10_000}
        refreshing={false}
        upToDate
        onRefresh={() => {}}
      />,
    ).replace(/<!-- -->/g, "");
    expect(html).toContain("Los datos ya están actualizados: se cargaron hace menos de 30 s.");
  });
  test("sin el aviso, no aparece", () => {
    const html = renderToString(
      <DataFreshness fetchedAt={Date.now() - 10_000} refreshing={false} onRefresh={() => {}} />,
    );
    expect(html).not.toContain("ya están actualizados");
  });
});
