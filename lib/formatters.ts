/**
 * Formateadores numéricos y de moneda deterministas para evitar desajustes de hidratación
 * (Hydration mismatch) entre SSR (Node.js en servidor) y el cliente navegador con diferentes locales.
 */

export function formatInt(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatCOP(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '$0';
  const rounded = Math.round(num);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${formatted}`;
}

export function formatDec(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const parts = Number(num).toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
