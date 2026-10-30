import { useMemo, type ReactNode } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  LabelList,
} from "recharts";
// DESVIACIÓN CONSCIENTE DEL MANUAL (único ícono de marca: el asterisco): los
// íconos se quedan porque ayudan a leer rápido. Decisión de Lucas, 2026-10-30.
import { AlertTriangle, Info, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PROCESSES, type PeopleBreakdown } from "@/lib/clickup-api";
import {
  CHART_GAP,
  CHART_TEXT,
  CHART_TEXT_MUTED,
  axisLine,
  numberTick,
  tooltipProps,
} from "@/lib/chart-theme";
import { formatNumber, formatTick } from "@/lib/format";
import { PeopleTaskList } from "./people-task-list";

// Rendimiento por colaborador, igual en los 5 procesos. Los datos vienen de
// getPeopleBreakdown, que solo responde con permiso para el proceso.

// Todas las personas en el color del proceso: cada barra ya tiene el nombre al
// lado, así que un color por persona no agregaba información (y competía con
// los colores de los procesos). Propias en el color pleno, compartidas al 40%,
// con 2 px de corte entre tramos y los números escritos: el color nunca es la
// única pista.
function processColor(process: PeopleBreakdown["process"]) {
  return PROCESSES.find((p) => p.id === process)?.color ?? CHART_TEXT_MUTED;
}

// "YYYY-MM-DD" (día de calendario) → "DD/MM/YYYY", sin pasar por Date: un Date
// lo leería como medianoche UTC y en Argentina mostraría el día anterior.
function formatDay(day: string) {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

export function periodText(period: PeopleBreakdown["period"]) {
  if (period.from && period.to) return `del ${formatDay(period.from)} al ${formatDay(period.to)}`;
  if (period.from) return `desde el ${formatDay(period.from)}`;
  if (period.to) return `hasta el ${formatDay(period.to)}`;
  return "sin filtro de fechas (todas las tareas cerradas)";
}

interface PeopleBreakdownCardProps {
  breakdown: PeopleBreakdown | null;
  // Aviso extra cuando el resto de la pantalla filtra por otra fecha.
  periodWarning?: string;
  // Si la carga falló: se muestra el error, nunca datos anteriores.
  error?: string | null;
}

export function PeopleBreakdownCard({ breakdown, periodWarning, error }: PeopleBreakdownCardProps) {
  const sections = useMemo(() => (breakdown ? [breakdown] : []), [breakdown]);
  const color = breakdown ? processColor(breakdown.process) : CHART_TEXT_MUTED;
  const data = (breakdown?.people ?? []).map((p) => ({
    name: p.name,
    own: p.metrics.ownCount,
    shared: p.metrics.sharedCount,
    total: p.metrics.closedCount,
  }));

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-foreground">Rendimiento por Colaborador</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Tareas cerradas por persona asignada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : !breakdown ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <>
            <div className="space-y-1 text-sm">
              <p className="text-foreground">
                <span className="font-semibold">Período:</span> {periodText(breakdown.period)}, por{" "}
                <span className="font-semibold">fecha de cierre</span>.
              </p>
              {periodWarning && (
                <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  {periodWarning}
                </p>
              )}
              <p className="text-foreground">
                <span className="font-semibold">Tareas cerradas en el período:</span>{" "}
                {formatNumber(breakdown.closedTotal)}. Una tarea compartida suma 1 a cada
                participante, por eso la suma de las personas puede superar este total.
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Agrupa por el asignado actual en ClickUp, no por quien cerró la tarea: si se
                reasigna una tarea ya cerrada, el conteo cambia.
              </p>
            </div>

            {data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay tareas cerradas con asignado en el período seleccionado.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    Propias (única persona asignada)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: color, opacity: 0.4 }}
                    />
                    Compartidas (más de una persona asignada)
                  </span>
                </div>
                <div style={{ height: Math.max(220, data.length * 60) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      layout="vertical"
                      margin={{ top: 10, right: 230, left: 10, bottom: 5 }}
                      barCategoryGap="25%"
                    >
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={numberTick}
                        tickFormatter={formatTick}
                        axisLine={axisLine}
                        tickLine={axisLine}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={200}
                        interval={0}
                        tick={{ fill: CHART_TEXT, fontSize: 13, fontWeight: 600 }}
                        axisLine={axisLine}
                        tickLine={false}
                      />
                      <Tooltip
                        {...tooltipProps}
                        formatter={(value: number, key: string) => [
                          formatNumber(value),
                          key === "own" ? "Propias" : "Compartidas",
                        ]}
                      />
                      <Bar dataKey="own" stackId="persona" stroke={CHART_GAP} strokeWidth={2}>
                        {data.map((_, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="shared"
                        stackId="persona"
                        radius={[0, 4, 4, 0]}
                        stroke={CHART_GAP}
                        strokeWidth={2}
                      >
                        {data.map((_, i) => (
                          <Cell key={i} fill={color} fillOpacity={0.4} />
                        ))}
                        <LabelList
                          dataKey="total"
                          position="right"
                          content={(props) => {
                            const { x, y, width, height, index } = props as {
                              x: number;
                              y: number;
                              width: number;
                              height: number;
                              index: number;
                            };
                            const d = data[index];
                            return (
                              <text
                                x={x + width + 10}
                                y={y + height / 2}
                                dominantBaseline="central"
                                fill={CHART_TEXT}
                                fontSize={13}
                              >
                                <tspan fontWeight={700} fontFamily="var(--fw-font-mono)">
                                  {formatNumber(d.total)}
                                </tspan>
                                <tspan fill={CHART_TEXT_MUTED}>
                                  {` (${formatNumber(d.own)} propias · ${formatNumber(d.shared)} compartidas)`}
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Personas desplegables y "Sin asignar" (fuera del gráfico: no es una persona). */}
            <PeopleTaskList sections={sections} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Sub-pestañas "Resumen" / "Rendimiento por Colaborador" para las pantallas de
// Filings. Sin permiso se muestra solo el resumen, igual que hoy.
export function PeopleTabs({
  showPeople,
  summary,
  people,
}: {
  showPeople: boolean;
  summary: ReactNode;
  people: ReactNode;
}) {
  if (!showPeople) return <>{summary}</>;
  return (
    <Tabs defaultValue="resumen" className="w-full">
      <TabsList className="bg-muted/40">
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="personas">Rendimiento por Colaborador</TabsTrigger>
      </TabsList>
      <TabsContent value="resumen" className="mt-4 space-y-6">
        {summary}
      </TabsContent>
      <TabsContent value="personas" className="mt-4">
        {people}
      </TabsContent>
    </Tabs>
  );
}
