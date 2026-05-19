
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { Ticket, Clock, AlertTriangle, Timer } from "lucide-react"

interface CXTicketsViewProps {
  kpis: {
    totalTickets: number
    abiertos: number
    resueltos: number
    prioridadAlta: number
    prioridadMedia: number
    prioridadBaja: number
    avgResolutionTime: number
    avgResponseTime: number
    resolutionRate: number
  }
}

export function CXTicketsView({ kpis }: CXTicketsViewProps) {
  // Format time from minutes
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  // Priority chart data
  const priorityData = [
    { priority: "Alta", count: kpis.prioridadAlta, fill: "#ef4444" },
    { priority: "Media", count: kpis.prioridadMedia, fill: "#f59e0b" },
    { priority: "Baja", count: kpis.prioridadBaja, fill: "#22c55e" },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tickets Abiertos
            </CardTitle>
            <Ticket className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{kpis.abiertos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {kpis.totalTickets} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo Promedio Resolucion
            </CardTitle>
            <Timer className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatTime(kpis.avgResolutionTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              creacion a cierre
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Primera Respuesta
            </CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatTime(kpis.avgResponseTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio inicial
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prioridad Alta
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{kpis.prioridadAlta}</div>
            <p className="text-xs text-muted-foreground mt-1">
              tickets urgentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Chart and Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Priority Distribution Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Tickets por Prioridad</CardTitle>
            <CardDescription className="text-muted-foreground">
              Distribucion de tickets por nivel de urgencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityData}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="priority"
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
                    formatter={(value: number) => [`${value} tickets`, "Cantidad"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#ef4444]" />
                  <span className="text-sm text-muted-foreground">Alta: {kpis.prioridadAlta}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#f59e0b]" />
                  <span className="text-sm text-muted-foreground">Media: {kpis.prioridadMedia}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#22c55e]" />
                  <span className="text-sm text-muted-foreground">Baja: {kpis.prioridadBaja}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Summary */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Resumen de Resolucion</CardTitle>
            <CardDescription className="text-muted-foreground">
              Metricas de desempeno del equipo de soporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Resolution Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tasa de Resolucion</span>
                  <span className="text-foreground font-medium">{kpis.resolutionRate}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      kpis.resolutionRate >= 80 ? "bg-success" : kpis.resolutionRate >= 60 ? "bg-warning" : "bg-destructive"
                    }`}
                    style={{ width: `${kpis.resolutionRate}%` }}
                  />
                </div>
              </div>

              {/* Open vs Closed */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Abiertos vs Cerrados</span>
                  <span className="text-foreground font-medium">{kpis.abiertos} / {kpis.resueltos}</span>
                </div>
                <div className="flex h-4 overflow-hidden rounded-lg">
                  <div
                    className="bg-chart-1 flex items-center justify-center text-xs font-medium text-primary-foreground"
                    style={{ width: `${(kpis.abiertos / kpis.totalTickets) * 100}%` }}
                  />
                  <div
                    className="bg-success flex items-center justify-center text-xs font-medium text-primary-foreground"
                    style={{ width: `${(kpis.resueltos / kpis.totalTickets) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded bg-chart-1" /> Abiertos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded bg-success" /> Resueltos
                  </span>
                </div>
              </div>

              {/* Quality Indicators */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tiempo de Respuesta</span>
                  <span className={`text-sm font-medium ${kpis.avgResponseTime <= 15 ? "text-success" : kpis.avgResponseTime <= 30 ? "text-warning" : "text-destructive"}`}>
                    {kpis.avgResponseTime <= 15 ? "Excelente" : kpis.avgResponseTime <= 30 ? "Bueno" : "Mejorable"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tiempo de Resolucion</span>
                  <span className={`text-sm font-medium ${kpis.avgResolutionTime <= 180 ? "text-success" : kpis.avgResolutionTime <= 360 ? "text-warning" : "text-destructive"}`}>
                    {kpis.avgResolutionTime <= 180 ? "Excelente" : kpis.avgResolutionTime <= 360 ? "Bueno" : "Mejorable"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
