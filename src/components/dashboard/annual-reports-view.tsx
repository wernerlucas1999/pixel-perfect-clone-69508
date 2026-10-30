import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
// DESVIACIÓN CONSCIENTE DEL MANUAL (único ícono de marca: el asterisco): los
// íconos se quedan porque ayudan a leer rápido. Decisión de Lucas, 2026-10-30.
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { CHART_GAP, CHART_TEXT_MUTED, tooltipProps } from "@/lib/chart-theme";
import { formatNumber } from "@/lib/format";

interface PieData {
  name: string;
  value: number;
  fill: string;
}

interface AnnualReportsViewProps {
  pieData: PieData[];
  kpis: {
    total: number;
    pendiente: number;
    proximoAHacer: number;
    completado: number;
  };
}

export function AnnualReportsView({ pieData, kpis }: AnnualReportsViewProps) {
  // Calculate health check percentage (completados vs proximo a vencer)
  const healthPercentage = kpis.total > 0 ? Math.round((kpis.completado / kpis.total) * 100) : 0;
  const atRiskPercentage = kpis.total > 0 ? Math.round((kpis.proximoAHacer / kpis.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Total de Reportes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
              Próximo a Hacer
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(kpis.proximoAHacer)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Completado
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(kpis.completado)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Check and Pie Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Health Check Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Cumplimiento Anual</CardTitle>
            <CardDescription className="text-muted-foreground">
              Comparativa de reportes completados vs próximos a vencer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Health Score */}
              <div className="text-center">
                <div className="text-5xl font-black tracking-titulo-display text-foreground">
                  {formatNumber(healthPercentage)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">Tasa de Cumplimiento</p>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completados</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatNumber(kpis.completado)} ({formatNumber(healthPercentage)}%)
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all"
                      style={{ width: `${healthPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Próximo a Hacer</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatNumber(kpis.proximoAHacer)} ({formatNumber(atRiskPercentage)}%)
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-warning rounded-full transition-all"
                      style={{ width: `${atRiskPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2">
                  {healthPercentage >= 70 ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-success font-medium">Estado Saludable</span>
                    </>
                  ) : healthPercentage >= 50 ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <span className="text-warning font-medium">Requiere Atención</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="text-destructive font-medium">Estado Crítico</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription className="text-muted-foreground">
              Estado de todos los Annual Reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke={CHART_GAP}
                    strokeWidth={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    {...tooltipProps}
                    formatter={(value: number) => [`${formatNumber(value)} reportes`, "Cantidad"]}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: CHART_TEXT_MUTED }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
