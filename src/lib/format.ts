// Números en español rioplatense: miles con punto y decimales con coma
// (1.284 · 23,4), como define el manual de Firmaway.
//
// Es SOLO presentación: parte del mismo texto que la pantalla mostraba antes
// (String(n), o n.toFixed(d) si se piden decimales fijos) y cambia los
// separadores. No usa Intl a propósito: Intl redondea por su cuenta y podría
// escribir otro dígito que toFixed (1.005 → "1,01" contra "1.00").
export function formatNumber(value: number, fractionDigits?: number): string {
  const text = fractionDigits === undefined ? String(value) : value.toFixed(fractionDigits);
  // NaN, Infinity o notación exponencial: tal cual, sin inventar nada.
  if (!/^-?\d+(\.\d+)?$/.test(text)) return text;
  const [int, dec] = text.split(".");
  const sign = int.startsWith("-") ? "-" : "";
  const digits = sign ? int.slice(1) : int;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return sign + grouped + (dec === undefined ? "" : `,${dec}`);
}

// Para tickFormatter de Recharts, que pasa (valor, índice): el índice no es
// una cantidad de decimales.
export const formatTick = (value: number) => formatNumber(value);
