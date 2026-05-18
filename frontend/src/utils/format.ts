/** BRL currency formatting / parsing helpers. */

export function formatBRL(value: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "R$ 0,00";
  const sign = value < 0 ? "-" : "";
  const v = Math.abs(value);
  const formatted = v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}R$ ${formatted}`;
}

export function formatBRLCompact(value: number): string {
  const sign = value < 0 ? "-" : "";
  const v = Math.abs(Math.round(value));
  return `${sign}R$ ${v.toLocaleString("pt-BR")}`;
}

/** Parses pt-BR currency input ("1.234,56" or "1234.56") into a number. */
export function parseBRL(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
