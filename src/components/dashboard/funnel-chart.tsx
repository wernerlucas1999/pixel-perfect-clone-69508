import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";
import { PROCESSES } from "@/lib/clickup-api";
import { axisLine, labelTick, numberTick, tooltipProps, valueLabel } from "@/lib/chart-theme";

// Todas las etapas en el color del proceso: cada barra ya tiene su nombre en
// el eje y su número escrito, así que el color no distingue nada. Un color
// por etapa competía con los colores de los procesos (verde = Tax, etc.).
const LLC_COLOR = PROCESSES.find((p) => p.id === "llc_formation")!.color;

interface FunnelData {
  status: string;
  count: number;
  fill: string;
}

interface FunnelChartProps {
  data: FunnelData[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  // Shorten status names for better display
  const shortNames: Record<string, string> = {
    PENDIENTE: "Pendiente",
    "NO INICIAR": "No Iniciar",
    "ESPERANDO INPUT CLIENTE": "Input Cliente",
    "ESPERANDO APROB": "Esp. Aprob",
    "APROBADA EN ESTADO": "Aprobada",
    "1º ENTREGA DOCS": "1a Entrega",
    FAXEADO: "Faxeado",
    "ESPERANDO EIN": "Esp. EIN",
    "EIN LISTO": "EIN Listo",
  };

  const chartData = data.map((d) => ({
    ...d,
    shortStatus: shortNames[d.status] || d.status,
  }));

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Embudo de Conversion</CardTitle>
        <CardDescription className="text-muted-foreground">
          Tareas por etapa del proceso de Formacion LLC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
              <XAxis type="number" tick={numberTick} axisLine={axisLine} tickLine={axisLine} />
              <YAxis
                dataKey="shortStatus"
                type="category"
                tick={{ ...labelTick, fontSize: 11 }}
                axisLine={axisLine}
                width={90}
                tickLine={false}
              />
              <Tooltip
                {...tooltipProps}
                formatter={(value: number) => [`${value} tareas`, "Cantidad"]}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.shortStatus === label);
                  return item?.status || label;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={LLC_COLOR} />
                ))}
                <LabelList dataKey="count" position="right" {...valueLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
