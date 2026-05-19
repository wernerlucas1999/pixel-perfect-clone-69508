"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts"

interface FunnelData {
  status: string
  count: number
  fill: string
}

interface FunnelChartProps {
  data: FunnelData[]
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
  }

  const chartData = data.map((d) => ({
    ...d,
    shortStatus: shortNames[d.status] || d.status,
  }))

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Embudo de Conversion</CardTitle>
        <CardDescription className="text-muted-foreground">
          Tareas por etapa del proceso de Formacion LLC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
              <XAxis type="number" stroke="#525252" fontSize={12} />
              <YAxis
                dataKey="shortStatus"
                type="category"
                stroke="#525252"
                fontSize={11}
                width={90}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value} tareas`, "Cantidad"]}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.shortStatus === label)
                  return item?.status || label
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
