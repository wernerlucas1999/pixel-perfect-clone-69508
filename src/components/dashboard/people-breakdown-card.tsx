import type { ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { AlertTriangle, Info, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { PeopleBreakdown } from "@/lib/clickup-api";

// Rendimiento por colaborador, igual en los 5 procesos. Los datos vienen de
// getPeopleBreakdown, que solo responde con permiso para el proceso.

const PALETTE = ["#14b8a6", "#22c55e", "#3b82f6", "#ec4899", "#f97316", "#a855f7", "#eab308"];

function formatDay(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy", { locale: es });
}

function periodText(period: PeopleBreakdown["period"]) {
  if (period.from && period.to) return `del ${formatDay(period.from)} al ${formatDay(period.to)}`;
  if (period.from) return `desde el ${formatDay(period.from)}`;
  if (period.to) return `hasta el ${formatDay(period.to)}`;
  return "sin filtro de fechas (todas las tareas cerradas)";
}

interface PeopleBreakdownCardProps {
  breakdown: PeopleBreakdown | null;
  // Aviso extra cuando el resto de la pantalla filtra por otra fecha.
  periodWarning?: string;
}

export function PeopleBreakdownCard({ breakdown, periodWarning }: PeopleBreakdownCardProps) {
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
        {!breakdown ? (
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
                {breakdown.closedTotal}. Una tarea compartida suma 1 a cada participante, por eso la
                suma de las personas puede superar este total.
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
                    <span className="inline-block h-3 w-3 rounded-sm bg-muted-foreground" />
                    Propias (única persona asignada)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-muted-foreground/40" />
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
                          key === "own" ? "Propias" : "Compartidas",
                        ]}
                      />
                      <Bar dataKey="own" stackId="persona">
                        {data.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Bar>
                      <Bar dataKey="shared" stackId="persona" radius={[0, 6, 6, 0]}>
                        {data.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.4} />
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
                                fill="#ffffff"
                                fontSize={13}
                              >
                                <tspan fontWeight={700}>{d.total}</tspan>
                                <tspan fill="hsl(var(--muted-foreground))">
                                  {` (${d.own} propias · ${d.shared} compartidas)`}
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

            {/* Hueco de datos, no una persona: fuera del gráfico y con otro estilo. */}
            <div className="flex items-center justify-between rounded-md border border-dashed border-muted-foreground/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold italic text-muted-foreground">Sin asignar</p>
                <p className="text-xs text-muted-foreground">
                  Tareas cerradas en el período sin ningún asignado en ClickUp (falta el dato, no es
                  una persona).
                </p>
              </div>
              <p className="text-xl font-bold text-muted-foreground">{breakdown.unassignedCount}</p>
            </div>
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
