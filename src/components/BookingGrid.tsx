import { Fragment } from 'react';
import type { Booking, Court, SlotState } from '../data/mock';
import { hh } from '../lib/format';

const STATE_LABEL: Record<SlotState | 'free', string> = {
  booked: 'Đã đặt',
  class: 'Lớp học',
  pending: 'Chờ cọc',
  blocked: 'Bảo trì',
  free: 'Trống',
};

interface Props {
  courts: Court[];
  bookings: Booking[];
  from: number;
  to: number; // giờ kết thúc (không gồm)
  nowHour?: number;
  size?: 'sm' | 'lg';
  showKind?: boolean;
  selected?: { courtId: string; hour: number; span: number } | null;
  onPick?: (courtId: string, hour: number) => void;
}

export function BookingGrid({ courts, bookings, from, to, nowHour, size = 'sm', showKind, selected, onPick }: Props) {
  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  const courtCol = size === 'lg' ? 140 : 128;
  const minCol = size === 'lg' ? 80 : 84;

  return (
    <div className="grid-scroll">
      <div
        className={'bgrid' + (size === 'lg' ? ' lg' : '')}
        style={{
          gridTemplateColumns: `${courtCol}px repeat(${hours.length}, minmax(${minCol}px, 1fr))`,
          minWidth: courtCol + hours.length * (minCol + 4),
        }}
      >
        <span className="lbl" style={{ padding: '8px 4px' }}>Sân</span>
        {hours.map((h) => (
          <span key={h} className={'lbl hour' + (h === nowHour ? ' now' : '')}>
            {hh(h)}
          </span>
        ))}

        {courts.map((c) => {
          const cells: JSX.Element[] = [];
          let h = from;
          while (h < to) {
            const b = bookings.find((x) => x.courtId === c.id && x.start <= h && h < x.start + x.span);
            if (b) {
              const span = Math.min(b.start + b.span, to) - h;
              cells.push(
                <div
                  key={h}
                  className={'slot s-' + b.state}
                  style={{ gridColumn: `span ${span}` }}
                  title={`${c.name} ${hh(h)} – ${STATE_LABEL[b.state]}: ${b.label}`}
                >
                  <b>{b.label}</b>
                  {b.sub && <span>{b.sub}</span>}
                </div>,
              );
              h += span;
              continue;
            }
            const hour = h;
            const isSel = !!selected && selected.courtId === c.id && hour >= selected.hour && hour < selected.hour + selected.span;
            const aria = `${c.name} ${hh(hour)} – ${isSel ? 'Đang chọn' : STATE_LABEL.free}`;
            cells.push(
              onPick ? (
                <button
                  key={hour}
                  type="button"
                  className={'slot ' + (isSel ? 's-sel' : 's-free')}
                  aria-label={aria}
                  aria-pressed={isSel}
                  onClick={() => onPick(c.id, hour)}
                >
                  <b>{isSel && hour === selected!.hour ? 'Đang chọn' : isSel ? '' : '+'}</b>
                  {isSel && hour === selected!.hour && <span>{hh(hour)}</span>}
                </button>
              ) : (
                <div key={hour} className="slot s-free" aria-label={aria}>
                  <b>+</b>
                </div>
              ),
            );
            h += 1;
          }
          return (
            <Fragment key={c.id}>
              <div className="court-cell">
                <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                {showKind && <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{c.kind}</span>}
              </div>
              {cells}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function BookingLegend({ withSelected }: { withSelected?: boolean }) {
  return (
    <div className="legend">
      <span className="badge b-success">Đã đặt</span>
      <span className="badge b-class">Lớp học / PT</span>
      <span className="badge b-warning">Chờ cọc</span>
      <span className="badge b-neutral">Bảo trì</span>
      {withSelected && <span className="badge b-volt">Đang chọn</span>}
    </div>
  );
}
