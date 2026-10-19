// Lista desplegable de tareas por persona (Etapa 4). Correr con: bun test
/* eslint-disable @typescript-eslint/no-explicit-any -- tareas de ejemplo */
import { beforeAll, describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";

process.env.PEOPLE_DATA_PERMISSIONS = "{}";

type Api = typeof import("../src/lib/clickup-api");
type List = typeof import("../src/components/dashboard/people-task-list");
let C: Api;
let L: List;
beforeAll(async () => {
  C = await import("../src/lib/clickup-api");
  L = await import("../src/components/dashboard/people-task-list");
});

const html = (el: any) => renderToString(el).replace(/<!-- -->/g, "");
const bodyRows = (s: string) => (s.split("<tbody")[1] ?? "").split("<tr").length - 1;

// 99 tareas cerradas de Tomás (cada 10.ª compartida con Camila) y 3 sin asignar.
function raw(n: number) {
  const day = (d: number) => String(Date.UTC(2026, 2, 1 + (d % 28), 15));
  const tasks = Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    name: `Cliente ${i} LLC`,
    status: { status: "complete", type: "closed" },
    date_created: day(i),
    date_closed: day(i + 3),
    assignees:
      i % 10 === 0 ? [{ username: "Tomás" }, { username: "Camila" }] : [{ username: "Tomás" }],
    custom_fields: [],
  }));
  for (let i = 0; i < 3; i++) {
    tasks.push({ ...tasks[0], id: `s${i}`, name: `Sin dueño ${i}`, assignees: [] });
  }
  return tasks;
}

async function breakdown(process: "llc_formation" | "annual_reports") {
  const map = process === "llc_formation" ? C.mapToTask : C.mapAnnualReportTask;
  const internal = raw(99)
    .map(map as any)
    .filter(Boolean);
  return C.buildPeopleBreakdown({ process }, { [process]: async () => internal } as any);
}

describe("lista desplegable de tareas por persona", () => {
  test("cada persona muestra el total de su barra, cerrada", async () => {
    const b = await breakdown("llc_formation");
    const tomas = b.people.find((p) => p.name === "Tomás")!;
    expect(tomas.metrics.closedCount).toBe(99);
    const s = html(<L.PeopleTaskList sections={[b]} />);
    expect(s).toContain("Tomás");
    expect(s).toContain(">99</span> <span");
    expect(s).toContain("Sin asignar");
    expect(s).toContain(">3</span>");
    expect(s).not.toContain("<tbody"); // nada desplegado
  });

  test("al desplegar: 25 filas, y el encabezado con el total", async () => {
    const b = await breakdown("llc_formation");
    const tomas = b.people.find((p) => p.name === "Tomás")!;
    const s = html(<L.ProcessBlock breakdown={b} indexes={tomas.tasks} person="Tomás" />);
    expect(s).toContain("99 tareas");
    expect(s).toContain("(89 propias · 10 compartidas)");
    expect(bodyRows(s)).toBe(25);
    expect(s).toContain("Mostrando 25 de 99");
    expect(s).toContain("Ver 25 más");
    expect(s).toContain("Compartida con Camila");
    // Los días con el nombre y la definición de la medida de LLC.
    expect(s).toContain("Lead Time (días hábiles)");
    expect(s).toContain("Lead Time Promedio");
  });

  test("procesos sin medida de tiempo: sin días y dicho a la vista", async () => {
    const b = await breakdown("annual_reports");
    const tomas = b.people.find((p) => p.name === "Tomás")!;
    const s = html(<L.ProcessBlock breakdown={b} indexes={tomas.tasks} person="Tomás" />);
    expect(s).toContain("Este proceso no mide tiempo de ciclo");
    expect(s).toContain(">—</td>");
  });

  test("demora interna: faltantes en el encabezado, la peor primero, «falta fecha» al final", async () => {
    const b = await breakdown("llc_formation");
    const tomas = b.people.find((p) => p.name === "Tomás")!;
    // Tres con valor (2, 9, 5) entre las 99 sin fechas.
    const tasks = b.tasks.map((t, i) => ({
      ...t,
      internalDays: i === 40 ? 2 : i === 60 ? 9 : i === 80 ? 5 : null,
    }));
    const withInternal = { ...b, tasks };
    const s = html(
      <L.ProcessBlock breakdown={withInternal} indexes={tomas.tasks} person="Tomás" />,
    );
    expect(s).toContain("99 tareas · 96 sin fecha completa");
    expect(s).toContain(">Lead</th>");
    expect(s).toContain(">Interna</th>");
    expect(s).toContain("Ordenar por fecha de cierre");
    const cells = (s.split("<tbody")[1] ?? "")
      .split("<tr")
      .slice(1)
      .map((r) => r.split("<td")[4]);
    expect(cells[0]).toContain(">9</td>");
    expect(cells[1]).toContain(">5</td>");
    expect(cells[2]).toContain(">2</td>");
    expect(cells[3]).toContain("falta fecha");
    expect(cells[3]).not.toContain(">0</td>");
  });

  test("con procesos que faltan, el total lo dice", async () => {
    const b = await breakdown("llc_formation");
    const s = html(<L.PeopleTaskList sections={[b]} missing={["Tax Return"]} />);
    expect(s).toContain("sin Tax Return todavía");
  });
});
