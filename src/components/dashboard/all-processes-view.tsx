import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import { AlertTriangle, Check, Info, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  getCacheAges,
  getFilteredAgentesRegistrados,
  getFilteredAnnualReports,
  getFilteredBankTasks,
  getFilteredTasks,
  getFilteredTaxReturns,
  type PeopleBreakdown,
} from "@/lib/clickup-api";
import type { DashboardProcess } from "@/lib/processes";
import type { DayRange } from "@/lib/periods";
import { CLICKUP_SATURADO, loadErrorMessage } from "@/lib/load-errors";
import { dataAgeLabel } from "@/lib/data-age";
import { combinePeople, loadOrder, processLabel, SATURATED_RETRY_MS } from "@/lib/all-processes";
import { periodText } from "./people-breakdown-card";
import { PeopleTaskList } from "./people-task-list";

// "Todos los procesos": qué cerró cada persona en el período, en todos los
// procesos en los que quien mira tiene permiso de ver datos por persona.
//
// No hay un pedido nuevo "de todo junto": se pide proceso por proceso, de a
// uno, con el mismo pedido de la pantalla de cada proceso (peopleOnly), así
// que cada uno pasa por su permiso (403) y usa el caché de 20 min que
// comparte con esa pantalla. Primero los que ya están en caché. Un proceso
// que todavía no llegó se nombra en cada total ("sin Tax Return todavía"):
// nunca se muestra un total que parezca completo sin serlo.
//
// Sin los filtros de cada pantalla (Estado, Paquete, Banco, Tipo LLC): lo
// dice la pantalla, a la vista.

type Slot =
  | { status: "espera" }
  | { status: "cargando" }
  | { status: "reintento"; retryAt: number }
  | { status: "ok"; breakdown: PeopleBreakdown; fetchedAt: number | null }
  | { status: "error"; message: string };

function fetchPeople(process: DashboardProcess, dateRange: DayRange, refresh: boolean) {
  const common = { dateRange, peopleOnly: true, refresh };
  switch (process) {
    case "llc_formation":
      return getFilteredTasks({
        data: { ...common, processType: "llc_formation", state: "all", pkg: "all" },
      });
    case "bank_application":
      return getFilteredBankTasks({ data: { ...common, state: "all", pkg: "all", bank: "all" } });
    case "annual_reports":
      return getFilteredAnnualReports({ data: { ...common, state: "all", pkg: "all" } });
    case "agentes_registrados":
      return getFilteredAgentesRegistrados({ data: { ...common, state: "all", pkg: "all" } });
    case "tax_return":
      return getFilteredTaxReturns({ data: { ...common, tipoLLC: "all" } });
  }
}

