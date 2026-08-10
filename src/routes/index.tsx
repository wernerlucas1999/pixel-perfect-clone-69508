import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { TaskRecordsCard, type TaskRecord } from "@/components/dashboard/task-records-card";
import { BottleneckAnalysis } from "@/components/dashboard/bottleneck-analysis";
import { BankStatusCards } from "@/components/dashboard/bank-status-cards";
import { AnnualReportsView } from "@/components/dashboard/annual-reports-view";
import { AgentesRegistradosView } from "@/components/dashboard/agentes-registrados-view";
import { CXTicketsView } from "@/components/dashboard/cx-tickets-view";
import { TaxReturnView } from "@/components/dashboard/tax-return-view";

import {
  getFilteredTasks,
  getFilteredBankTasks,
  getFilteredAnnualReports,
  getFilteredAgentesRegistrados,
  getFilteredCXTickets,
  getFilteredTaxReturns,
  getFunnelData,
  getLLCTaskExtremes,
  getBankTaskExtremes,
  calculateCycleTimeKPIs,
  calculateBankKPIs,
  calculateBottleneckAnalysis,
  getBankStatusCounts,
  calculateAnnualReportsKPIs,
  getAnnualReportsPieData,
  calculateAgentesKPIs,
  getAgentesStatusChartData,
  calculateCXTicketsKPIs,
  getCXTicketsByAssignee,
  calculateTaxReturnKPIs,
  getTaxReturnByAssignee,
  type ProcessType,
  type StateType,
  type PackageType,
  type BankType,
  type TipoLLC,
  type Task,
  type BankTask,
  type AnnualReportTask,
  type AgenteRegistradoTask,
  type CXTicket,
  type TaxReturnTask,
} from "@/lib/clickup-api";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

interface DateRange {
  from: Date | null;
  to: Date | null;
}

const defaultLLCKPIs = {
  totalTasks: 0,
  completedTasks: 0,
  cancelledTasks: 0,
  inProgressTasks: 0,
  avgLeadTime: 0,
  avgEINWait: 0,
  delayedTasks: 0,
  avgDemoraCliente: 0,
  avgTiempoInterno: 0,
};
const defaultBankKPIs = {
  totalTasks: 0,
  pendingTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  avgLeadTime: 0,
};
const defaultAnnualReportsKPIs = { total: 0, pendiente: 0, proximoAHacer: 0, completado: 0 };
const defaultAgentesKPIs = {
  total: 0,
  pendiente: 0,
  esperandoInvoice: 0,
  completado: 0,
  completionRate: 0,
};
const defaultCXTicketsKPIs = {
  totalTickets: 0,
  pendientes: 0,
  enProgreso: 0,
  completadas: 0,
  abiertos: 0,
  resueltos: 0,
  respondedTickets: 0,
  avgResponseHours: 0,
  sameDayPercent: 0,
  resolutionRate: 0,
};

const defaultTaxReturnKPIs = {
  totalCompleted: 0,
  inProgressTotal: 0,
  inProgressByStatus: [] as { status: string; count: number }[],
  avgDiasInfoACierre: 0,
  countDiasInfoACierre: 0,
  avgDiasInfoAEnvioFirma: 0,
  countDiasInfoAEnvioFirma: 0,
  avgDiasFirmaACierre: 0,
  countDiasFirmaACierre: 0,
  avgDiasLeadTime: 0,
  countDiasLeadTime: 0,
};

