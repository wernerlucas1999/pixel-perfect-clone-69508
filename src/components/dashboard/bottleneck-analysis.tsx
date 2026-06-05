import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Clock } from "lucide-react";

interface ComparisonData {
  name: string;
  clientDays: number;
  bankDays: number;
  fullName: string;
  status: string;
  blockingAlert: "client_blocked" | "bank_delay" | null;
}

interface BottleneckAnalysisProps {
  comparisonData: ComparisonData[];
  clientResponsibilityRatio: number;
  /** Demora promedio por tarea cerrada — días imputables al cliente */
  totalClientDays: number;
  /** Demora promedio por tarea cerrada — días imputables al banco */
  totalBankDays: number;
}

export function BottleneckAnalysis({
  comparisonData,
  clientResponsibilityRatio,
  totalClientDays: avgClientDays,
  totalBankDays: avgBankDays,
}: BottleneckAnalysisProps) {
  const bankResponsibilityRatio = 100 - clientResponsibilityRatio;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row - Only 3 cards now */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ratio Responsabilidad
            </CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {clientResponsibilityRatio}% Cliente
            </div>
            <p className="text-xs text-muted-foreground mt-1">Del tiempo total de espera</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demora Promedio Cliente
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{avgClientDays} dias</div>
            <p className="text-xs text-muted-foreground mt-1">Promedio por tarea cerrada</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demora Promedio Banco
            </CardTitle>
            <Building2 className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{avgBankDays} dias</div>
            <p className="text-xs text-muted-foreground mt-1">Promedio por tarea cerrada</p>
          </CardContent>
        </Card>
      </div>


      {/* Responsibility Ratio Visual */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Distribucion de Responsabilidad</CardTitle>
          <CardDescription className="text-muted-foreground">
            Proporcion del tiempo de espera total atribuible a cada parte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex h-8 overflow-hidden rounded-lg">
              <div
                className="bg-chart-3 flex items-center justify-center text-xs font-medium text-primary-foreground transition-all"
                style={{ width: `${clientResponsibilityRatio}%` }}
              >
                {clientResponsibilityRatio > 10 && `${clientResponsibilityRatio}%`}
              </div>
              <div
                className="bg-chart-1 flex items-center justify-center text-xs font-medium text-primary-foreground transition-all"
                style={{ width: `${bankResponsibilityRatio}%` }}
              >
                {bankResponsibilityRatio > 10 && `${bankResponsibilityRatio}%`}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-chart-3" />
                <span className="text-muted-foreground">
                  Cliente: {avgClientDays} dias prom.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-chart-1" />
                <span className="text-muted-foreground">Banco: {avgBankDays} dias prom.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
