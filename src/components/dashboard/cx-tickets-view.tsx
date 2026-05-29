import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Ticket, Clock, CheckCircle2, Activity, Timer, Users } from "lucide-react";

interface CXTicketsViewProps {
  kpis: {
    totalTickets: number;
    pendientes: number;
    enProgreso: number;
    completadas: number;
    abiertos: number;
    resueltos: number;
    respondedTickets: number;
    avgResponseHours: number;
    sameDayPercent: number;
    resolutionRate: number;
  };
  byAssignee: { assignee: string; count: number }[];
}

export function CXTicketsView({ kpis, byAssignee }: CXTicketsViewProps) {
  const formatResponse = (hours: number) => {
    if (!isFinite(hours) || hours <= 0) return "—";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} h`;
    return `${(hours / 24).toFixed(1)} d`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards: Volumen por estado */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <Ticket className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{kpis.pendientes}</div>
            <p className="text-xs text-muted-foreground mt-1">estado "pendiente"</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{kpis.enProgreso}</div>
            <p className="text-xs text-muted-foreground mt-1">filings / cx / accounting</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{kpis.completadas}</div>
            <p className="text-xs text-muted-foreground mt-1">solucionado / cerrado</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo Prom. Respuesta
            </CardTitle>
            <Timer className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {formatResponse(kpis.avgResponseHours)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.respondedTickets} con respuesta
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card ring-1 ring-success/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              % Respondidos el Mismo Día
            </CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{kpis.sameDayPercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {kpis.respondedTickets} respondidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets resueltos por colaborador */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-foreground">
              Cantidad de tickets resueltos por colaborador
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Tickets con estado "solucionado" o "cerrado" por miembro del equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byAssignee.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay tickets resueltos asignados.
            </p>
          ) : (
            <div style={{ height: Math.max(280, byAssignee.length * 70) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byAssignee}
                  layout="vertical"
                  margin={{ top: 10, right: 80, left: 10, bottom: 5 }}
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
                    dataKey="assignee"
                    width={180}
                    interval={0}
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 13, fontWeight: 600 }}
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
                    formatter={(value: number) => [`${value} tickets`, "Resueltos"]}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 6, 6, 0]}
                    label={{
                      position: "right",
                      fill: "hsl(var(--foreground))",
                      fontSize: 13,
                      fontWeight: 600,
                      formatter: (v: number) => `${v} tickets`,
                    }}
                  >
                    {byAssignee.map((entry, i) => {
                      const palette: Record<string, string> = {
                        "Tomas Susevich": "#22c55e",
                        "Camila Aguirre": "#ec4899",
                        "Lucas Werner": "#3b82f6",
                      };
                      return <Cell key={i} fill={palette[entry.assignee] ?? "#a855f7"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
