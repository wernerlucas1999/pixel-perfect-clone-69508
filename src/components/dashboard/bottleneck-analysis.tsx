import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// DESVIACIÓN CONSCIENTE DEL MANUAL (único ícono de marca: el asterisco): los
// íconos se quedan porque ayudan a leer rápido. Decisión de Lucas, 2026-10-30.
import { Users, Building2, Clock, Landmark, Wallet } from "lucide-react";
import { formatNumber } from "@/lib/format";

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
  /** Promedio del custom field z_Demora cliente (en días) */
  avgDemoraCliente: number;
  /** Promedio del custom field z_Tiempo interno (en días) */
  avgTiempoInterno: number;
  /** Promedio del custom field z_Demora IRS (en días) */
  avgDemoraIRS: number;
  /** Porcentaje de responsabilidad del cliente sobre la suma de 4 demoras */
  ratioCliente: number;
  /** Porcentaje de responsabilidad del banco sobre la suma de 4 demoras */
  ratioBanco: number;
  /** Porcentaje de responsabilidad interna (Filings) sobre la suma de 4 demoras */
  ratioInterno: number;
  /** Porcentaje de responsabilidad del IRS sobre la suma de 4 demoras */
  ratioIRS: number;
}

export function BottleneckAnalysis({
  comparisonData,
  clientResponsibilityRatio,
  totalClientDays: avgClientDays,
  totalBankDays: avgBankDays,
  avgDemoraCliente,
  avgTiempoInterno,
  avgDemoraIRS,
  ratioCliente,
  ratioBanco,
  ratioInterno,
  ratioIRS,
}: BottleneckAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Demora Promedio Cliente
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(avgDemoraCliente, 2)} d
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Demora Interna de Filings
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(avgTiempoInterno, 2)} d
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Demora del IRS
            </CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(avgDemoraIRS, 2)} d
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Demora Promedio Banco
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(avgBankDays)} días
            </div>
            <p className="text-xs text-muted-foreground mt-1">Promedio por tarea cerrada</p>
          </CardContent>
        </Card>
      </div>

      {/* Responsibility Ratio Visual */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Distribución de Responsabilidad</CardTitle>
          <CardDescription className="text-muted-foreground">
            Proporción del tiempo de espera total atribuible a cada parte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex h-8 gap-0.5 overflow-hidden rounded-lg">
              <div
                className="bg-categoria-1 flex items-center justify-center font-mono text-xs font-semibold text-white transition-all"
                style={{ width: `${ratioCliente}%` }}
              >
                {ratioCliente > 10 && `${formatNumber(ratioCliente)}%`}
              </div>
              <div
                className="bg-categoria-2 flex items-center justify-center font-mono text-xs font-semibold text-white transition-all"
                style={{ width: `${ratioInterno}%` }}
              >
                {ratioInterno > 10 && `${formatNumber(ratioInterno)}%`}
              </div>
              <div
                className="bg-categoria-3 flex items-center justify-center font-mono text-xs font-semibold text-white transition-all"
                style={{ width: `${ratioIRS}%` }}
              >
                {ratioIRS > 10 && `${formatNumber(ratioIRS)}%`}
              </div>
              <div
                className="bg-categoria-4 flex items-center justify-center font-mono text-xs font-semibold text-fw-ink transition-all"
                style={{ width: `${ratioBanco}%` }}
              >
                {ratioBanco > 10 && `${formatNumber(ratioBanco)}%`}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-categoria-1" />
                <span className="text-muted-foreground">
                  Cliente: {formatNumber(avgDemoraCliente, 2)} días prom.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-categoria-2" />
                <span className="text-muted-foreground">
                  Filings: {formatNumber(avgTiempoInterno, 2)} días prom.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-categoria-3" />
                <span className="text-muted-foreground">
                  IRS: {formatNumber(avgDemoraIRS, 2)} días prom.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-categoria-4" />
                <span className="text-muted-foreground">
                  Banco: {formatNumber(avgBankDays, 2)} días prom.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
