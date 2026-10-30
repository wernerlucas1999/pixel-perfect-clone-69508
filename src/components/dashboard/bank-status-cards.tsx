import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROCESSES, type BankStatus } from "@/lib/clickup-api";
import { formatNumber } from "@/lib/format";

// Cada estado ya tiene su nombre escrito: la franja va en el color del proceso
// y el número en crema (énfasis con peso, no con color).
const BANK_COLOR = PROCESSES.find((p) => p.id === "bank_application")!.color;

interface StatusData {
  status: BankStatus;
  count: number;
  color: string;
}

interface BankStatusCardsProps {
  data: StatusData[];
}

// Short display names for status labels
const STATUS_SHORT_NAMES: Record<string, string> = {
  PENDIENTE: "Pendiente",
  "ESPERANDO EIN": "Esperando EIN",
  "ESPERANDO INPUT CLIENTE": "Input Cliente",
  "INFO ADICIONAL BANK": "Info Adicional",
  "VERIF IDENTIDAD": "Verif. Identidad",
  INICIADA: "Iniciada",
};

export function BankStatusCards({ data }: BankStatusCardsProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Distribución por Estado</CardTitle>
        <CardDescription className="text-muted-foreground">
          Conteo de tareas en cada etapa del proceso bancario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.map((item) => (
            <div
              key={item.status}
              className="relative overflow-hidden rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              {/* Color indicator bar */}
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: BANK_COLOR }}
              />

              {/* Count */}
              <div className="text-3xl font-black tracking-titulo-h1 text-foreground">
                {formatNumber(item.count)}
              </div>

              {/* Status name */}
              <div className="mt-1 text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
                {STATUS_SHORT_NAMES[item.status] || item.status}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
