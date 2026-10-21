/** 150000 -> "150.000₫" */
export function vnd(n: number): string {
  const sign = n < 0 ? '−' : '';
  return sign + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫';
}

/** 19 -> "19:00" */
export function hh(hour: number): string {
  return String(hour).padStart(2, '0') + ':00';
}
