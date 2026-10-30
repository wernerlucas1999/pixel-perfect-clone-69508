// Formato de números en español. Correr con: bun test
import { describe, expect, test } from "bun:test";
import { formatNumber } from "../src/lib/format";

// Deshace el formato: si vuelve al texto de antes, los dígitos son los mismos.
const undo = (s: string) => s.replace(/\./g, "").replace(",", ".");

describe("formatNumber", () => {
  test("decimal con coma y miles con punto", () => {
    expect(formatNumber(23.4)).toBe("23,4");
    expect(formatNumber(6.81, 2)).toBe("6,81");
    expect(formatNumber(11.37, 2)).toBe("11,37");
    expect(formatNumber(1284)).toBe("1.284");
    expect(formatNumber(1234567.891, 2)).toBe("1.234.567,89");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(-1500.5)).toBe("-1.500,5");
    expect(formatNumber(4, 2)).toBe("4,00");
  });

  test("no redondea distinto que toFixed: mismos dígitos que antes", () => {
    // 1.005 en binario es 1.00499…: toFixed da "1.00", Intl daría "1,01".
    expect(formatNumber(1.005, 2)).toBe("1,00");
    const values = [0, 0.1, 0.125, 1.005, 2.675, 6.81, 11.37, 23.4, 99.995, 1284, 15000.25];
    for (let i = 0; i < 2000; i++) values.push(Math.random() * 20000 - 1000);
    for (const v of values) {
      expect(undo(formatNumber(v))).toBe(String(v));
      expect(undo(formatNumber(v, 2))).toBe(v.toFixed(2));
      expect(undo(formatNumber(v, 1))).toBe(v.toFixed(1));
    }
  });

  test("lo que no es un número común queda tal cual", () => {
    expect(formatNumber(NaN)).toBe("NaN");
    expect(formatNumber(Infinity)).toBe("Infinity");
    expect(formatNumber(1e21)).toBe("1e+21");
  });
});
