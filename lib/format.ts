/**
 * Convert bigint cents to plain number of dollars.
 * Use this before passing budget values as props to client components,
 * since BigInt is not JSON-serialisable.
 */
export function centsToNumber(cents: bigint): number {
  return Number(cents) / 100
}

/**
 * Format a bigint cents value as a human-readable dollar string.
 * Values >= $1B are shown as "$X.XB"; values < $1B as "$X.XM".
 * Negative values are prefixed with a minus sign, e.g. "-$14.6B".
 * e.g. 14600000000000n → "$14.6B", -14600000000000n → "-$14.6B"
 */
export function formatBudgetAmount(cents: bigint): string {
  const dollars = Number(cents) / 100
  const absDollars = Math.abs(dollars)
  const sign = dollars < 0 ? '-' : ''
  if (absDollars >= 1_000_000_000) {
    return `${sign}$${(absDollars / 1_000_000_000).toFixed(1)}B`
  }
  return `${sign}$${(absDollars / 1_000_000).toFixed(1)}M`
}
