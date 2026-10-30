import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ReactNode } from "react";
// DESVIACIÓN CONSCIENTE DEL MANUAL (único ícono de marca: el asterisco): los
// íconos se quedan porque ayudan a leer rápido. Decisión de Lucas, 2026-10-30.
import {
  CheckCircle2,
  ListChecks,
  FileText,
  CalendarCheck,
  Send,
  PenLine,
  Hourglass,
  Clock,
  Wallet,
} from "lucide-react";
import { PROCESSES, TIPOS_LLC, type TipoLLC } from "@/lib/clickup-api";
import { formatNumber } from "@/lib/format";

interface TaxReturnViewProps {
  kpis: {
    totalCompleted: number;
    inProgressTotal: number;
    inProgressByStatus: { status: string; count: number }[];
    avgDiasInfoACierre: number;
    countDiasInfoACierre: number;
    avgDiasInfoAEnvioFirma: number;
    countDiasInfoAEnvioFirma: number;
    avgDiasFirmaACierre: number;
    countDiasFirmaACierre: number;
    avgDiasLeadTime: number;
    countDiasLeadTime: number;
    avgDemoraCliente: number;
    countDemoraCliente: number;
    avgDemoraInterna: number;
    countDemoraInterna: number;
    ratioCliente: number;
    ratioInterno: number;
  };
  // PeopleBreakdownCard. Sin permiso para ver datos por persona de Tax Return
  // no se muestra la pestaña (el servidor igual no los manda).
  peopleCard: ReactNode;
  showByAssignee: boolean;
  tipoLLC: TipoLLC | "all";
  onTipoLLCChange: (v: TipoLLC | "all") => void;
}

// Cada estado ya tiene su nombre escrito: el borde va en el color del proceso.
const TAX_COLOR = PROCESSES.find((p) => p.id === "tax_return")!.color;

function formatDays(n: number) {
  if (n === null || n === undefined || !isFinite(n) || isNaN(n)) return "—";
  return `${formatNumber(n, 2)} d`;
}

export function TaxReturnView({
  kpis,
  peopleCard,
  showByAssignee,
  tipoLLC,
  onTipoLLCChange,
}: TaxReturnViewProps) {
  return (
    <div className="space-y-6">
      {/* Filtro TIPO LLC */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tipo LLC:</span>
        </div>
        <Select value={tipoLLC} onValueChange={(v) => onTipoLLCChange(v as TipoLLC | "all")}>
          <SelectTrigger className="w-[200px] bg-input border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {TIPOS_LLC.map((t) => (
              <SelectItem
                key={t.id}
                value={t.id}
                className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
              >
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Total Taxes Completados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(kpis.totalCompleted)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">vista "Análisis Tax Cerrados"</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Taxes en Proceso
            </CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-titulo-h1 text-foreground">
              {formatNumber(kpis.inProgressTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">tareas activas (no cerradas)</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards — 4 métricas basadas en fechas reales de ClickUp */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Completado desde Info Recibida
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-titulo-h1 text-foreground">
              {formatDays(kpis.avgDiasInfoACierre)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {formatNumber(kpis.countDiasInfoACierre)} taxes con dato
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Demora Interna — Envío a Firmar
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-titulo-h1 text-foreground">
              {formatDays(kpis.avgDiasInfoAEnvioFirma)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {formatNumber(kpis.countDiasInfoAEnvioFirma)} taxes con dato
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Demora Interna — Presentación
            </CardTitle>
            <PenLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-titulo-h1 text-foreground">
              {formatDays(kpis.avgDiasFirmaACierre)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {formatNumber(kpis.countDiasFirmaACierre)} taxes con dato
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Lead Time desde Compra
            </CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-titulo-h1 text-foreground">
              {formatDays(kpis.avgDiasLeadTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {formatNumber(kpis.countDiasLeadTime)} taxes con dato
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottleneck de 2 categorías — equivalente a BottleneckAnalysis de
          Aplicación Bancaria, sin IRS ni Banco (no aplican a este proceso) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Demora Cliente
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatDays(kpis.avgDemoraCliente)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {formatNumber(kpis.countDemoraCliente)} taxes cerrados con dato
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
              Demora Interna
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-titulo-h1 text-foreground">
              {formatDays(kpis.avgDemoraInterna)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              promedio sobre {formatNumber(kpis.countDemoraInterna)} taxes cerrados; los tramos sin
              fecha cuentan como 0
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Distribución de Responsabilidad</CardTitle>
          <CardDescription className="text-muted-foreground">
            Proporción del tiempo de espera total atribuible a cada parte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex h-8 gap-0.5 overflow-hidden rounded-lg">
              <div
                className="bg-categoria-1 flex items-center justify-center font-mono text-xs font-semibold text-fw-navy-700 transition-all"
                style={{ width: `${kpis.ratioCliente}%` }}
              >
                {kpis.ratioCliente > 10 && `${formatNumber(kpis.ratioCliente)}%`}
              </div>
              <div
                className="bg-categoria-2 flex items-center justify-center font-mono text-xs font-semibold text-fw-navy-700 transition-all"
                style={{ width: `${kpis.ratioInterno}%` }}
              >
                {kpis.ratioInterno > 10 && `${formatNumber(kpis.ratioInterno)}%`}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-categoria-1" />
                <span className="text-muted-foreground">
                  Cliente: {formatNumber(kpis.avgDemoraCliente, 2)} días prom.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-categoria-2" />
                <span className="text-muted-foreground">
                  Interno: {formatNumber(kpis.avgDemoraInterna, 2)} días prom.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs internos */}
      <Tabs
        key={showByAssignee ? "con-personas" : "sin-personas"}
        defaultValue={showByAssignee ? "analisis" : "pendientes"}
        className="w-full"
      >
        <TabsList className="bg-muted/40">
          {showByAssignee && <TabsTrigger value="analisis">Análisis Tax Cerrados</TabsTrigger>}
          <TabsTrigger value="pendientes">Pendientes en Proceso</TabsTrigger>
        </TabsList>

        {showByAssignee && (
          <TabsContent value="analisis" className="mt-4">
            {peopleCard}
          </TabsContent>
        )}

        <TabsContent value="pendientes" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Distribución por Estado</CardTitle>
              <CardDescription className="text-muted-foreground">
                Taxes activos agrupados por su estado actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kpis.inProgressByStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay taxes pendientes en el rango seleccionado.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {kpis.inProgressByStatus.map((s) => (
                    <div
                      key={s.status}
                      className="rounded-lg border border-border bg-muted/20 p-4"
                      style={{ borderLeftWidth: 4, borderLeftColor: TAX_COLOR }}
                    >
                      <p className="text-xs font-bold uppercase tracking-etiqueta text-muted-foreground">
                        {s.status}
                      </p>
                      <p className="text-2xl font-black tracking-titulo-h1 text-foreground mt-1">
                        {formatNumber(s.count)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
