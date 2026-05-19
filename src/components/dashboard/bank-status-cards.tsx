import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type BankStatus, BANK_STATUS_COLORS } from "@/lib/clickup-api";

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
        <CardTitle className="text-foreground">Distribucion por Estado</CardTitle>
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
                style={{ backgroundColor: item.color }}
              />

              {/* Count */}
              <div className="text-3xl font-bold" style={{ color: item.color }}>
                {item.count}
              </div>

              {/* Status name */}
              <div className="text-xs text-muted-foreground mt-1 font-medium">
                {STATUS_SHORT_NAMES[item.status] || item.status}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
