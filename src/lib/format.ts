/** 150000 -> "150.000₫" */
export function vnd(n: number): string {
  const sign = n < 0 ? '−' : '';
  return sign + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫';
}

/** Nhãn trục biểu đồ: 12400000 -> "12,4 tr", 450000 -> "450k" */
export function vndShort(n: number): string {
  const f = (x: number) => x.toLocaleString('vi-VN', { maximumFractionDigits: x < 10 ? 1 : 0 });
  if (n >= 1e9) return f(n / 1e9) + ' tỷ';
  if (n >= 1e6) return f(n / 1e6) + ' tr';
  if (n >= 1e3) return f(n / 1e3) + 'k';
  return f(n);
}

/** 19 -> "19:00" */
export function hh(hour: number): string {
  return String(hour).padStart(2, '0') + ':00';
}

/** 19.25 -> "19:15" */
export function hm(t: number): string {
  const min = Math.round(t * 60);
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

export function digits(s: string): string {
  return s.replace(/\D/g, '');
}
