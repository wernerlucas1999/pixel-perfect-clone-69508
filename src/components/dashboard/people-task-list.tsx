import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEAD_TIME_DEFINITIONS, PROCESSES, type PeopleBreakdown } from "@/lib/clickup-api";
import { AR_TZ } from "@/lib/periods";

// Tareas de cada persona, desplegables. Cada sección es el desglose de UN
// proceso (una sola en la pantalla de un proceso, varias en "Todos los
// procesos"). Las filas son exactamente las que cuenta la barra: vienen del
// servidor en la misma respuesta, con los índices de cada persona.
//
// Los días de procesos distintos no son comparables (cada uno usa la medida
// de su KPI), así que nunca comparten columna: dentro de una persona hay un
// bloque por proceso, con su propia columna de días y su definición a la vista.

const PAGE = 25;

const AR_DAY = new Intl.DateTimeFormat("es-AR", {
  timeZone: AR_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Fecha de cierre en día argentino, el mismo día que usa el filtro de período.
function closedDay(ms: number | null) {
  return ms === null ? "—" : AR_DAY.format(new Date(ms));
}

function processInfo(process: PeopleBreakdown["process"]) {
  const p = PROCESSES.find((x) => x.id === process);
  return { name: p?.name ?? process, color: p?.color ?? "#888" };
}

export function ProcessBlock({
  breakdown,
  indexes,
  person,
}: {
  breakdown: PeopleBreakdown;
  indexes: number[];
  // null = bloque de "Sin asignar".
  person: string | null;
}) {
  const [shown, setShown] = useState(PAGE);
  const { name, color } = processInfo(breakdown.process);
  const lead = LEAD_TIME_DEFINITIONS[breakdown.process];
  const rows = indexes.slice(0, shown).map((i) => breakdown.tasks[i]);
  const shared = person ? indexes.filter((i) => breakdown.tasks[i].assignees.length > 1).length : 0;

  return (
    <div className="space-y-2 rounded-md border border-border/60 p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className="h-2.5 w-2.5 shrink-0 self-center rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold text-foreground">{name}</span>
        <span className="text-foreground">
          {indexes.length} {indexes.length === 1 ? "tarea" : "tareas"}
        </span>
        {person && (
          <span className="text-xs text-muted-foreground">
            ({indexes.length - shared} propias · {shared} compartidas)
          </span>
        )}
      </div>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {lead
          ? `${lead.label}: ${lead.definition}`
          : "Este proceso no mide tiempo de ciclo: sus tareas van sin días."}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarea</TableHead>
            <TableHead className="whitespace-nowrap">Cierre</TableHead>
            <TableHead className="text-right">{lead ? lead.label : "Días"}</TableHead>
            {person && <TableHead>Asignación</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => {
            const others = t.assignees.filter((a) => a !== person);
            return (
              <TableRow key={t.id}>
                <TableCell className="text-foreground">{t.name}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {closedDay(t.closedAtMs)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground">
                  {t.days ?? "—"}
                </TableCell>
                {person && (
                  <TableCell className="text-muted-foreground">
                    {others.length === 0 ? "Propia" : `Compartida con ${others.join(", ")}`}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {indexes.length > PAGE && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Mostrando {rows.length} de {indexes.length}
          </span>
          {shown < indexes.length && (
            <Button size="sm" variant="outline" onClick={() => setShown((s) => s + PAGE)}>
              Ver {Math.min(PAGE, indexes.length - shown)} más
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function PeopleTaskList({
  sections,
  missing = [],
}: {
  sections: PeopleBreakdown[];
  // Procesos que todavía no llegaron ("Todos los procesos"): los totales los
  // nombran para no parecer completos.
  missing?: string[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Personas de todas las secciones, de mayor a menor total; las empatadas,
  // en el orden en que aparecen (en un solo proceso, el mismo que el gráfico).
  const people = useMemo(() => {
    const totals = new Map<string, number>();
    for (const b of sections) {
      for (const p of b.people) totals.set(p.name, (totals.get(p.name) ?? 0) + p.tasks.length);
    }
    return [...totals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [sections]);
  const unassigned = sections.reduce((s, b) => s + b.unassignedTasks.length, 0);
  const pending = missing.length > 0 ? ` · sin ${missing.join(", ")} todavía` : "";

  const toggle = (key: string) => setExpanded((e) => (e === key ? null : key));
  const header = (key: string, label: string, total: number, italic = false) => (
    <button
      type="button"
      onClick={() => toggle(key)}
      aria-expanded={expanded === key}
      className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/30"
    >
      {expanded === key ? (
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span
        className={
          italic ? "font-semibold italic text-muted-foreground" : "font-semibold text-foreground"
        }
      >
        {label}
      </span>
      <span className="ml-auto text-right text-sm">
        <span className="font-bold text-foreground">{total}</span>{" "}
        <span className="text-muted-foreground">
          {total === 1 ? "tarea" : "tareas"}
          {pending}
        </span>
      </span>
    </button>
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Desplegá una persona para ver sus tareas cerradas en el período.
      </p>
      <div className="divide-y divide-border rounded-md border border-border">
        {people.map(({ name, total }) => (
          <div key={name}>
            {header(`p:${name}`, name, total)}
            {expanded === `p:${name}` && (
              <div className="space-y-3 px-4 pb-4">
                {sections.map((b) => {
                  const indexes = b.people.find((p) => p.name === name)?.tasks ?? [];
                  return indexes.length === 0 ? null : (
                    <ProcessBlock key={b.process} breakdown={b} indexes={indexes} person={name} />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hueco de datos, no una persona: aparte y con otro estilo. */}
      <div className="rounded-md border border-dashed border-muted-foreground/50">
        {header("sin-asignar", "Sin asignar", unassigned, true)}
        <p className="px-4 pb-3 text-xs text-muted-foreground">
          Tareas cerradas en el período sin ningún asignado en ClickUp (falta el dato, no es una
          persona).
        </p>
        {expanded === "sin-asignar" && (
          <div className="space-y-3 px-4 pb-4">
            {sections.map((b) =>
              b.unassignedTasks.length === 0 ? null : (
                <ProcessBlock
                  key={b.process}
                  breakdown={b}
                  indexes={b.unassignedTasks}
                  person={null}
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
