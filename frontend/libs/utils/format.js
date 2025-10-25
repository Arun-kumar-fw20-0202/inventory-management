export function formatCurrency(v) {
  if (v == null) return '-'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v)
}

export function formatNumber(v) {
  if (v == null) return '-'
  return new Intl.NumberFormat().format(v)
}
