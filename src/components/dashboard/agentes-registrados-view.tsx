
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { Users, Clock, FileCheck, Percent } from "lucide-react"

interface AgentesStatusData {
  status: string
  count: number
  fill: string
}

interface AgentesRegistradosViewProps {
  kpis: {
    total: number
    pendiente: number
    esperandoInvoice: number
    completado: number
    completionRate: number
  }
  statusChartData: AgentesStatusData[]
}

export function AgentesRegistradosView({ kpis, statusChartData }: AgentesRegistradosViewProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Renovaciones
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.total}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendiente
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{kpis.pendiente}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Esperando Invoice
            </CardTitle>
            <FileCheck className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{kpis.esperandoInvoice}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              % Renovaciones Completadas
            </CardTitle>
            <Percent className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{kpis.completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Estado de Renovaciones</CardTitle>
          <CardDescription className="text-muted-foreground">
            Distribucion de agentes por etapa de renovacion
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
                <XAxis
                  dataKey="status"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value} agentes`, "Cantidad"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-[#6366f1]" />
                <span className="text-sm text-muted-foreground">Pendiente</span>
                <span className="ml-auto text-sm font-medium text-foreground">{kpis.pendiente}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-[#f59e0b]" />
                <span className="text-sm text-muted-foreground">Esperando Invoice</span>
                <span className="ml-auto text-sm font-medium text-foreground">{kpis.esperandoInvoice}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-[#22c55e]" />
                <span className="text-sm text-muted-foreground">Completado</span>
                <span className="ml-auto text-sm font-medium text-foreground">{kpis.completado}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
