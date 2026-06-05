import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TurtleIcon } from "lucide-react";

export interface TaskRecord {
  name: string;
  days: number;
}

interface TaskRecordsCardProps {
  fastest: TaskRecord | null;
  slowest: TaskRecord | null;
  title?: string;
  description?: string;
}

export function TaskRecordsCard({
  fastest,
  slowest,
  title = "Récords de Ciclo de Tarea",
  description = "Tareas con menor y mayor tiempo total de cierre",
}: TaskRecordsCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-success/40 bg-success/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-muted-foreground">Tarea más rápida</span>
            </div>
            {fastest ? (
              <>
                <p className="text-lg font-semibold text-foreground line-clamp-2" title={fastest.name}>
                  {fastest.name}
                </p>
                <p className="text-3xl font-bold text-success mt-2">
                  {fastest.days} {fastest.days === 1 ? "día" : "días"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos en el rango.</p>
            )}
          </div>

          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TurtleIcon className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">Tarea más lenta</span>
            </div>
            {slowest ? (
              <>
                <p className="text-lg font-semibold text-foreground line-clamp-2" title={slowest.name}>
                  {slowest.name}
                </p>
                <p className="text-3xl font-bold text-destructive mt-2">
                  {slowest.days} {slowest.days === 1 ? "día" : "días"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos en el rango.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