function errorText(error: unknown, name: string) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("Sin permiso"))
    return "Sin permiso para ver datos por persona de este proceso.";
  return loadErrorMessage(error, name);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function AllProcessesView({
  processes,
  dateRange,
}: {
  processes: DashboardProcess[];
  dateRange: DayRange;
}) {
  const [slots, setSlots] = useState<Partial<Record<DashboardProcess, Slot>>>({});
  const [run, setRun] = useState({ n: 0, refresh: false });
  const [loading, setLoading] = useState(false);
  const [upToDate, setUpToDate] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const key = processes.join(",");
  useEffect(() => {
    // Otro período, otra persona, "Actualizar": la carga anterior deja de escribir.
    let cancelled = false;
    const alive = () => !cancelled;
    const list = key.split(",").filter(Boolean) as DashboardProcess[];
    const set = (p: DashboardProcess, slot: Slot) => {
      if (alive()) setSlots((s) => ({ ...s, [p]: slot }));
    };
    setSlots(Object.fromEntries(list.map((p) => [p, { status: "espera" }])));
    setUpToDate(false);
    setLoading(true);
    (async () => {
      const ages = await getCacheAges().catch(() => ({}));
      let allSkipped = run.refresh;
      // De a uno: nunca dos procesos pidiéndole a ClickUp a la vez.
      for (const p of loadOrder(list, ages)) {
        if (!alive()) return;
        const name = processLabel(p).name;
        for (let attempt = 0; ; attempt++) {
          set(p, { status: "cargando" });
          try {
            const r = await fetchPeople(p, dateRange, run.refresh);
            if (!r.people) throw new Error("Respuesta sin datos por persona");
            if (!r.refreshSkipped) allSkipped = false;
            set(p, { status: "ok", breakdown: r.people, fetchedAt: r.fetchedAt });
            break;
          } catch (error) {
            const saturated = String((error as Error)?.message ?? "").includes(CLICKUP_SATURADO);
            if (saturated && attempt === 0) {
              set(p, { status: "reintento", retryAt: Date.now() + SATURATED_RETRY_MS });
              await sleep(SATURATED_RETRY_MS);
              if (!alive()) return;
              continue;
            }
            allSkipped = false;
            set(p, { status: "error", message: errorText(error, name) });
            break;
          }
        }
      }
      if (alive()) {
        setLoading(false);
        setUpToDate(allSkipped);
      }
    })();
    return () => {
      cancelled = true;
    };
    // dateRange llega como objeto nuevo en cada render: se compara por sus días.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dateRange.from, dateRange.to, run]);

  const reload = useCallback((refresh: boolean) => setRun((r) => ({ n: r.n + 1, refresh })), []);

  // En el orden de siempre, no en el de llegada.
  const loaded = useMemo(
    () =>
      processes.flatMap((p) => {
        const s = slots[p];
        return s?.status === "ok" ? [s.breakdown] : [];
      }),
    [processes, slots],
  );
  const missing = processes
    .filter((p) => slots[p]?.status !== "ok")
    .map((p) => processLabel(p).name);
  const chart = useMemo(() => combinePeople(loaded), [loaded]);
  const pending = missing.length > 0 ? ` · sin ${missing.join(", ")} todavía` : "";
  const period = loaded[0]?.period ?? { ...dateRange, basis: "closed_at" as const };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
        {upToDate && (
          <span role="status" className="flex items-center gap-1 text-foreground">
            <Check className="h-4 w-4 text-success" />
            Los datos ya están actualizados: se cargaron hace menos de 30 s.
          </span>
        )}
        <Button size="sm" variant="outline" onClick={() => reload(true)} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {loading ? "Cargando…" : "Actualizar"}
        </Button>
      </div>

      <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        Esta vista no aplica los filtros de cada proceso (Estado, Paquete, Banco, Tipo LLC): cuenta
        todas las tareas cerradas del período. Para comparar con la pantalla de un proceso, poné
        esos filtros en «Todos».
      </p>

      {/* Franja de totales: cada proceso por separado, sin sumar. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {processes.map((p) => {
          const { name, color } = processLabel(p);
          const s = slots[p] ?? { status: "espera" };
          return (
            <div key={p} className="rounded-lg border border-border bg-card p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {name}
              </p>
              {s.status === "ok" ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {s.breakdown.closedTotal}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {s.breakdown.closedTotal === 1 ? "cerrada" : "cerradas"}
                    </span>
                  </p>
                  {s.fetchedAt !== null && (
                    <p className="text-xs text-muted-foreground">
                      Datos de ClickUp de {dataAgeLabel(s.fetchedAt, now)}
                    </p>
                  )}
                </>
              ) : s.status === "error" ? (
                <div className="mt-1 space-y-2">
                  <p className="text-xs text-destructive">{s.message}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reload(false)}
                    disabled={loading}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : (
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {s.status === "cargando" && <Spinner className="h-3.5 w-3.5" />}
                  {s.status === "cargando"
                    ? "Cargando…"
                    : s.status === "reintento"
                      ? `ClickUp está saturado. Reintento automático en ${Math.max(0, Math.ceil((s.retryAt - now) / 1000))} s.`
                      : "En espera"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-foreground">Rendimiento por Colaborador</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Tareas cerradas por persona asignada, en todos tus procesos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm">
            <p className="text-foreground">
              <span className="font-semibold">Período:</span> {periodText(period)}, por{" "}
              <span className="font-semibold">fecha de cierre</span>.
            </p>
            {missing.length > 0 && (
              <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                Faltan procesos: {missing.join(", ")}. Los totales por persona todavía no los
                incluyen.
              </p>
            )}
            <p className="flex items-start gap-2 text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Cada tramo de la barra es la barra de esa persona en la pantalla del proceso. Una
              tarea compartida suma 1 a cada participante. Agrupa por el asignado actual en ClickUp,
              no por quien cerró la tarea.
            </p>
          </div>

          {loaded.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {loading ? "Cargando…" : "No se pudo cargar ningún proceso."}
            </p>
          ) : (
            <>
              {chart.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay tareas cerradas con asignado en el período seleccionado.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {loaded.map((b) => {
                      const { name, color } = processLabel(b.process);
                      return (
                        <span key={b.process} className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{ backgroundColor: color }}
                          />
                          {name}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ height: Math.max(220, chart.length * 60) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chart}
                        layout="vertical"
                        margin={{ top: 10, right: 230, left: 10, bottom: 5 }}
                        barCategoryGap="25%"
                      >
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          axisLine={{ stroke: "hsl(var(--border))" }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={200}
                          interval={0}
                          tick={{ fill: "#e5e7eb", fontSize: 13, fontWeight: 600 }}
                          axisLine={{ stroke: "hsl(var(--border))" }}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number, key: string) => [
                            value,
                            processLabel(key as DashboardProcess).name,
                          ]}
                        />
                        {loaded.map((b, i) => (
                          <Bar
                            key={b.process}
                            dataKey={b.process}
                            stackId="persona"
                            fill={processLabel(b.process).color}
                          >
                            {i === loaded.length - 1 && (
                              <LabelList
                                dataKey="total"
                                position="right"
                                content={(props) => {
                                  // Tramos apilados: el último termina donde termina la
                                  // barra entera (si vale 0, con ancho 0 en ese punto).
                                  const { x, y, width, height, index } = props as {
                                    x: number;
                                    y: number;
                                    width: number;
                                    height: number;
                                    index: number;
                                  };
                                  const row = chart[index];
                                  return (
                                    <text
                                      x={x + width + 10}
                                      y={y + height / 2}
                                      dominantBaseline="central"
                                      fill="#ffffff"
                                      fontSize={13}
                                    >
                                      <tspan fontWeight={700}>{row.total}</tspan>
                                      <tspan fill="hsl(var(--muted-foreground))">{pending}</tspan>
                                    </text>
                                  );
                                }}
                              />
                            )}
                          </Bar>
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
              <PeopleTaskList sections={loaded} missing={missing} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
