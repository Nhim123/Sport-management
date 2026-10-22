import { Fragment } from 'react';
import type { Booking, Court, SlotState } from '../data/mock';
import { hh, vndShort } from '../lib/format';
import { Icon } from './Icon';
import { SportBadge, sportLabel } from './SportIcon';

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
  showPrice?: boolean;
  dense?: boolean;
  selected?: { courtId: string; hour: number; span: number } | null;
  onPick?: (courtId: string, hour: number) => void;
  /** Chế độ tùy chỉnh: bấm vào tên sân để sửa */
  onCourtClick?: (courtId: string) => void;
  activeCourtId?: string | null;
}

export function BookingGrid({
  courts,
  bookings,
  from,
  to,
  nowHour,
  size = 'sm',
  showKind,
  showPrice,
  dense,
  selected,
  onPick,
  onCourtClick,
  activeCourtId,
}: Props) {
  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  const courtCol = size === 'lg' ? 196 : 156;
  const minCol = size === 'lg' ? 80 : 84;

  return (
    <div className="grid-scroll">
      <div
        className={'bgrid' + (size === 'lg' ? ' lg' : '') + (dense ? ' dense' : '')}
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

        {courts.length === 0 && (
          <p className="muted" style={{ gridColumn: '1 / -1', padding: '16px 4px', fontSize: 14 }}>
            Không có sân nào để hiển thị. Bật lại sân trong “Tùy chỉnh sân”.
          </p>
        )}

        {courts.map((c) => {
          const cells: JSX.Element[] = [];
          let h = from;
          while (h < to) {
            const b = bookings.find((x) => x.courtId === c.id && x.start <= h && h < x.start + x.span);
            if (b) {
              // Lượt khóa cả ngày (sân tạm ngừng) dừng trước lượt thật kế tiếp để lễ tân vẫn thấy khách đã đặt
              const nextStart = bookings
                .filter((x) => x.courtId === c.id && x !== b && x.start > h)
                .reduce((m, x) => Math.min(m, x.start), Infinity);
              const span = Math.min(b.start + b.span, to, nextStart) - h;
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

          const sub = [showKind && c.kind, showPrice && `${vndShort(c.price)}/giờ`].filter(Boolean).join(' · ');
          const inner = (
            <>
              <SportBadge sport={c.sport} size={size === 'lg' && !dense ? 34 : 28} />
              <span className="court-meta">
                <span className="court-name">
                  {c.name}
                  {c.locked && <Icon name="lock" size={12} />}
                </span>
                {sub && <span className="court-sub">{sub}</span>}
              </span>
            </>
          );
          const label = `${c.name}, ${sportLabel(c.sport)}${c.locked ? ', tạm ngừng' : ''}`;

          return (
            <Fragment key={c.id}>
              {onCourtClick ? (
                <button
                  type="button"
                  className={'court-cell' + (c.locked ? ' locked' : '') + (activeCourtId === c.id ? ' on' : '')}
                  aria-label={`Tùy chỉnh ${label}`}
                  aria-pressed={activeCourtId === c.id}
                  onClick={() => onCourtClick(c.id)}
                >
                  {inner}
                </button>
              ) : (
                <div className={'court-cell' + (c.locked ? ' locked' : '')} title={label}>
                  {inner}
                </div>
              )}
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
      <span className="badge b-neutral">Bảo trì / Tạm ngừng</span>
      {withSelected && <span className="badge b-volt">Đang chọn</span>}
    </div>
  );
}
