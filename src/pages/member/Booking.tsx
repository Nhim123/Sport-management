import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { MEMBER_DISCOUNT, type Sport } from '../../data/mock';
import { sportsIn, useCourts } from '../../store/courts';
import { hh, vnd } from '../../lib/format';
import { useBookings } from '../../store/bookings';

export interface CheckoutState {
  courtId: string;
  dayIndex: number;
  dayLabel: string;
  hour: number;
}

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DOW_LONG = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const TIMES = [6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22];
/** Lịch các ngày tới chưa nối dữ liệu – giả định kín 18:00, 19:00 */
const FUTURE_TAKEN = [18, 19];

export default function MemberBooking() {
  const navigate = useNavigate();
  const { isFree } = useBookings();
  const { visible } = useCourts();
  const [sport, setSport] = useState<Sport>('cl');
  const [day, setDay] = useState(0);
  const [courtIdx, setCourtIdx] = useState(0);
  const [hour, setHour] = useState<number | null>(null);

  // Chỉ sân đang hiện và không tạm ngừng mới nhận đặt qua app
  const bookable = visible.filter((c) => !c.locked);
  const sports = sportsIn(bookable);
  const activeSport = sports.some((s) => s.id === sport) ? sport : sports[0]?.id;
  const courts = bookable.filter((c) => c.sport === activeSport);
  const court = courts[Math.min(courtIdx, courts.length - 1)];
  if (!court) {
    return (
      <div className="m-body">
        <h1 className="m-title">Đặt sân</h1>
        <p className="muted">Hiện chưa có sân nào nhận đặt qua app.</p>
      </div>
    );
  }

  const taken = (h: number) => (day === 0 ? !isFree(court.id, h, 1) : FUTURE_TAKEN.includes(h));
  const firstFree = TIMES.find((h) => h >= 19 && !taken(h)) ?? TIMES.find((h) => !taken(h)) ?? null;
  const time = hour !== null && !taken(hour) ? hour : firstFree;

  const days = Array.from({ length: 7 }, (_, i) => ({ n: 18 + i, dow: DOW[i], long: DOW_LONG[i] }));
  const price = Math.round(court.price * (1 - MEMBER_DISCOUNT));
  const dayLabel = `${days[day].long} ${days[day].n}/10`;

  return (
    <>
      <header className="m-head">
        <Link to="/app" className="m-back" aria-label="Quay lại"><Icon name="chevronLeft" className="ic-lg" /></Link>
        <h1 className="m-title">Đặt sân</h1>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 0 24px' }}>
        <div role="group" aria-label="Chọn môn" className="m-chips" style={{ padding: '0 20px' }}>
          {sports.map((s) => (
            <button
              key={s.id}
              type="button"
              className={'chip' + (activeSport === s.id ? ' on' : '')}
              aria-pressed={activeSport === s.id}
              onClick={() => { setSport(s.id); setCourtIdx(0); }}
            >
              {s.short}
            </button>
          ))}
        </div>

        <section style={{ padding: '0 20px' }}>
          <h2 className="m-h3">Tháng 10</h2>
          <div role="group" aria-label="Chọn ngày" className="days">
            {days.map((d, i) => (
              <button
                key={d.n}
                type="button"
                className={'day' + (day === i ? ' on' : '')}
                aria-pressed={day === i}
                aria-label={`${d.dow} ${d.n}/10`}
                onClick={() => setDay(i)}
              >
                <span style={{ fontSize: 11, fontWeight: 600 }}>{i === 0 ? 'Nay' : d.dow}</span>
                <span className="num" style={{ fontSize: 22, fontWeight: 700, lineHeight: '24px' }}>{d.n}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ padding: '0 20px' }}>
          <div className="line" style={{ alignItems: 'baseline', marginBottom: 10 }}>
            <h2 className="m-h3" style={{ margin: 0 }}>Giờ bắt đầu</h2>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Gạch ngang = đã kín</span>
          </div>
          <div role="group" aria-label="Chọn giờ" className="times">
            {TIMES.map((h) => {
              const off = taken(h);
              return (
                <button
                  key={h}
                  type="button"
                  className={'time' + (time === h ? ' on' : '')}
                  disabled={off}
                  aria-pressed={time === h}
                  aria-label={hh(h) + (off ? ' – đã kín' : '')}
                  onClick={() => setHour(h)}
                >
                  {hh(h)}
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ padding: '0 20px' }}>
          <h2 className="m-h3">Chọn sân</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {courts.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={'court-opt' + (court.id === c.id ? ' on' : '')}
                aria-pressed={court.id === c.id}
                onClick={() => setCourtIdx(i)}
              >
                <span className="radio" aria-hidden="true" />
                <span style={{ flex: 1 }}>
                  <b style={{ display: 'block', fontSize: 15 }}>{c.name}</b>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{c.mobileKind}</span>
                </span>
                <span className="num" style={{ fontSize: 18, fontWeight: 600 }}>{vnd(c.price)}/giờ</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="m-foot">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {court.name} · {days[day].dow} {days[day].n}/10 · {time !== null ? hh(time) : 'chưa chọn giờ'} · 1 giờ
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="num" style={{ fontSize: 26, fontWeight: 700, lineHeight: '30px' }}>{vnd(price)}</span>
            <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>giá hội viên −{MEMBER_DISCOUNT * 100}%</span>
          </div>
        </div>
        <button
          type="button"
          className="m-cta"
          disabled={time === null}
          onClick={() =>
            time !== null &&
            navigate('/app/thanh-toan', { state: { courtId: court.id, dayIndex: day, dayLabel, hour: time } satisfies CheckoutState })
          }
        >
          Tiếp tục
        </button>
      </footer>
    </>
  );
}
