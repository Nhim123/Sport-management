import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { COURTS, CURRENT_MEMBER_CODE, MEMBER_DISCOUNT, MEMBERS, RACKET_RENT } from '../../data/mock';
import { hh, vnd } from '../../lib/format';
import { useBookings } from '../../store/bookings';
import type { CheckoutState } from './Booking';

const DEFAULT: CheckoutState = { courtId: 'cl2', dayIndex: 0, dayLabel: 'Chủ nhật 18/10', hour: 19 };
const HOLD_SECONDS = 9 * 60 + 42;

const METHODS = [
  { id: 'qr', logo: 'QR', bg: 'var(--info-tint)', fg: 'var(--info)', title: 'Chuyển khoản VietQR', sub: 'Mọi ngân hàng · xác nhận tự động' },
  { id: 'wallet', logo: 'Ví', bg: 'var(--clay-tint)', fg: 'var(--clay-ink)', title: 'Ví điện tử', sub: 'MoMo, ZaloPay, ShopeePay' },
  { id: 'card', logo: 'Thẻ', bg: 'var(--surface-sunken)', fg: 'var(--ink)', title: 'Thẻ ATM / Visa / Mastercard' },
  { id: 'desk', logo: 'Quầy', bg: 'var(--brand-tint)', fg: 'var(--brand-ink)', title: 'Trả tại quầy', sub: 'Cần cọc 50% để giữ sân giờ cao điểm', warn: true },
];

