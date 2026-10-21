import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { BarChart } from '../../components/BarChart';
import { BookingGrid, BookingLegend } from '../../components/BookingGrid';
import { CLASSES_TODAY, COURTS, KPIS, MEMBERS, NOW_HOUR, RENEW_SOON, TODAY_LABEL } from '../../data/mock';
import { REPORT_TODAY } from '../../data/reports';
import { vnd, vndShort } from '../../lib/format';
import { dailyRevenue, summarize, toIso } from '../../lib/reports';
import { useBookings } from '../../store/bookings';

const pct = (x: number) => (x * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%';

/** "Doanh thu hôm nay" = đặt sân + sản phẩm, cùng cách tính với trang Báo cáo (xem theo ngày) */
function revenueKpi() {
  const { booking, products, compareLabel } = summarize(REPORT_TODAY, 'day', null);
  const value = booking.total + products.revenue;
  const prev = booking.prev !== null && products.prevRevenue !== null ? booking.prev + products.prevRevenue : null;
  const change = prev ? (value - prev) / prev : null;
  return {
    label: 'Doanh thu hôm nay',
    value: vnd(value),
    delta: change === null ? '' : `${change >= 0 ? '▲' : '▼'} ${pct(Math.abs(change))}`,
    hint: change === null ? 'Chưa có dữ liệu kỳ trước' : compareLabel ?? '',
    up: change === null || change >= 0,
    highlight: true,
  };
}

export default function Dashboard() {
  const { bookings } = useBookings();
  const renew = RENEW_SOON.map((code) => MEMBERS.find((m) => m.code === code)!);
  const kpis = useMemo<((typeof KPIS)[number] & { highlight?: boolean })[]>(() => [revenueKpi(), ...KPIS], []);
  const week = useMemo(() => dailyRevenue(REPORT_TODAY, 7), []);
  const weekTotal = week.reduce((s, d) => s + d.values[0] + d.values[1], 0);
  const reportLink = `/bao-cao?g=month&d=${toIso(REPORT_TODAY)}`;

  return (
    <>
      <header className="page-head">
        <div className="grow">
          <h1 className="page-title">{TODAY_LABEL}</h1>
          <p className="page-sub">Chi nhánh Quận 7 · Ca tối 17:00–23:00</p>
        </div>
        <input type="search" className="inp search" aria-label="Tìm kiếm" placeholder="Tìm hội viên, SĐT, mã đặt sân…" />
        <button className="btn btn-volt" type="button">Check-in nhanh</button>
        <Link className="btn btn-primary" to="/lich-dat-san">+ Đặt sân</Link>
      </header>

      <section aria-label="Chỉ số hôm nay" className="kpis">
        {kpis.map((k) => (
          <div key={k.label} className={'card kpi' + (k.highlight ? ' hl' : '')}>
            <span className="lbl">{k.label}</span>
            <span className="kpi-value">{k.value}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
              {k.delta && <b style={{ color: k.up ? 'var(--brand)' : 'var(--danger)' }}>{k.delta}</b>} {k.hint}
            </span>
          </div>
        ))}
      </section>

      <div className="split">
        <section className="card wide" style={{ padding: '20px 24px 24px' }}>
          <div className="card-head" style={{ marginBottom: 16 }}>
            <h2 className="card-title">Lịch sân tối nay</h2>
            <Link to="/lich-dat-san" style={{ fontSize: 14, fontWeight: 600 }}>Mở lịch đầy đủ →</Link>
          </div>
          <BookingGrid courts={COURTS} bookings={bookings} from={17} to={23} nowHour={NOW_HOUR} />
          <BookingLegend />
        </section>

        <section className="card side" style={{ padding: '20px 0 8px' }}>
          <div className="card-head" style={{ padding: '0 24px 8px' }}>
            <h2 className="card-title">Lớp học hôm nay</h2>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{CLASSES_TODAY.length} lớp</span>
          </div>
          {CLASSES_TODAY.map((c) => {
            const full = c.booked >= c.cap;
            return (
              <div key={c.time + c.name} className="list-row">
                <span className="num" style={{ width: 52, fontSize: 22, fontWeight: 600, color: 'var(--clay)' }}>{c.time}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{c.coach} · {c.room}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{c.booked}/{c.cap}</div>
                  <div className="meter" style={{ width: 64 }} role="img" aria-label={`Đã đăng ký ${c.booked} trên ${c.cap}`}>
                    <div style={{ width: `${(c.booked / c.cap) * 100}%`, background: full ? 'var(--danger)' : 'var(--clay)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <div className="split">
        <section className="card wide" style={{ padding: '20px 24px 24px' }}>
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h2 className="card-title">Doanh thu 7 ngày</h2>
            <Link to={reportLink} style={{ fontSize: 14, fontWeight: 600 }}>Xem báo cáo →</Link>
          </div>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: 'var(--ink-muted)' }}>
            Tổng <b className="num" style={{ fontSize: 18, color: 'var(--ink)' }}>{vnd(weekTotal)}</b> · {week[0].full} – {week[week.length - 1].full}
          </p>
          <BarChart
            ariaLabel={`Doanh thu 7 ngày, ${week[0].full} đến ${week[week.length - 1].full}`}
            series={[
              { label: 'Thuê sân', color: 'var(--series-courts)' },
              { label: 'Sản phẩm', color: 'var(--series-products)' },
            ]}
            data={week}
            format={vnd}
            axisFormat={vndShort}
          />
        </section>

        <section className="card side" style={{ padding: '20px 0 8px' }}>
          <div className="card-head" style={{ padding: '0 24px 8px' }}>
            <h2 className="card-title">Cần gia hạn</h2>
            <Link to="/hoi-vien?tab=expiring" style={{ fontSize: 13, fontWeight: 600 }}>27 người →</Link>
          </div>
          {renew.map((m) => (
            <div key={m.code} className="list-row" style={{ gap: 12, padding: '10px 16px 10px 24px' }}>
              <span className="avatar" aria-hidden="true">{m.ini}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{m.plan} · {m.group === 'expired' ? `hết hạn ${m.exp.slice(0, 5)}` : `còn ${m.remain}`}</div>
                <span className={'badge b-' + m.tone} style={{ marginTop: 4 }}>{m.status}</span>
              </div>
              <Link className="btn btn-ghost" to={`/hoi-vien?m=${m.code}`}>Gia hạn</Link>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