function DashboardPage() {
  const [selectedProcess, setSelectedProcess] = useState<ProcessType>("llc_formation");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [selectedState, setSelectedState] = useState<StateType | "all">("all");
  const [selectedPackage, setSelectedPackage] = useState<PackageType | "all">("all");
  const [selectedBank, setSelectedBank] = useState<BankType | "all">("all");
  const [selectedTipoLLC, setSelectedTipoLLC] = useState<TipoLLC | "all">("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [, setFilteredTasks] = useState<Task[]>([]);
  const [kpis, setKpis] = useState(defaultLLCKPIs);
  const [funnelData, setFunnelData] = useState<{ status: string; count: number; fill: string }[]>(
    [],
  );
  const [llcExtremes, setLlcExtremes] = useState<{ fastest: TaskRecord | null; slowest: TaskRecord | null }>({ fastest: null, slowest: null });
  const [bankExtremes, setBankExtremes] = useState<{ fastest: TaskRecord | null; slowest: TaskRecord | null }>({ fastest: null, slowest: null });

  const [, setFilteredBankTasks] = useState<BankTask[]>([]);
  const [bankKpis, setBankKpis] = useState(defaultBankKPIs);
  const [bottleneckData, setBottleneckData] = useState<{
    comparisonData: any[];
    clientResponsibilityRatio: number;
    avgClientDays: number;
    avgBankDays: number;
    avgDemoraCliente: number;
    avgTiempoInterno: number;
    avgDemoraIRS: number;
    ratioCliente: number;
    ratioBanco: number;
    ratioInterno: number;
    ratioIRS: number;
  }>({
    comparisonData: [],
    clientResponsibilityRatio: 0,
    avgClientDays: 0,
    avgBankDays: 0,
    avgDemoraCliente: 0,
    avgTiempoInterno: 0,
    avgDemoraIRS: 0,
    ratioCliente: 0,
    ratioBanco: 0,
    ratioInterno: 0,
    ratioIRS: 0,
  });
  const [bankStatusCounts, setBankStatusCounts] = useState<any[]>([]);

  const [, setFilteredAnnualReports] = useState<AnnualReportTask[]>([]);
  const [annualReportsKPIs, setAnnualReportsKPIs] = useState(defaultAnnualReportsKPIs);
  const [annualReportsPieData, setAnnualReportsPieData] = useState<
    { name: string; value: number; fill: string }[]
  >([]);

  const [, setFilteredAgentes] = useState<AgenteRegistradoTask[]>([]);
  const [agentesKPIs, setAgentesKPIs] = useState(defaultAgentesKPIs);
  const [agentesStatusChartData, setAgentesStatusChartData] = useState<
    { status: string; count: number; fill: string }[]
  >([]);

  const [, setFilteredCXTickets] = useState<CXTicket[]>([]);
  const [cxTicketsKPIs, setCXTicketsKPIs] = useState(defaultCXTicketsKPIs);
  const [cxByAssignee, setCXByAssignee] = useState<{ assignee: string; count: number }[]>([]);

  const [, setFilteredTaxReturns] = useState<TaxReturnTask[]>([]);
  const [taxReturnKPIs, setTaxReturnKPIs] = useState(defaultTaxReturnKPIs);
  const [taxReturnByAssignee, setTaxReturnByAssignee] = useState<
    { assignee: string; count: number }[]
  >([]);

  const fetchLLCData = useCallback(async () => {
    try {
      const tasks = await getFilteredTasks(
        selectedProcess,
        dateRange,
        selectedState,
        selectedPackage,
      );
      setFilteredTasks(tasks);
      setKpis(calculateCycleTimeKPIs(tasks));
      setFunnelData(getFunnelData(tasks));
      setLlcExtremes(getLLCTaskExtremes(tasks));
    } catch (err) {
      console.error("Error fetching LLC tasks:", err);
      setError("Error al cargar datos de LLC");
    }
  }, [selectedProcess, dateRange, selectedState, selectedPackage]);

  const fetchBankData = useCallback(async () => {
    try {
      const tasks = await getFilteredBankTasks(
        dateRange,
        selectedState,
        selectedPackage,
        selectedBank,
      );
      setFilteredBankTasks(tasks);
      setBankKpis(calculateBankKPIs(tasks));
      setBottleneckData(calculateBottleneckAnalysis(tasks));
      setBankExtremes(getBankTaskExtremes(tasks));
      setBankStatusCounts(getBankStatusCounts(tasks));
    } catch (err) {
      console.error("Error fetching Bank tasks:", err);
      setError("Error al cargar datos bancarios");
    }
  }, [dateRange, selectedState, selectedPackage, selectedBank]);

  const fetchAnnualReportsData = useCallback(async () => {
    try {
      const reports = await getFilteredAnnualReports(selectedState, selectedPackage, dateRange);
      setFilteredAnnualReports(reports);
      setAnnualReportsKPIs(calculateAnnualReportsKPIs(reports));
      setAnnualReportsPieData(getAnnualReportsPieData(reports));
    } catch (err) {
      console.error("Error fetching Annual Reports:", err);
    }
  }, [selectedState, selectedPackage, dateRange]);

  const fetchAgentesData = useCallback(async () => {
    try {
      const agentes = await getFilteredAgentesRegistrados(selectedState, selectedPackage, dateRange);
      setFilteredAgentes(agentes);
      setAgentesKPIs(calculateAgentesKPIs(agentes));
      setAgentesStatusChartData(getAgentesStatusChartData(agentes));
    } catch (err) {
      console.error("Error fetching Agentes:", err);
    }
  }, [selectedState, selectedPackage, dateRange]);

  const fetchCXTicketsData = useCallback(async () => {
    try {
      const tickets = await getFilteredCXTickets(selectedState, selectedPackage, dateRange);
      setFilteredCXTickets(tickets);
      setCXTicketsKPIs(calculateCXTicketsKPIs(tickets));
      setCXByAssignee(getCXTicketsByAssignee(tickets));
    } catch (err) {
      console.error("Error fetching CX Tickets:", err);
    }
  }, [selectedState, selectedPackage, dateRange]);

  const fetchTaxReturnData = useCallback(async () => {
    try {
      const items = await getFilteredTaxReturns(dateRange, selectedTipoLLC);
      setFilteredTaxReturns(items);
      setTaxReturnKPIs(calculateTaxReturnKPIs(items));
      setTaxReturnByAssignee(getTaxReturnByAssignee(items));
    } catch (err) {
      console.error("Error fetching Tax Return:", err);
      // No bloquear el dashboard: dejar KPIs en cero y mostrar aviso.
      setFilteredTaxReturns([]);
      setTaxReturnKPIs(defaultTaxReturnKPIs);
      setTaxReturnByAssignee([]);
      setError(
        "No se pudo cargar Tax Return (verifica que el ID de lista/vista de ClickUp sea correcto y tenga acceso).",
      );
    }
  }, [dateRange, selectedTipoLLC]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        switch (selectedProcess) {
          case "bank_application":
            await fetchBankData();
            break;
          case "annual_reports":
            await fetchAnnualReportsData();
            break;
          case "agentes_registrados":
            await fetchAgentesData();
            break;
          case "ticketera_cx":
            await fetchCXTicketsData();
            break;
          case "tax_return":
            await fetchTaxReturnData();
            break;
          case "llc_formation":
          default:
            await fetchLLCData();
            break;
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [
    selectedProcess,
    fetchLLCData,
    fetchBankData,
    fetchAnnualReportsData,
    fetchAgentesData,
    fetchCXTicketsData,
    fetchTaxReturnData,
  ]);

  const renderProcessView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Spinner className="mx-auto mb-4 h-8 w-8" />
            <p className="text-muted-foreground">Cargando datos desde ClickUp...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-destructive mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    switch (selectedProcess) {
      case "bank_application":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground">Total Aplicaciones</p>
                <p className="text-2xl font-bold text-foreground mt-1">{bankKpis.totalTasks}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-chart-1 mt-1">{bankKpis.pendingTasks}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold text-warning mt-1">{bankKpis.inProgressTasks}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold text-success mt-1">{bankKpis.completedTasks}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground">Lead Time Promedio</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {bankKpis.avgLeadTime} dias
                </p>
              </div>
            </div>
            <BankStatusCards data={bankStatusCounts} />
            <TaskRecordsCard
              fastest={bankExtremes.fastest}
              slowest={bankExtremes.slowest}
              title="Récords de Ciclo — Aplicación Bancaria"
              description="Aplicaciones cerradas con menor y mayor tiempo total de proceso"
            />
            <BottleneckAnalysis
              comparisonData={bottleneckData.comparisonData}
              clientResponsibilityRatio={bottleneckData.clientResponsibilityRatio}
              totalClientDays={bottleneckData.avgClientDays}
              totalBankDays={bottleneckData.avgBankDays}
              avgDemoraCliente={bottleneckData.avgDemoraCliente}
              avgTiempoInterno={bottleneckData.avgTiempoInterno}
              avgDemoraIRS={bottleneckData.avgDemoraIRS}
              ratioCliente={bottleneckData.ratioCliente}
              ratioBanco={bottleneckData.ratioBanco}
              ratioInterno={bottleneckData.ratioInterno}
              ratioIRS={bottleneckData.ratioIRS}
            />
          </>
        );

      case "annual_reports":
        return <AnnualReportsView pieData={annualReportsPieData} kpis={annualReportsKPIs} />;

      case "agentes_registrados":
        return (
          <AgentesRegistradosView kpis={agentesKPIs} statusChartData={agentesStatusChartData} />
        );

      case "ticketera_cx":
        return <CXTicketsView kpis={cxTicketsKPIs} byAssignee={cxByAssignee} />;

      case "tax_return":
        return (
          <TaxReturnView
            kpis={taxReturnKPIs}
            byAssignee={taxReturnByAssignee}
            tipoLLC={selectedTipoLLC}
            onTipoLLCChange={setSelectedTipoLLC}
          />
        );

      case "llc_formation":
      default:
        return (
          <>
            <KPICards
              totalTasks={kpis.totalTasks}
              completedTasks={kpis.completedTasks}
              cancelledTasks={kpis.cancelledTasks}
              inProgressTasks={kpis.inProgressTasks}
              avgLeadTime={kpis.avgLeadTime}
              avgEINWait={kpis.avgEINWait}
              
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-chart-3/40 bg-chart-3/5 p-5">
                <p className="text-sm font-medium text-muted-foreground">Demora del Cliente</p>
                <p className="text-3xl font-bold text-chart-3 mt-2">
                  {kpis.avgDemoraCliente.toFixed(2)} d
                </p>
              </div>
              <div className="rounded-lg border border-chart-1/40 bg-chart-1/5 p-5">
                <p className="text-sm font-medium text-muted-foreground">
                  Demora Interna de Filings
                </p>
                <p className="text-3xl font-bold text-chart-1 mt-2">
                  {kpis.avgTiempoInterno.toFixed(2)} d
                </p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <FunnelChart data={funnelData} />
              <TaskRecordsCard
                fastest={llcExtremes.fastest}
                slowest={llcExtremes.slowest}
                title="Récords de Ciclo — Formación LLC"
                description="Tareas cerradas con menor y mayor tiempo total de proceso"
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background dark">
     
      <Sidebar selectedProcess={selectedProcess} onProcessChange={setSelectedProcess} />
      <div className="lg:pl-64">
        <Header
          selectedProcess={selectedProcess}
          onProcessChange={setSelectedProcess}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          selectedPackage={selectedPackage}
          onPackageChange={setSelectedPackage}
          selectedBank={selectedBank}
          onBankChange={setSelectedBank}
        />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">{renderProcessView()}</div>
        </main>
      </div>
    </div>
  );
}
