/**
 * Format numbers with thousand separators
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format number without decimals (for integers)
 */
export function formatInteger(num: number): string {
  return Math.floor(num).toLocaleString('en-US');
}
