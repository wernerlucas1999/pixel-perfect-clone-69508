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
