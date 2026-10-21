import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookingGrid, BookingLegend } from '../../components/BookingGrid';
import { Icon } from '../../components/Icon';
import {
  CLOSE_HOUR,
  COURTS,
  MEMBER_DISCOUNT,
  NOW_HOUR,
  OPEN_HOUR,
  SPORTS,
  TODAY_LABEL,
  findMemberByPhone,
  type Sport,
} from '../../data/mock';
import { hh, vnd } from '../../lib/format';
import { useBookings } from '../../store/bookings';

type Filter = 'all' | Sport;

export default function Bookings() {
  const { bookings, addBooking, isFree } = useBookings();
  // ?san=cl2&gio=19 từ trang Trạng thái sân: lọc theo môn của sân và chọn sẵn ô giờ
  const [params] = useSearchParams();
  const linked = COURTS.find((c) => c.id === params.get('san'));
  const linkedHour = Number(params.get('gio'));
  const [filter, setFilter] = useState<Filter>(linked ? linked.sport : 'all');
  const [sel, setSel] = useState<{ courtId: string; hour: number } | null>(
    !linked
      ? { courtId: 'cl2', hour: 19 }
      : params.has('gio') && linkedHour >= OPEN_HOUR && linkedHour < CLOSE_HOUR
        ? { courtId: linked.id, hour: linkedHour }
        : null,
  );
  const [dur, setDur] = useState(1);
  const [phone, setPhone] = useState('0912 345 678');
  const [weekly, setWeekly] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const courts = useMemo(() => COURTS.filter((c) => filter === 'all' || c.sport === filter), [filter]);
  const court = sel ? COURTS.find((c) => c.id === sel.courtId)! : null;
  const member = findMemberByPhone(phone);

  const fits = !!sel && sel.hour + dur <= CLOSE_HOUR && isFree(sel.courtId, sel.hour, dur);
  const subtotal = court ? court.price * dur : 0;
  const discount = member ? Math.round(subtotal * MEMBER_DISCOUNT) : 0;
  const total = subtotal - discount;

  const pick = (courtId: string, hour: number) => {
    setSel({ courtId, hour });
    setNotice(null);
  };

  const create = (pending: boolean) => {
    if (!sel || !court || !fits) return;
    const name = member ? member.name : 'Khách lẻ';
    addBooking({
      courtId: sel.courtId,
      start: sel.hour,
      span: dur,
      state: pending ? 'pending' : 'booked',
      label: name,
      sub: pending ? 'Chưa cọc' : weekly ? 'Cố định hằng tuần' : undefined,
    });
    setNotice(
      `${pending ? 'Đã giữ chỗ' : 'Đã xác nhận'} ${court.name}, ${hh(sel.hour)}–${hh(sel.hour + dur)} cho ${name}` +
        (pending ? ' (chờ cọc).' : ` · thu ${vnd(total)}.`),
    );
    setSel(null);
    setDur(1);
  };

  return (
    <div className="split" style={{ gap: 24 }}>
      <div className="wide" style={{ flex: '999 1 600px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header className="page-head" style={{ alignItems: 'center' }}>
          <h1 className="page-title grow">Lịch đặt sân</h1>
          <button className="btn btn-secondary btn-icon" type="button" aria-label="Ngày trước">
            <Icon name="chevronLeft" />
          </button>
          <span style={{ fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{TODAY_LABEL}</span>
          <button className="btn btn-secondary btn-icon" type="button" aria-label="Ngày sau">
            <Icon name="chevronRight" />
          </button>
          <button className="btn btn-secondary" type="button">Hôm nay</button>
        </header>

        <div role="group" aria-label="Lọc theo môn" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {([{ id: 'all', label: 'Tất cả sân' }, ...SPORTS] as { id: Filter; label: string }[]).map((f) => (
            <button
              key={f.id}
              type="button"
              className={'chip' + (filter === f.id ? ' on' : '')}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <section className="card" style={{ padding: 16 }}>
          <BookingGrid
            courts={courts}
            bookings={bookings}
            from={OPEN_HOUR}
            to={CLOSE_HOUR}
            nowHour={NOW_HOUR}
            size="lg"
            showKind
            selected={sel ? { ...sel, span: fits ? dur : 1 } : null}
            onPick={pick}
          />
          <BookingLegend withSelected />
        </section>
      </div>

      <aside
        className="card side"
        aria-label="Tạo đơn đặt sân"
        style={{ flex: '1 1 340px', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {notice && (
          <div className="toast" role="status">
            <Icon name="check" />
            <span>{notice}</span>
          </div>
        )}

        {!court || !sel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="lbl">Đơn đặt sân mới</span>
            <p className="muted" style={{ fontSize: 14 }}>Chọn một ô trống trên lịch để tạo đơn.</p>
          </div>
        ) : (
          <>
            <div>
              <span className="lbl">Đơn đặt sân mới</span>
              <h2 style={{ margin: '4px 0 0', font: '700 32px/36px var(--font-display)' }}>{court.name}</h2>
              <p style={{ marginTop: 2, fontSize: 14, color: 'var(--ink-muted)' }}>
                Chủ nhật 18/10 · <b style={{ color: 'var(--ink)' }}>{hh(sel.hour)} – {hh(sel.hour + dur)}</b>
              </p>
            </div>

            <label className="field">
              Thời lượng
              <select className="inp" value={dur} onChange={(e) => setDur(Number(e.target.value))}>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n} giờ</option>
                ))}
              </select>
            </label>
            {!fits && (
              <div className="toast warn" role="alert">
                Khung {hh(sel.hour)}–{hh(sel.hour + dur)} bị trùng lịch hoặc quá giờ đóng cửa. Giảm thời lượng hoặc chọn ô khác.
              </div>
            )}

            <label className="field">
              Số điện thoại khách
              <input className="inp" type="tel" inputMode="numeric" placeholder="09xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>

            {member ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--brand-tint)', color: 'var(--brand-ink)' }}>
                <span className="avatar" style={{ width: 36, height: 36, background: 'var(--brand)', color: 'var(--on-brand)' }} aria-hidden="true">{member.ini}</span>
                <div style={{ flex: 1, fontSize: 13, lineHeight: '18px' }}>
                  <b style={{ fontSize: 14 }}>{member.name}</b>
                  <br />
                  Hội viên {member.plan} · giảm {MEMBER_DISCOUNT * 100}%
                </div>
              </div>
            ) : (
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-sunken)', color: 'var(--ink-muted)', fontSize: 13 }}>
                Khách lẻ – không có ưu đãi hội viên.
              </div>
            )}

            <label className="check">
              <input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} /> Đặt cố định hằng tuần
            </label>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <div className="line">
                <span className="muted">{vnd(court.price)} × {dur} giờ</span>
                <span className="num" style={{ fontSize: 18 }}>{vnd(subtotal)}</span>
              </div>
              {member && (
                <div className="line">
                  <span className="muted">Ưu đãi hội viên −{MEMBER_DISCOUNT * 100}%</span>
                  <span className="num" style={{ fontSize: 18, color: 'var(--brand)' }}>{vnd(-discount)}</span>
                </div>
              )}
              <div className="line" style={{ alignItems: 'baseline', marginTop: 4 }}>
                <b>Tổng cộng</b>
                <span className="num" style={{ fontSize: 32, fontWeight: 600 }}>{vnd(total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" type="button" style={{ flex: '1 1 120px' }} disabled={!fits} onClick={() => create(true)}>
                Giữ chỗ, chờ cọc
              </button>
              <button className="btn btn-primary" type="button" style={{ flex: '1 1 120px' }} disabled={!fits} onClick={() => create(false)}>
                Xác nhận &amp; thu tiền
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
