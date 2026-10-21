import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { CLOSE_HOUR, COURTS, NOW_HOUR, OPEN_HOUR, SPORTS, TODAY_LABEL, type Booking, type Sport } from '../../data/mock';
import { SOON_MINUTES, courtStatus, fmtDuration, type CourtStatus, type CourtStatusKind } from '../../lib/courtStatus';
import { hh, hm } from '../../lib/format';
import { useBookings } from '../../store/bookings';

type SportFilter = 'all' | Sport;
type Group = 'busy' | 'soon' | 'free' | 'pending' | 'blocked';

const STEP = 0.25; // 15 phút
const LAST = CLOSE_HOUR - STEP;

const KIND: Record<CourtStatusKind, { label: string; badge: string; accent: string; group: Group }> = {
  inUse: { label: 'Đang sử dụng', badge: 'b-success', accent: 'var(--brand)', group: 'busy' },
  class: { label: 'Đang có lớp', badge: 'b-class', accent: 'var(--clay)', group: 'busy' },
  soon: { label: 'Sắp tới lượt', badge: 'b-info', accent: 'var(--info)', group: 'soon' },
  free: { label: 'Trống', badge: 'b-outline', accent: 'var(--line-strong)', group: 'free' },
  pending: { label: 'Chờ cọc', badge: 'b-warning', accent: 'var(--warning)', group: 'pending' },
  blocked: { label: 'Bảo trì / Khóa', badge: 'b-neutral', accent: 'var(--ink-muted)', group: 'blocked' },
};

const GROUPS: { id: Group; label: string; accent: string }[] = [
  { id: 'busy', label: 'Đang sử dụng', accent: 'var(--brand)' },
  { id: 'soon', label: 'Sắp tới lượt', accent: 'var(--info)' },
  { id: 'free', label: 'Trống', accent: 'var(--line-strong)' },
  { id: 'pending', label: 'Chờ cọc', accent: 'var(--warning)' },
  { id: 'blocked', label: 'Bảo trì / Khóa', accent: 'var(--ink-muted)' },
];

/** Nhãn phụ cho lượt kế tiếp không phải lượt đặt thường */
const NEXT_BADGE: Partial<Record<Booking['state'], { label: string; badge: string }>> = {
  pending: { label: 'Chờ cọc', badge: 'b-warning' },
  class: { label: 'Lớp học', badge: 'b-class' },
  blocked: { label: 'Bảo trì', badge: 'b-neutral' },
};

interface Actions {
  checkIn: (b: Booking) => void;
  deposit: (b: Booking, here: boolean) => void;
  cancel: (b: Booking) => void;
  lock: () => void;
  unlock: (b: Booking) => void;
}

