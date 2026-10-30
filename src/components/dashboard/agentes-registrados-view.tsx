import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
// DESVIACIÓN CONSCIENTE DEL MANUAL (único ícono de marca: el asterisco): los
// íconos se quedan porque ayudan a leer rápido. Decisión de Lucas, 2026-10-30.
import { Users, Clock, FileCheck, Percent } from "lucide-react";
import { PROCESSES } from "@/lib/clickup-api";
import { axisLine, labelTick, numberTick, tooltipProps } from "@/lib/chart-theme";
import { formatNumber, formatTick } from "@/lib/format";

// Cada etapa ya tiene su nombre en el eje: todas en el color del proceso.
const AGENTES_COLOR = PROCESSES.find((p) => p.id === "agentes_registrados")!.color;

interface AgentesStatusData {
  status: string;
  count: number;
  fill: string;
}

interface AgentesRegistradosViewProps {
  kpis: {
    total: number;
    pendiente: number;
    esperandoInvoice: number;
    completado: number;
    completionRate: number;
  };
  statusChartData: AgentesStatusData[];
}

export function AgentesRegistradosView({ kpis, statusChartData }: AgentesRegistradosViewProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Total Renovaciones
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(kpis.total)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Pendiente
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(kpis.pendiente)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Esperando Invoice
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(kpis.esperandoInvoice)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              % Renovaciones Completadas
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(kpis.completionRate)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Estado de Renovaciones</CardTitle>
          <CardDescription className="text-muted-foreground">
            Distribución de agentes por etapa de renovación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusChartData}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="status" tick={labelTick} axisLine={axisLine} tickLine={axisLine} />
                <YAxis
                  tick={numberTick}
                  tickFormatter={formatTick}
                  axisLine={axisLine}
                  tickLine={axisLine}
                />
                <Tooltip
                  {...tooltipProps}
                  formatter={(value: number) => [`${formatNumber(value)} agentes`, "Cantidad"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={AGENTES_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: AGENTES_COLOR }} />
                <span className="text-sm text-muted-foreground">Pendiente</span>
                <span className="ml-auto font-mono text-sm font-semibold text-foreground">
                  {formatNumber(kpis.pendiente)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: AGENTES_COLOR }} />
                <span className="text-sm text-muted-foreground">Esperando Invoice</span>
                <span className="ml-auto font-mono text-sm font-semibold text-foreground">
                  {formatNumber(kpis.esperandoInvoice)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: AGENTES_COLOR }} />
                <span className="text-sm text-muted-foreground">Completado</span>
                <span className="ml-auto font-mono text-sm font-semibold text-foreground">
                  {formatNumber(kpis.completado)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
