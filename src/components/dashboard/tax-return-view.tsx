import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import {
  CheckCircle2,
  ListChecks,
  Users,
  FileText,
  CalendarCheck,
  Send,
  PenLine,
  Hourglass,
} from "lucide-react";
import { TIPOS_LLC, type TipoLLC } from "@/lib/clickup-api";

interface TaxReturnViewProps {
  kpis: {
    totalCompleted: number;
    inProgressTotal: number;
    inProgressByStatus: { status: string; count: number }[];
    avgDiasInfoACierre: number;
    countDiasInfoACierre: number;
    avgDiasInfoAEnvioFirma: number;
    countDiasInfoAEnvioFirma: number;
    avgDiasFirmaACierre: number;
    countDiasFirmaACierre: number;
    avgDiasLeadTime: number;
    countDiasLeadTime: number;
  };
  byAssignee: { assignee: string; count: number }[];
  tipoLLC: TipoLLC | "all";
  onTipoLLCChange: (v: TipoLLC | "all") => void;
}

const PALETTE = ["#14b8a6", "#22c55e", "#3b82f6", "#ec4899", "#f97316", "#a855f7", "#eab308"];

function formatDays(n: number) {
  if (n === null || n === undefined || !isFinite(n) || isNaN(n)) return "—";
  return `${n.toFixed(2)} d`;
}

export function TaxReturnView({
  kpis,
  byAssignee,
  tipoLLC,
  onTipoLLCChange,
}: TaxReturnViewProps) {
  return (
    <div className="space-y-6">
      {/* Filtro TIPO LLC */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tipo LLC:</span>
        </div>
        <Select value={tipoLLC} onValueChange={(v) => onTipoLLCChange(v as TipoLLC | "all")}>
          <SelectTrigger className="w-[200px] bg-input border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {TIPOS_LLC.map((t) => (
              <SelectItem
                key={t.id}
                value={t.id}
                className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
              >
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Taxes Completados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{kpis.totalCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">vista "Analisis Tax Cerrados"</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxes en Proceso
            </CardTitle>
            <ListChecks className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{kpis.inProgressTotal}</div>
            <p className="text-xs text-muted-foreground mt-1">tareas activas (no cerradas)</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards — 4 métricas basadas en fechas reales de ClickUp */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completado desde Info Recibida
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">
              {formatDays(kpis.avgDiasInfoACierre)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {kpis.countDiasInfoACierre} taxes con dato
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demora Interna — Envío a Firmar
            </CardTitle>
            <Send className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">
              {formatDays(kpis.avgDiasInfoAEnvioFirma)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {kpis.countDiasInfoAEnvioFirma} taxes con dato
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demora Interna — Presentación
            </CardTitle>
            <PenLine className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {formatDays(kpis.avgDiasFirmaACierre)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {kpis.countDiasFirmaACierre} taxes con dato
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lead Time desde Compra
            </CardTitle>
            <Hourglass className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2">
              {formatDays(kpis.avgDiasLeadTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {kpis.countDiasLeadTime} taxes con dato
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs internos */}
      <Tabs defaultValue="analisis" className="w-full">
        <TabsList className="bg-muted/40">
          <TabsTrigger value="analisis">Análisis Tax Cerrados</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes en Proceso</TabsTrigger>
        </TabsList>

        <TabsContent value="analisis" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-foreground">
                  Rendimiento por Colaborador
                </CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Cantidad de Taxes completados por persona asignada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {byAssignee.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay taxes completados en el rango seleccionado.
                </p>
              ) : (
                <div style={{ height: Math.max(280, byAssignee.length * 60) }}>
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
                        formatter={(value: number) => [`${value} taxes`, "Completados"]}
                      />
                      <Bar
                        dataKey="count"
                        radius={[0, 6, 6, 0]}
                        label={{
                          position: "insideRight",
                          fill: "#ffffff",
                          fontSize: 14,
                          fontWeight: 700,
                          offset: 12,
                          formatter: (v: number) => `${v} taxes`,
                        }}
                      >
                        {byAssignee.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendientes" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Distribución por Estado</CardTitle>
              <CardDescription className="text-muted-foreground">
                Taxes activos agrupados por su estado actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kpis.inProgressByStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay taxes pendientes en el rango seleccionado.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {kpis.inProgressByStatus.map((s, i) => (
                    <div
                      key={s.status}
                      className="rounded-lg border border-border bg-muted/20 p-4"
                      style={{ borderLeftWidth: 4, borderLeftColor: PALETTE[i % PALETTE.length] }}
                    >
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {s.status}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">{s.count}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
