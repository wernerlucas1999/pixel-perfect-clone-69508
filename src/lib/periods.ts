// Períodos del dashboard: dónde se dibuja la línea del día.
//
// El navegador manda el período como días de calendario ("2026-03-31") y el
// servidor los corta a la medianoche ARGENTINA, con la zona por nombre (no un
// -3 fijo), igual que la regla de las 18h de Tax Return. Así no depende ni de
// la zona del servidor (Vercel corre en UTC) ni de la de quien mira.
//
// Solo decide dónde empieza y termina cada día. El instante de cierre o
// creación de cada tarea viene de ClickUp y no se toca. Los cálculos de
// duración en días (businessDays, daysBetween, lead times) no usan esto.

export const AR_TZ = "America/Argentina/Buenos_Aires";

export interface DayRange {
  from: string | null; // "YYYY-MM-DD", día de calendario
  to: string | null;
}

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const arParts = new Intl.DateTimeFormat("en-US", {
  timeZone: AR_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Diferencia (ms) entre la hora de pared argentina y UTC en ese instante.
function arOffsetMs(instant: number): number {
  const p = Object.fromEntries(
    arParts.formatToParts(new Date(instant)).map((x) => [x.type, x.value]),
  );
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return wall - Math.floor(instant / 1000) * 1000;
}

// Instante (ms UTC) de la medianoche argentina que abre el día dado.
export function arMidnightMs(day: string): number {
  const m = DAY_RE.exec(day);
  if (!m) throw new Error(`Día inválido: "${day}" (se espera YYYY-MM-DD)`);
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  // Dos pasadas por si el desfase cambia justo ese día (horario de verano).
  let t = naive - arOffsetMs(naive);
  t = naive - arOffsetMs(t);
  return t;
}

function nextDay(day: string): string {
  const m = DAY_RE.exec(day)!;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + 1)).toISOString().slice(0, 10);
}

// Bordes en ms: desde la medianoche argentina del primer día hasta el último
// milisegundo del último día (hora argentina). null = sin borde.
export function periodBoundsMs(range?: DayRange | null): {
  from: number | null;
  to: number | null;
} {
  return {
    from: range?.from ? arMidnightMs(range.from) : null,
    to: range?.to ? arMidnightMs(nextDay(range.to)) - 1 : null,
  };
}

export function inPeriod(
  ms: number | null,
  bounds: { from: number | null; to: number | null },
): boolean {
  if (bounds.from === null && bounds.to === null) return true;
  if (typeof ms !== "number" || !isFinite(ms)) return false;
  if (bounds.from !== null && ms < bounds.from) return false;
  if (bounds.to !== null && ms > bounds.to) return false;
  return true;
}

// En el navegador: el día de calendario que eligió la persona en el selector
// (fecha local del Date), sin convertir de zona.
export function toDayString(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toDayRange(range: { from: Date | null; to: Date | null }): DayRange {
  return { from: toDayString(range.from), to: toDayString(range.to) };
}
