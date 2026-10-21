import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart } from '../../components/BarChart';
import { Icon } from '../../components/Icon';
import { FIXED_DISCOUNT, PRODUCTS, REPORT_START, REPORT_TODAY } from '../../data/reports';
import { vnd, vndShort } from '../../lib/format';
import {
  canShift,
  parseIso,
  periodLabel,
  shift,
  summarize,
  toIso,
  type Granularity,
  type ProductRow,
} from '../../lib/reports';

const GRANS: { id: Granularity; label: string }[] = [
  { id: 'day', label: 'Ngày' },
  { id: 'month', label: 'Tháng' },
  { id: 'year', label: 'Năm' },
];

const C_FIXED = 'var(--series-fixed)';
const C_WALKIN = 'var(--series-walkin)';

type SortKey = 'name' | 'qty' | 'revenue' | 'cost' | 'profit' | 'margin';

const margin = (r: { revenue: number; profit: number }) => (r.revenue ? r.profit / r.revenue : 0);
const pct = (x: number) => (x * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%';

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const g = (GRANS.some((x) => x.id === params.get('g')) ? params.get('g') : 'month') as Granularity;
  const anchor = parseIso(params.get('d')) ?? REPORT_TODAY;
  const anchorIso = toIso(anchor);

  const [productId, setProductId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'profit', dir: -1 });

  const go = (next: { g?: Granularity; d?: string }) => {
    const p = new URLSearchParams(params);
    if (next.g) p.set('g', next.g);
    if (next.d) p.set('d', next.d);
    setParams(p, { replace: true });
  };

  // anchorIso thay cho object anchor để memo không tính lại mỗi lần render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = useMemo(() => summarize(anchor, g, productId), [anchorIso, g, productId]);
  const { booking, products } = s;
  const grandTotal = booking.total + products.revenue;
  const prevGrand = booking.prev !== null && products.prevRevenue !== null ? booking.prev + products.prevRevenue : null;

  const rows = useMemo(() => {
    const val = (r: ProductRow): number | string =>
      sort.key === 'name' ? r.product.name : sort.key === 'margin' ? margin(r) : r[sort.key];
    return [...products.rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (typeof x === 'string' ? x.localeCompare(y as string, 'vi') : x - (y as number)) * sort.dir;
    });
  }, [products.rows, sort]);

  const selected = productId ? PRODUCTS.find((p) => p.id === productId) : null;
  const fixedShare = booking.total ? booking.byType.fixed.revenue / booking.total : 0;

  const exportCsv = () => {
    const head = ['Sản phẩm', 'Nhóm', 'Đơn vị', 'Giá bán', 'Giá vốn', 'Đã bán', 'Doanh thu', 'Tổng giá vốn', 'Lợi nhuận', 'Biên LN (%)'];
    const lines = rows.map((r) =>
      [r.product.name, r.product.group, r.product.unit, r.product.price, r.product.cost, r.qty, r.revenue, r.cost, r.profit, (margin(r) * 100).toFixed(1)].join(';'),
    );
    lines.push(['Tổng', '', '', '', '', '', products.revenue, products.cost, products.profit, (margin(products) * 100).toFixed(1)].join(';'));
    const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loi-nhuan-san-pham_${g === 'day' ? anchorIso : g === 'month' ? anchorIso.slice(0, 7) : anchor.y}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortBtn = (key: SortKey, label: string, right = true) => (
    <th aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} style={right ? { textAlign: 'right' } : undefined}>
      <button
        type="button"
        className="sort-btn"
        onClick={() => setSort((cur) => ({ key, dir: cur.key === key ? ((-cur.dir) as 1 | -1) : key === 'name' ? 1 : -1 }))}
      >
        {label}
        <span aria-hidden="true">{sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );

  return (
    <>
      <header className="page-head">
        <div className="grow">
          <h1 className="page-title">Doanh thu &amp; lợi nhuận</h1>
          <p className="page-sub">Đặt sân và bán sản phẩm tại quầy · Chi nhánh Quận 7</p>
        </div>
      </header>

      <div className="rp-toolbar">
        <div className="seg" role="radiogroup" aria-label="Xem theo">
          {GRANS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={g === x.id} className={g === x.id ? 'on' : ''} onClick={() => go({ g: x.id })}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="rp-period">
          <button className="btn btn-secondary btn-icon" type="button" aria-label="Kỳ trước" disabled={!canShift(anchor, g, -1)} onClick={() => go({ d: toIso(shift(anchor, g, -1)) })}>
            <Icon name="chevronLeft" />
          </button>
          <span className="rp-period-label">{periodLabel(anchor, g)}</span>
          <button className="btn btn-secondary btn-icon" type="button" aria-label="Kỳ sau" disabled={!canShift(anchor, g, 1)} onClick={() => go({ d: toIso(shift(anchor, g, 1)) })}>
            <Icon name="chevronRight" />
          </button>
        </div>
        <label className="rp-pick">
          <span className="sr-only">Chọn {g === 'day' ? 'ngày' : g === 'month' ? 'tháng' : 'năm'}</span>
          {g === 'day' && (
            <input className="inp" type="date" min={toIso(REPORT_START)} max={toIso(REPORT_TODAY)} value={anchorIso} onChange={(e) => e.target.value && go({ d: e.target.value })} />
          )}
          {g === 'month' && (
            <input
              className="inp"
              type="month"
              min={toIso(REPORT_START).slice(0, 7)}
              max={toIso(REPORT_TODAY).slice(0, 7)}
              value={anchorIso.slice(0, 7)}
              onChange={(e) => e.target.value && go({ d: e.target.value + '-01' })}
            />
          )}
          {g === 'year' && (
            <select className="inp" value={anchor.y} onChange={(e) => go({ d: `${e.target.value}-01-01` })}>
              {Array.from({ length: REPORT_TODAY.y - REPORT_START.y + 1 }, (_, i) => REPORT_START.y + i).map((y) => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          )}
        </label>
        <button className="btn btn-secondary" type="button" onClick={() => go({ d: toIso(REPORT_TODAY) })}>Hôm nay</button>
      </div>

      <section aria-label="Tổng quan kỳ" className="kpis">
        <Kpi label="Tổng doanh thu" value={grandTotal} prev={prevGrand} cmp={s.compareLabel} highlight />
        <Kpi label="Doanh thu đặt sân" value={booking.total} prev={booking.prev} cmp={s.compareLabel} />
        <Kpi label="Doanh thu sản phẩm" value={products.revenue} prev={products.prevRevenue} cmp={s.compareLabel} />
        <Kpi
          label="Lợi nhuận sản phẩm"
          value={products.profit}
          prev={products.prevProfit}
          cmp={s.compareLabel}
          extra={`Biên lợi nhuận ${pct(margin(products))}`}
        />
      </section>

      <div className="split">
        <section className="card wide" style={{ padding: '20px 24px 16px' }}>
          <div className="card-head" style={{ marginBottom: 4 }}>
            <h2 className="card-title">Doanh thu đặt sân</h2>
            <span className="num" style={{ fontSize: 22, fontWeight: 600 }}>{vnd(booking.total)}</span>
          </div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            {g === 'day' ? 'Theo giờ bắt đầu' : g === 'month' ? 'Theo ngày' : 'Theo tháng'} · chia theo khách cố định và vãng lai
          </p>
          <BarChart
            ariaLabel={`Doanh thu đặt sân ${periodLabel(anchor, g)}`}
            series={[
              { label: 'Khách cố định', color: C_FIXED },
              { label: 'Khách vãng lai', color: C_WALKIN },
            ]}
            data={booking.series}
            format={vnd}
            axisFormat={vndShort}
          />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
            <span className="lbl">Theo sân</span>
            <div className="rp-courts">
              {booking.byCourt.map((c) => (
                <div key={c.court.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px 12px', fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{c.court.name}</span>
                  <span className="num" style={{ fontSize: 16, textAlign: 'right' }}>{vnd(c.revenue)}</span>
                  <div className="meter" style={{ gridColumn: '1 / -1', height: 6 }} role="img" aria-label={`${c.court.name}: ${c.count} lượt đặt`}>
                    <div style={{ width: `${booking.byCourt[0].revenue ? (c.revenue / booking.byCourt[0].revenue) * 100 : 0}%`, background: 'var(--brand)' }} />
                  </div>
                  <span className="muted" style={{ fontSize: 12, gridColumn: '1 / -1' }}>{c.count.toLocaleString('vi-VN')} lượt đặt</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card side" style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 className="card-title">Vãng lai &amp; cố định</h2>
          <div className="share" role="img" aria-label={`Khách cố định ${pct(fixedShare)}, khách vãng lai ${pct(1 - fixedShare)} doanh thu đặt sân`}>
            {fixedShare > 0 && <div style={{ width: `${fixedShare * 100}%`, background: C_FIXED }} />}
            {fixedShare < 1 && booking.total > 0 && <div style={{ width: `${(1 - fixedShare) * 100}%`, background: C_WALKIN }} />}
          </div>
          <TypeBlock
            color={C_FIXED}
            name="Khách cố định"
            note={`Hội viên & khách đặt định kỳ · giảm ${FIXED_DISCOUNT * 100}%`}
            stats={booking.byType.fixed}
            share={fixedShare}
          />
          <TypeBlock color={C_WALKIN} name="Khách vãng lai" note="Khách lẻ đặt theo lượt, giá niêm yết" stats={booking.byType.walkin} share={booking.total ? 1 - fixedShare : 0} />

        </section>
      </div>

      <section className="card" style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card-head" style={{ flexWrap: 'wrap' }}>
          <div>
            <h2 className="card-title">Lợi nhuận sản phẩm</h2>
            <p className="muted" style={{ fontSize: 13 }}>
              Lợi nhuận = doanh thu − giá vốn · {g === 'day' ? 'theo giờ' : g === 'month' ? 'theo ngày' : 'theo tháng'}
              {selected ? ` · chỉ ${selected.name}` : ' · tất cả sản phẩm'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {selected && (
              <button type="button" className="chip on" onClick={() => setProductId(null)} aria-label={`Bỏ lọc ${selected.name}`}>
                {selected.name} ✕
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportCsv}>Xuất CSV</button>
          </div>
        </div>

        <BarChart
          ariaLabel={`Lợi nhuận ${selected ? selected.name : 'sản phẩm'} ${periodLabel(anchor, g)}`}
          series={[{ label: 'Lợi nhuận', color: 'var(--brand)' }]}
          data={products.series}
          format={vnd}
          axisFormat={vndShort}
          height={180}
        />

        <div style={{ overflowX: 'auto' }}>
          <table className="table rp-table">
            <caption className="sr-only">Chi tiết lợi nhuận từng sản phẩm, {periodLabel(anchor, g)}. Chọn tên sản phẩm để xem biểu đồ riêng.</caption>
            <thead>
              <tr>
                {sortBtn('name', 'Sản phẩm', false)}
                {sortBtn('qty', 'Đã bán')}
                {sortBtn('revenue', 'Doanh thu')}
                {sortBtn('cost', 'Giá vốn')}
                {sortBtn('profit', 'Lợi nhuận')}
                {sortBtn('margin', 'Biên LN')}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const on = r.product.id === productId;
                return (
                  <tr key={r.product.id} className={on ? 'sel' : ''} onClick={() => setProductId(on ? null : r.product.id)}>
                    <td>
                      <button
                        type="button"
                        className="row-btn"
                        aria-pressed={on}
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductId(on ? null : r.product.id);
                        }}
                      >
                        <span>
                          <span style={{ display: 'block', fontWeight: 600 }}>{r.product.name}</span>
                          <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)' }}>
                            {r.product.group} · {vnd(r.product.price)}/{r.product.unit} · vốn {vnd(r.product.cost)}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="num r">{r.qty.toLocaleString('vi-VN')} <span className="muted" style={{ fontSize: 13, fontFamily: 'var(--font-sans)' }}>{r.product.unit}</span></td>
                    <td className="num r">{vnd(r.revenue)}</td>
                    <td className="num r muted">{vnd(r.cost)}</td>
                    <td className="num r" style={{ fontWeight: 600 }}>{vnd(r.profit)}</td>
                    <td className="num r">{pct(margin(r))}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 700 }}>Tổng {PRODUCTS.length} sản phẩm</td>
                <td className="num r">—</td>
                <td className="num r">{vnd(products.revenue)}</td>
                <td className="num r muted">{vnd(products.cost)}</td>
                <td className="num r" style={{ fontWeight: 700 }}>{vnd(products.profit)}</td>
                <td className="num r">{pct(margin(products))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </>
  );
}

function Kpi({
  label,
  value,
  prev,
  cmp,
  extra,
  highlight,
}: {
  label: string;
  value: number;
  prev: number | null;
  cmp: string | null;
  extra?: string;
  highlight?: boolean;
}) {
  const change = prev ? (value - prev) / prev : null;
  return (
    <div className={'card kpi' + (highlight ? ' hl' : '')}>
      <span className="lbl">{label}</span>
      <span className="kpi-value">{vnd(value)}</span>
      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
        {change === null ? (
          'Chưa có dữ liệu kỳ trước'
        ) : (
          <>
            <b style={{ color: change >= 0 ? 'var(--brand)' : 'var(--danger)' }}>
              {change >= 0 ? '▲' : '▼'} {pct(Math.abs(change))}
            </b>{' '}
            {cmp}
          </>
        )}
      </span>
      {extra && <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{extra}</span>}
    </div>
  );
}

function TypeBlock({
  color,
  name,
  note,
  stats,
  share,
}: {
  color: string;
  name: string;
  note: string;
  stats: { revenue: number; count: number; customers: number };
  share: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: color, flex: 'none' }} />
        <b style={{ flex: 1 }}>{name}</b>
        <span className="num" style={{ fontSize: 15, color: 'var(--ink-muted)' }}>{pct(share)}</span>
      </div>
      <span className="num" style={{ fontSize: 26, fontWeight: 600, lineHeight: '30px' }}>{vnd(stats.revenue)}</span>
      <span className="muted" style={{ fontSize: 12 }}>{note}</span>
      <div className="rp-stats">
        <span><b className="num">{stats.count.toLocaleString('vi-VN')}</b> lượt đặt</span>
        <span><b className="num">{stats.customers.toLocaleString('vi-VN')}</b> khách</span>
        <span><b className="num">{stats.count ? vnd(stats.revenue / stats.count) : '—'}</b> / lượt</span>
      </div>
    </div>
  );
}
