import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookingGrid, BookingLegend } from '../../components/BookingGrid';
import { CourtEditor } from '../../components/CourtEditor';
import { Icon } from '../../components/Icon';
import { SportBadge } from '../../components/SportIcon';
import { MEMBER_DISCOUNT, NOW_HOUR, TODAY_LABEL, findMemberByPhone, type Sport } from '../../data/mock';
import { hh, vnd } from '../../lib/format';
import { useScheduleView } from '../../lib/scheduleView';
import { loadBookingModes } from '../../lib/bookingModes';
import { useBookings } from '../../store/bookings';
import { lockBookings, sportsIn, useCourts } from '../../store/courts';

type Filter = 'all' | Sport;

export default function Bookings() {
  const { bookings, addBooking, isFree } = useBookings();
  const { visible } = useCourts();
  const [view, setView] = useScheduleView();

  // ?san=cl2&gio=19 từ trang Trạng thái sân: lọc theo môn của sân và chọn sẵn ô giờ
  const [params] = useSearchParams();
  const linked = visible.find((c) => c.id === params.get('san'));
  const linkedHour = Number(params.get('gio'));
  const [filter, setFilter] = useState<Filter>(linked ? linked.sport : 'all');
  const [sel, setSel] = useState<{ courtId: string; hour: number } | null>(
    !linked
      ? { courtId: 'cl2', hour: 19 }
      : params.has('gio') && linkedHour >= view.from && linkedHour < view.to
        ? { courtId: linked.id, hour: linkedHour }
        : null,
  );
  const [dur, setDur] = useState(1);
  const [phone, setPhone] = useState('0912 345 678');
  const [weekly, setWeekly] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [modes] = useState(loadBookingModes);
  const [mode, setMode] = useState<'court' | 'pickup'>('court');
  const [withTicket, setWithTicket] = useState(false); // kèm bán vé lượt khi đặt nguyên sân
  const [tickets, setTickets] = useState(2);
  const [cap, setCap] = useState(modes.pickupCap);
  const [players, setPlayers] = useState(1);

  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const sports = sportsIn(visible);
  const activeFilter: Filter = filter !== 'all' && sports.some((s) => s.id === filter) ? filter : 'all';
  const courts = useMemo(() => visible.filter((c) => activeFilter === 'all' || c.sport === activeFilter), [visible, activeFilter]);
  const gridBookings = useMemo(() => [...bookings, ...lockBookings(visible)], [bookings, visible]);

  const court = sel ? (visible.find((c) => c.id === sel.courtId && !c.locked) ?? null) : null;
  const member = findMemberByPhone(phone);

  // Vé lượt & pickup bật/tắt theo từng sân (cấu hình ở Tùy chỉnh sân).
  // Pickup là chế độ riêng; vé lượt là lựa chọn kèm (tick) ngay trong form đặt nguyên sân.
  const allowTicket = !!court?.ticket;
  const allowPickup = !!court?.pickup;
  const bmode: 'court' | 'pickup' = mode === 'pickup' && allowPickup ? 'pickup' : 'court';

  const fits = !!sel && !!court && sel.hour >= view.from && sel.hour + dur <= view.to && isFree(sel.courtId, sel.hour, dur);
  const subtotal = court ? court.price * dur : 0;
  const discount = member ? Math.round(subtotal * MEMBER_DISCOUNT) : 0;
  const ticketQty = bmode === 'court' && allowTicket && withTicket ? tickets : 0;
  const ticketSum = ticketQty * modes.ticketPrice;
  const total = subtotal - discount + ticketSum;

  const pick = (courtId: string, hour: number) => {
    setSel({ courtId, hour });
    setNotice(null);
  };

  const create = (pending: boolean) => {
    if (!sel || !court || !fits) return;
    const name = member ? member.name : 'Khách lẻ';
    const extras: string[] = [];
    if (!pending && weekly) extras.push('Cố định hằng tuần');
    if (ticketQty > 0) extras.push(`+${ticketQty} vé lượt`);
    addBooking({
      courtId: sel.courtId,
      start: sel.hour,
      span: dur,
      state: pending ? 'pending' : 'booked',
      label: name,
      sub: pending ? 'Chưa cọc' : extras.join(' · ') || undefined,
      tickets: ticketQty || undefined,
    });
    setNotice(
      `${pending ? 'Đã giữ chỗ' : 'Đã xác nhận'} ${court.name}, ${hh(sel.hour)}–${hh(sel.hour + dur)} cho ${name}` +
        (ticketQty > 0 ? ` (kèm ${ticketQty} vé lượt)` : '') +
        (pending ? ' (chờ cọc).' : ` · thu ${vnd(total)}.`),
    );
    setSel(null);
    setDur(1);
    setWithTicket(false);
  };

  const createPickup = () => {
    if (!sel || !court || !fits) return;
    addBooking({ courtId: sel.courtId, start: sel.hour, span: dur, state: 'booked', mode: 'pickup', players, capacity: cap, label: `Pickup ${players}/${cap}`, sub: `${vnd(modes.pickupPrice)}/người` });
    setNotice(`Đã mở trận pickup ${court.name}, ${hh(sel.hour)}–${hh(sel.hour + dur)} · ${players}/${cap} người.`);
    setSel(null);
    setDur(1);
    setMode('court');
  };

  const toggleEditing = () => {
    setEditing((e) => !e);
    setEditId(null);
  };

  const countFor = (courtId: string) => bookings.filter((b) => b.courtId === courtId).length;

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
          <button className={'btn ' + (editing ? 'btn-primary' : 'btn-secondary')} type="button" aria-pressed={editing} onClick={toggleEditing}>
            <Icon name="sliders" />
            {editing ? 'Đang tùy chỉnh' : 'Tùy chỉnh sân'}
          </button>
        </header>

        <div role="group" aria-label="Lọc theo môn" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" className={'chip' + (activeFilter === 'all' ? ' on' : '')} aria-pressed={activeFilter === 'all'} onClick={() => setFilter('all')}>
            Tất cả sân <span className="chip-count">{visible.length}</span>
          </button>
          {sports.map((s) => (
            <button
              key={s.id}
              type="button"
              className={'chip chip-ic' + (activeFilter === s.id ? ' on' : '')}
              aria-pressed={activeFilter === s.id}
              onClick={() => setFilter(s.id)}
            >
              <SportBadge sport={s.id} size={24} />
              {s.label}
              <span className="chip-count">{visible.filter((c) => c.sport === s.id).length}</span>
            </button>
          ))}
        </div>

        {editing && (
          <div className="toast info" role="status">
            <Icon name="sliders" />
            <span>Đang tùy chỉnh – bấm tên sân trên lịch hoặc trong danh sách bên phải để sửa. Thay đổi áp dụng ngay.</span>
          </div>
        )}

        <section className="card" style={{ padding: 16 }}>
          <BookingGrid
            courts={courts}
            bookings={gridBookings}
            from={view.from}
            to={view.to}
            nowHour={NOW_HOUR}
            size="lg"
            showKind
            showPrice={view.showPrice}
            dense={view.dense}
            selected={!editing && sel ? { ...sel, span: fits ? dur : 1 } : null}
            onPick={editing ? undefined : pick}
            onCourtClick={editing ? (id) => setEditId((cur) => (cur === id ? null : id)) : undefined}
            activeCourtId={editId}
          />
          <BookingLegend withSelected={!editing} />
        </section>
      </div>

      <aside
        className="card side"
        aria-label={editing ? 'Tùy chỉnh sân' : 'Tạo đơn đặt sân'}
        style={{ flex: '1 1 340px', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {editing ? (
          <CourtEditor editId={editId} setEditId={setEditId} view={view} setView={setView} bookingCount={countFor} onDone={toggleEditing} />
        ) : (
          <>
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
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <SportBadge sport={court.sport} size={44} />
                  <div>
                    <span className="lbl">Đơn đặt sân mới</span>
                    <h2 style={{ margin: '2px 0 0', font: '700 32px/36px var(--font-display)' }}>{court.name}</h2>
                  </div>
                </div>
                <p style={{ marginTop: -8, fontSize: 14, color: 'var(--ink-muted)' }}>
                  Chủ nhật 18/10 · <b style={{ color: 'var(--ink)' }}>{hh(sel.hour)} – {hh(sel.hour + dur)}</b>
                </p>

                {allowPickup && (
                  <div className="field">
                    <span id="bk-mode">Chế độ đặt</span>
                    <div className="seg seg-wrap" role="radiogroup" aria-labelledby="bk-mode">
                      <button type="button" role="radio" aria-checked={bmode === 'court'} className={bmode === 'court' ? 'on' : ''} onClick={() => setMode('court')}>Nguyên sân</button>
                      <button type="button" role="radio" aria-checked={bmode === 'pickup'} className={bmode === 'pickup' ? 'on' : ''} onClick={() => setMode('pickup')}>Pickup</button>
                    </div>
                  </div>
                )}

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

                {bmode === 'pickup' && (
                  <>
                    <div className="ce-row2">
                      <label className="field">
                        Sức chứa (người)
                        <input className="inp" type="number" min={2} max={50} value={cap} onChange={(e) => setCap(Math.max(2, Math.min(50, Number(e.target.value) || 2)))} />
                      </label>
                      <label className="field">
                        Mở đầu (người)
                        <input className="inp" type="number" min={1} max={cap} value={players} onChange={(e) => setPlayers(Math.max(1, Math.min(cap, Number(e.target.value) || 1)))} />
                      </label>
                    </div>
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                      <div className="line" style={{ alignItems: 'baseline' }}>
                        <span className="muted">{vnd(modes.pickupPrice)}/người · còn {Math.max(0, cap - players)} chỗ</span>
                        <span className="num" style={{ fontSize: 32, fontWeight: 600 }}>{vnd(modes.pickupPrice * players)}</span>
                      </div>
                    </div>
                    <button className="btn btn-primary" type="button" disabled={!fits} onClick={createPickup}>Mở trận pickup</button>
                  </>
                )}

                {bmode === 'court' && (
                <>
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

                {allowTicket && (
                  <div>
                    <label className="check">
                      <input type="checkbox" checked={withTicket} onChange={(e) => setWithTicket(e.target.checked)} /> Kèm bán vé lượt (xé vé)
                    </label>
                    {withTicket && (
                      <label className="field" style={{ marginTop: 8 }}>
                        Số vé (người)
                        <input className="inp" type="number" min={1} max={40} value={tickets} onChange={(e) => setTickets(Math.max(1, Math.min(40, Number(e.target.value) || 1)))} />
                      </label>
                    )}
                  </div>
                )}

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
                  {ticketQty > 0 && (
                    <div className="line">
                      <span className="muted">Vé lượt {vnd(modes.ticketPrice)} × {ticketQty}</span>
                      <span className="num" style={{ fontSize: 18 }}>{vnd(ticketSum)}</span>
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
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
