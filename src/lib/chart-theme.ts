// Colores y tipografía de los gráficos (Recharts), en un solo lugar.
//
// Antes cada gráfico escribía "hsl(var(--x))": como las variables nunca
// fueron HSL, el navegador descartaba el color y los textos salían negros
// sobre fondo oscuro (invisibles). Acá van las variables tal cual.
//
// Reglas de la marca: texto de gráficos en navy o navy-muted, nunca en el
// color del proceso; cifras en --font-mono (el componente DataTable del
// manual pide "right-aligned mono numerics").

import type { DashboardProcess } from "./processes";

const MONO = "var(--fw-font-mono)";

export const CHART_TEXT = "var(--foreground)";
export const CHART_TEXT_MUTED = "var(--muted-foreground)";
export const CHART_LINE = "var(--border)";
// Mismo color que la tarjeta: los 2 px entre tramos de una barra apilada se
// ven como un corte, para que el color nunca sea la única pista.
export const CHART_GAP = "var(--card)";
// Texto ADENTRO de un tramo del color de un proceso. Ningún color sirve para
// los 5: blanco no llega a 4,5:1 sobre coral (3,36) ni teal (3,74), y tinta no
// llega sobre los otros tres. Tinta #111317 sobre LLC 5,53 y Bancaria 4,97;
// blanco sobre Annual Reports 6,04, Agentes 5,70 y Tax 5,02.
const TEXT_ON_PROCESS: Record<DashboardProcess, string> = {
  llc_formation: "var(--fw-ink)",
  bank_application: "var(--fw-ink)",
  annual_reports: "var(--fw-white)",
  agentes_registrados: "var(--fw-white)",
  tax_return: "var(--fw-white)",
};
export const textOnProcess = (process: DashboardProcess) => TEXT_ON_PROCESS[process];

// Eje con números (cantidades, días).
export const numberTick = { fill: CHART_TEXT_MUTED, fontSize: 12, fontFamily: MONO };
// Eje con nombres (etapas, personas).
export const labelTick = { fill: CHART_TEXT_MUTED, fontSize: 12 };
export const axisLine = { stroke: CHART_LINE };

// Número escrito al lado de cada barra o tramo.
export const valueLabel = { fill: CHART_TEXT, fontSize: 12, fontWeight: 600, fontFamily: MONO };

export const tooltipProps = {
  contentStyle: {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 700 },
  itemStyle: { color: "var(--popover-foreground)" },
  cursor: { fill: "var(--muted)", fillOpacity: 0.5 },
};
