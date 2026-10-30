import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// DESVIACIÓN CONSCIENTE DEL MANUAL: la marca Firmaway tiene un solo ícono (el
// asterisco), pero en un panel de datos los íconos ayudan a leer rápido.
// Decisión de Lucas (2026-10-30). No "corregirla" sacando los íconos.
import { ListTodo, CheckCircle2, Clock, Timer, Activity } from "lucide-react";

interface KPICardsProps {
  totalTasks: number;
  completedTasks: number;
  cancelledTasks?: number;
  inProgressTasks: number;
  avgLeadTime: number;
  avgEINWait: number;
}

export function KPICards({
  totalTasks,
  completedTasks,
  cancelledTasks = 0,
  inProgressTasks,
  avgLeadTime,
  avgEINWait,
}: KPICardsProps) {
  // warning = alerta de estado (no énfasis): el manual pide énfasis con
  // negrita, nunca con color, así que solo la espera de EIN > 15 días se pinta.
  const kpis = [
    {
      title: "Total Tareas",
      value: totalTasks,
      icon: ListTodo,
      description: "En el proceso",
      warning: false,
    },
    {
      title: "Completadas",
      value: completedTasks,
      icon: CheckCircle2,
      description: "Entrega Completada",
      warning: false,
    },
    {
      title: "En Progreso",
      value: inProgressTasks,
      icon: Activity,
      description: "Tareas activas",
      warning: false,
    },
    {
      title: "Lead Time Promedio",
      value: `${avgLeadTime} dias`,
      icon: Timer,
      description: "Creacion a cierre",
      warning: false,
    },
    {
      title: "Espera EIN Promedio",
      value: `${avgEINWait} dias`,
      icon: Clock,
      description: "Tiempo en espera",
      warning: avgEINWait > 15,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

      {kpis.map((kpi) => (
        <Card
          key={kpi.title}
          className={`border-border bg-card ${kpi.warning ? "ring-1 ring-warning/50" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* Etiqueta: mayúsculas con +2% de tracking, como pide el manual. */}
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon
              className={`h-4 w-4 ${kpi.warning ? "text-warning" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            {/* Número de KPI en Raleway (es donde se ve la marca), nunca en coral. */}
            <div
              className={`text-2xl font-black tracking-titulo-h1 ${kpi.warning ? "text-warning" : "text-foreground"}`}
            >
              {kpi.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
