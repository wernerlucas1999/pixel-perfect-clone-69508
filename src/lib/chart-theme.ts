// Colores y tipografía de los gráficos (Recharts), en un solo lugar.
//
// Antes cada gráfico escribía "hsl(var(--x))": como las variables nunca
// fueron HSL, el navegador descartaba el color y los textos salían negros
// sobre fondo oscuro (invisibles). Acá van las variables tal cual.
//
// Reglas de la marca: texto de gráficos en crema o en el gris derivado, nunca
// en el color del proceso; cifras en --font-mono (el componente DataTable del
// manual pide "right-aligned mono numerics").

const MONO = "var(--fw-font-mono)";

export const CHART_TEXT = "var(--foreground)";
export const CHART_TEXT_MUTED = "var(--muted-foreground)";
export const CHART_LINE = "var(--border)";
// Mismo color que la tarjeta: los 2 px entre tramos de una barra apilada se
// ven como un corte, para que el color nunca sea la única pista.
export const CHART_GAP = "var(--card)";
// Texto ADENTRO de un tramo de color (proceso o categoría): navy-700 da
// 4,62-5,22:1 sobre los 5 colores de proceso y 4,72:1 o más sobre los tonos
// de categoría. Crema encima no llega a 4,5.
export const TEXT_ON_FILL = "var(--fw-navy-700)";

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