export default function CourtStatusPage() {
  const { bookings, addBooking, updateBooking, removeBooking, isFree } = useBookings();
  const [t, setT] = useState(NOW_HOUR);
  const [sport, setSport] = useState<SportFilter>('all');
  const [group, setGroup] = useState<Group | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const statuses = useMemo(
    () => COURTS.filter((c) => sport === 'all' || c.sport === sport).map((c) => courtStatus(c, bookings, t)),
    [bookings, sport, t],
  );
  const counts = useMemo(() => {
    const n: Record<Group, number> = { busy: 0, soon: 0, free: 0, pending: 0, blocked: 0 };
    statuses.forEach((s) => n[KIND[s.kind].group]++);
    return n;
  }, [statuses]);
  const shown = group ? statuses.filter((s) => KIND[s.kind].group === group) : statuses;

  const isNow = t === NOW_HOUR;
  const hour = Math.floor(t);
  const move = (d: number) => setT((x) => Math.min(LAST, Math.max(OPEN_HOUR, x + d)));

  const actionsFor = (s: CourtStatus): Actions => {
    const name = s.court.name;
    return {
      checkIn: (b) => {
        updateBooking(b.id, { checkedIn: true });
        setNotice(`Đã check-in ${b.label} · ${name}, ${hh(b.start)}–${hh(b.start + b.span)}.`);
      },
      deposit: (b, here) => {
        updateBooking(b.id, { state: 'booked', sub: undefined, checkedIn: here || b.checkedIn });
        setNotice(`Đã thu cọc ${b.label} · ${name}` + (here ? ', khách đã vào sân.' : '.'));
      },
      cancel: (b) => {
        removeBooking(b.id);
        setNotice(`Đã hủy giữ chỗ của ${b.label} · ${name}, ${hh(b.start)}–${hh(b.start + b.span)}.`);
      },
      lock: () => {
        addBooking({ courtId: s.court.id, start: hour, span: 1, state: 'blocked', label: 'Khóa tạm', sub: 'Lễ tân khóa' });
        setNotice(`Đã khóa ${name} ${hh(hour)}–${hh(hour + 1)}.`);
      },
      unlock: (b) => {
        // Giữ phần đã qua trong lịch, chỉ bỏ phần còn lại
        if (b.start < hour) updateBooking(b.id, { span: hour - b.start });
        else removeBooking(b.id);
        setNotice(`Đã mở khóa ${name} từ ${hh(Math.max(b.start, hour))}.`);
      },
    };
  };

  return (
    <>
      <header className="page-head" style={{ alignItems: 'center' }}>
        <div className="grow">
          <h1 className="page-title">Trạng thái sân</h1>
          <p className="page-sub">
            {TODAY_LABEL} · {isNow ? `Bây giờ ${hm(t)}` : `Đang xem lúc ${hm(t)} (giờ hiện tại ${hh(NOW_HOUR)})`}
          </p>
        </div>
        <div className="cs-clock" role="group" aria-label="Thời điểm xem">
          <button className="btn btn-secondary btn-icon" type="button" aria-label="Lùi 15 phút" disabled={t <= OPEN_HOUR} onClick={() => move(-STEP)}>
            <Icon name="chevronLeft" />
          </button>
          <span className={'cs-clock-time num' + (isNow ? ' now' : '')} aria-live="polite">
            {hm(t)}
          </span>
          <button className="btn btn-secondary btn-icon" type="button" aria-label="Tiến 15 phút" disabled={t >= LAST} onClick={() => move(STEP)}>
            <Icon name="chevronRight" />
          </button>
          <button className="btn btn-secondary" type="button" disabled={isNow} onClick={() => setT(NOW_HOUR)}>
            Bây giờ
          </button>
        </div>
      </header>

      <div className="cs-scrub">
        <span>{hh(OPEN_HOUR)}</span>
        <input
          type="range"
          min={OPEN_HOUR}
          max={LAST}
          step={STEP}
          value={t}
          aria-label="Chọn thời điểm xem"
          aria-valuetext={hm(t)}
          onChange={(e) => setT(Number(e.target.value))}
        />
        <span>{hh(CLOSE_HOUR)}</span>
      </div>

      <div className="cs-sum" role="group" aria-label="Lọc theo trạng thái">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={'card cs-tile' + (group === g.id ? ' on' : '')}
            style={{ '--cs-accent': g.accent } as CSSProperties}
            aria-pressed={group === g.id}
            onClick={() => setGroup(group === g.id ? null : g.id)}
          >
            <span className="lbl">{g.label}</span>
            <span className="kpi-value">{counts[g.id]}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <div role="group" aria-label="Lọc theo môn" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: '1 1 auto' }}>
          {([{ id: 'all', label: 'Tất cả sân' }, ...SPORTS] as { id: SportFilter; label: string }[]).map((f) => (
            <button
              key={f.id}
              type="button"
              className={'chip' + (sport === f.id ? ' on' : '')}
              aria-pressed={sport === f.id}
              onClick={() => setSport(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          {shown.length}/{statuses.length} sân
        </span>
        {group && (
          <button className="btn btn-ghost" type="button" onClick={() => setGroup(null)}>
            Bỏ lọc trạng thái
          </button>
        )}
      </div>

      {notice && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{notice}</span>
        </div>
      )}

      {shown.length ? (
        <div className="cs-grid">
          {shown.map((s) => (
            <CourtCard
              key={s.court.id + ':' + (s.current?.id ?? 'free')}
              s={s}
              t={t}
              canLock={!s.current && isFree(s.court.id, hour, 1)}
              actions={actionsFor(s)}
            />
          ))}
        </div>
      ) : (
        <p className="card muted" style={{ padding: 24, fontSize: 14 }}>
          Không có sân nào ở trạng thái “{GROUPS.find((g) => g.id === group)?.label}” lúc {hm(t)}.
        </p>
      )}
    </>
  );
}

function CourtCard({ s, t, canLock, actions }: { s: CourtStatus; t: number; canLock: boolean; actions: Actions }) {
  const { court, kind, current, next } = s;
  const meta = KIND[kind];
  const [confirmCancel, setConfirmCancel] = useState(false);
  const sportLabel = SPORTS.find((x) => x.id === court.sport)!.label;
  const endingSoon = (kind === 'inUse' || kind === 'class') && s.minutesLeft <= 15;
  const nextIn = next ? Math.round((next.start - t) * 60) : Infinity;
  const nextSoon = !!next && nextIn <= SOON_MINUTES;
  const nextBadge = next && NEXT_BADGE[next.state];
  const titleId = 'cs-' + court.id;

  return (
    <article className="card cs-card" style={{ '--cs-accent': meta.accent } as CSSProperties} aria-labelledby={titleId}>
      <div className="cs-head">
        <div style={{ minWidth: 0 }}>
          <h2 id={titleId} className="cs-name">{court.name}</h2>
          <div className="cs-kind">{sportLabel} · {court.kind}</div>
        </div>
        <span className={'badge ' + meta.badge}>{meta.label}</span>
      </div>

      <div className="cs-main">
        {current ? (
          <>
            <div className="cs-who">
              <b>{current.label}</b>
              {current.sub && <span className="muted">{current.sub}</span>}
            </div>
            <div className="cs-row">
              <span className="muted">{hh(current.start)} – {hh(current.start + current.span)}</span>
              <span className={'cs-left' + (endingSoon ? ' warn' : '')}>
                {kind === 'blocked' ? `Mở lại sau ${fmtDuration(s.minutesLeft)}` : `Còn ${fmtDuration(s.minutesLeft)}`}
              </span>
            </div>
            <div
              className="meter"
              role="progressbar"
              aria-label="Thời gian đã qua của lượt"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(s.progress * 100)}
            >
              <div style={{ width: `${s.progress * 100}%`, background: meta.accent }} />
            </div>
            {kind === 'inUse' &&
              (current.checkedIn ? (
                <p className="cs-note ok"><Icon name="check" size={16} /> Đã check-in{endingSoon && ' · sắp hết giờ'}</p>
              ) : (
                <p className="cs-note warn">Khách chưa check-in</p>
              ))}
            {kind === 'pending' && <p className="cs-note warn">Chưa thu cọc – thu cọc trước khi cho vào sân.</p>}
          </>
        ) : (
          <>
            <span className="cs-big num">{next ? `Trống đến ${hh(next.start)}` : 'Trống đến hết ngày'}</span>
            <span className="muted" style={{ fontSize: 14 }}>
              {kind === 'soon' ? `Lượt kế tiếp bắt đầu sau ${fmtDuration(s.minutesLeft)}` : `Còn trống ${fmtDuration(s.minutesLeft)}`}
            </span>
          </>
        )}
      </div>

      <div className="cs-next">
        <span className="lbl">Tiếp theo</span>
        {next ? (
          <span className="cs-next-body">
            <b className="num" style={{ fontSize: 17 }}>{hh(next.start)}–{hh(next.start + next.span)}</b>
            <span>{next.label}</span>
            {nextBadge && <span className={'badge ' + nextBadge.badge}>{nextBadge.label}</span>}
            {next.checkedIn && <span className="badge b-success">Đã check-in</span>}
          </span>
        ) : (
          <span className="muted">Không còn lịch hôm nay</span>
        )}
      </div>

      <div className="cs-actions">
        {kind === 'inUse' && !current!.checkedIn && (
          <button className="btn btn-primary" type="button" onClick={() => actions.checkIn(current!)}>
            Check-in
          </button>
        )}
        {kind === 'pending' && (
          <>
            <button className="btn btn-primary" type="button" onClick={() => actions.deposit(current!, true)}>
              Thu cọc &amp; check-in
            </button>
            <button
              className={'btn ' + (confirmCancel ? 'btn-danger' : 'btn-secondary')}
              type="button"
              onClick={() => (confirmCancel ? actions.cancel(current!) : setConfirmCancel(true))}
            >
              {confirmCancel ? 'Xác nhận hủy' : 'Hủy giữ chỗ'}
            </button>
          </>
        )}
        {kind === 'blocked' && (
          <button className="btn btn-secondary" type="button" onClick={() => actions.unlock(current!)}>
            <Icon name="lock" /> Mở khóa
          </button>
        )}
        {nextSoon && next!.state === 'booked' && !next!.checkedIn && (
          <button className={'btn ' + (kind === 'soon' ? 'btn-primary' : 'btn-secondary')} type="button" onClick={() => actions.checkIn(next!)}>
            Check-in sớm
          </button>
        )}
        {nextSoon && next!.state === 'pending' && (
          <button className="btn btn-secondary" type="button" onClick={() => actions.deposit(next!, false)}>
            Thu cọc lượt kế tiếp
          </button>
        )}
        {!current && (
          <Link className={'btn ' + (kind === 'free' ? 'btn-primary' : 'btn-secondary')} to={`/lich-dat-san?san=${court.id}&gio=${Math.floor(t)}`}>
            Đặt ngay
          </Link>
        )}
        {canLock && (
          <button className="btn btn-secondary" type="button" onClick={actions.lock}>
            <Icon name="lock" /> Khóa 1 giờ
          </button>
        )}
        <Link className="btn btn-ghost cs-cal" to={`/lich-dat-san?san=${court.id}`}>
          Lịch sân <Icon name="chevronRight" />
        </Link>
      </div>
    </article>
  );
}
