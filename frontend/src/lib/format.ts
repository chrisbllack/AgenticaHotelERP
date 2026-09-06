/**
 * Currency and number formatting utilities for INFINEON Enterprise Platform.
 * All monetary values use Nigerian Naira (₦) as the primary currency.
 */

export const CURRENCY_SYMBOL = '₦';

/**
 * Format a number as Nigerian Naira currency.
 * Example: formatNaira(25000) → "₦25,000"
 */
export function formatNaira(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-NG')}`;
}

/**
 * Format a number as Naira with decimals.
 * Example: formatNairaDecimal(25000.50) → "₦25,000.50"
 */
export function formatNairaDecimal(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return `${CURRENCY_SYMBOL}0.00`;
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a number as compact currency for dashboards.
 * Example: formatCompact(1500000) → "₦1.5M"
 */
export function formatCompact(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return `${CURRENCY_SYMBOL}0`;
  if (Math.abs(amount) >= 1_000_000_000) return `${CURRENCY_SYMBOL}${(amount / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(amount) >= 1_000_000) return `${CURRENCY_SYMBOL}${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${CURRENCY_SYMBOL}${(amount / 1_000).toFixed(1)}K`;
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-NG')}`;
}

/**
 * Format a number with thousands separators.
 * Example: formatNumber(12345) → "12,345"
 */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('en-NG');
}

/**
 * Format percentage.
 * Example: formatPercent(75.5) → "75.5%"
 */
export function formatPercent(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0%';
  return `${n.toFixed(1)}%`;
}

/**
 * Format the primary currency code (for select dropdowns, etc.)
 */
export const CURRENCY_CODE = 'NGN';

export default {
  CURRENCY_SYMBOL,
  CURRENCY_CODE,
  formatNaira,
  formatNairaDecimal,
  formatCompact,
  formatNumber,
  formatPercent,
};
