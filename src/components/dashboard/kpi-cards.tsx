
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ListTodo, CheckCircle2, Clock, AlertTriangle, Timer, Activity } from "lucide-react"

interface KPICardsProps {
  totalTasks: number
  completedTasks: number
  cancelledTasks?: number
  inProgressTasks: number
  avgLeadTime: number
  avgEINWait: number
  delayedTasks: number
}

export function KPICards({
  totalTasks,
  completedTasks,
  cancelledTasks = 0,
  inProgressTasks,
  avgLeadTime,
  avgEINWait,
  delayedTasks,
}: KPICardsProps) {
  const kpis = [
    {
      title: "Total Tareas",
      value: totalTasks,
      icon: ListTodo,
      description: "En el proceso",
      accent: false,
    },
    {
      title: "Completadas",
      value: completedTasks,
      icon: CheckCircle2,
      description: "Entrega Completada",
      accent: false,
    },
    {
      title: "En Progreso",
      value: inProgressTasks,
      icon: Activity,
      description: "Tareas activas",
      accent: false,
    },
    {
      title: "Lead Time Promedio",
      value: `${avgLeadTime} dias`,
      icon: Timer,
      description: "Creacion a cierre",
      accent: true,
    },
    {
      title: "Espera EIN Promedio",
      value: `${avgEINWait} dias`,
      icon: Clock,
      description: "Tiempo en espera",
      accent: avgEINWait > 15,
    },
    {
      title: "Tareas Demoradas",
      value: delayedTasks,
      icon: AlertTriangle,
      description: "> 5 dias en estado",
      accent: delayedTasks > 0,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card
          key={kpi.title}
          className={`border-border bg-card ${kpi.accent ? "ring-1 ring-warning/50" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon
              className={`h-4 w-4 ${kpi.accent ? "text-warning" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${kpi.accent ? "text-warning" : "text-foreground"}`}
            >
              {kpi.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