export default function MemberCheckout() {
  const { state } = useLocation() as { state: CheckoutState | null };
  const order = state ?? DEFAULT;
  const court = COURTS.find((c) => c.id === order.courtId)!;
  const me = MEMBERS.find((m) => m.code === CURRENT_MEMBER_CODE)!;
  const { addBooking, isFree } = useBookings();

  const [left, setLeft] = useState(HOLD_SECONDS);
  const [racket, setRacket] = useState(false);
  const [method, setMethod] = useState('qr');
  const [paid, setPaid] = useState<string | null>(null);

  useEffect(() => {
    if (paid) return;
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [paid]);

  const discount = Math.round(court.price * MEMBER_DISCOUNT);
  const total = court.price - discount + (racket ? RACKET_RENT : 0);
  const expired = left === 0;
  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;

  const pay = () => {
    if (expired) return;
    const code = 'ĐS-' + String(7000 + Math.floor(Math.random() * 999));
    if (order.dayIndex === 0 && isFree(court.id, order.hour, 1)) {
      addBooking({ courtId: court.id, start: order.hour, span: 1, state: method === 'desk' ? 'pending' : 'booked', label: me.name.split(' ').slice(-2).join(' '), sub: 'Đặt qua app' });
    }
    setPaid(code);
  };

  if (paid) {
    return (
      <div className="m-body" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <span style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--brand)', color: 'var(--on-brand)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={36} />
        </span>
        <h1 className="m-title">{method === 'desk' ? 'Đã giữ chỗ' : 'Đặt sân thành công'}</h1>
        <p className="muted">
          {court.name} · {order.dayLabel} · {hh(order.hour)}–{hh(order.hour + 1)}
          <br />
          Mã đặt sân <b style={{ color: 'var(--ink)' }}>{paid}</b>
        </p>
        <Link to="/app" className="m-cta" style={{ marginTop: 8 }}>Về trang chủ</Link>
      </div>
    );
  }

  return (
    <>
      <header className="m-head">
        <Link to="/app/dat-san" className="m-back" aria-label="Quay lại"><Icon name="chevronLeft" className="ic-lg" /></Link>
        <h1 className="m-title" style={{ flex: 1 }}>Thanh toán</h1>
        <span className={'hold' + (expired ? ' over' : '')} role="timer" aria-label={`Thời gian giữ chỗ còn ${mmss}`}>
          <Icon name="timer" size={14} />
          {expired ? 'Hết giờ giữ chỗ' : <>Giữ chỗ <span className="num" style={{ fontSize: 15 }}>{mmss}</span></>}
        </span>
      </header>

      <div style={{ flex: 1, padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section aria-label="Đơn đặt sân" className="order">
          <div className="order-head">
            <div style={{ flex: 1 }}>
              <div className="lbl" style={{ color: 'inherit' }}>Arena · Chi nhánh Quận 7</div>
              <div className="num" style={{ fontSize: 30, fontWeight: 700, lineHeight: '34px' }}>{court.name}</div>
              <div style={{ fontSize: 13 }}>{order.dayLabel} · {hh(order.hour)}–{hh(order.hour + 1)}</div>
            </div>
            <svg aria-hidden="true" viewBox="0 0 80 56" width="80" height="56">
              <rect x="2" y="2" width="76" height="52" fill="none" stroke="var(--volt)" strokeWidth="2" />
              <line x1="40" y1="2" x2="40" y2="54" stroke="var(--volt)" strokeWidth="2" />
              <line x1="2" y1="14" x2="78" y2="14" stroke="var(--volt)" strokeWidth="1.5" />
              <line x1="2" y1="42" x2="78" y2="42" stroke="var(--volt)" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="order-body">
            <div className="line"><span className="muted">Thuê sân 1 giờ</span><span className="num" style={{ fontSize: 17 }}>{vnd(court.price)}</span></div>
            <div className="line"><span className="muted">Ưu đãi hội viên −{MEMBER_DISCOUNT * 100}%</span><span className="num" style={{ fontSize: 17, color: 'var(--brand)' }}>{vnd(-discount)}</span></div>
            <div className="line">
              <span className="muted">Thuê vợt (tuỳ chọn)</span>
              {racket ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="num" style={{ fontSize: 17 }}>{vnd(RACKET_RENT)}</span>
                  <button type="button" onClick={() => setRacket(false)} style={{ border: 0, background: 'none', color: 'var(--danger)', font: '600 13px var(--font-sans)', cursor: 'pointer', minHeight: 32 }}>Bỏ</button>
                </span>
              ) : (
                <button type="button" onClick={() => setRacket(true)} style={{ border: 0, background: 'none', color: 'var(--brand)', font: '600 13px var(--font-sans)', padding: '0 4px', cursor: 'pointer', minHeight: 32 }}>+ Thêm</button>
              )}
            </div>
            <div className="order-total"><b>Tổng thanh toán</b><span className="num" style={{ fontSize: 30, fontWeight: 700 }}>{vnd(total)}</span></div>
          </div>
        </section>

        <fieldset style={{ margin: 0, padding: 0, border: 0 }}>
          <legend style={{ padding: 0, margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>Phương thức thanh toán</legend>
          <div className="pm-list">
            {METHODS.map((m) => (
              <label key={m.id} className="pm">
                <input type="radio" name="pay" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                <span className="pm-logo" style={{ background: m.bg, color: m.fg }}>{m.logo}</span>
                <span style={{ flex: 1 }}>
                  <b>{m.title}</b>
                  {m.sub && <><br /><span style={{ fontSize: 12, color: m.warn ? 'var(--warning)' : 'var(--ink-muted)' }}>{m.sub}</span></>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <p style={{ fontSize: 12, lineHeight: '18px', color: 'var(--ink-muted)' }}>
          Huỷ miễn phí trước 4 giờ. Sau thời hạn này, tiền sân được chuyển thành điểm thưởng cho lần đặt sau.
        </p>
      </div>

      <footer className="m-foot" style={{ display: 'block' }}>
        <button type="button" className="m-cta btn-block" style={{ height: 52, fontSize: 16 }} disabled={expired} onClick={pay}>
          {expired ? 'Hết thời gian giữ chỗ' : method === 'desk' ? `Giữ chỗ · cọc ${vnd(Math.round(total / 2))}` : `Thanh toán ${vnd(total)}`}
        </button>
      </footer>
    </>
  );
}
