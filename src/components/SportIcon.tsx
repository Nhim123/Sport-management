import { SPORTS, type Sport } from '../data/mock';
import { Icon, type IconName } from './Icon';

/** Biểu tượng + màu nhận diện từng môn. Màu chỉ để nhận nhanh – luôn đi kèm tên môn/sân dạng chữ. */
export const SPORT_STYLE: Record<Sport, { icon: IconName; bg: string; fg: string }> = {
  cl: { icon: 'badminton', bg: 'var(--brand-tint)', fg: 'var(--brand-ink)' },
  pb: { icon: 'pickleball', bg: 'var(--info-tint)', fg: 'var(--info)' },
  tn: { icon: 'tennis', bg: 'var(--volt)', fg: 'var(--on-volt)' },
  bd: { icon: 'football', bg: 'var(--clay-tint)', fg: 'var(--clay-ink)' },
  br: { icon: 'basketball', bg: 'var(--warning-tint)', fg: 'var(--warning)' },
  bc: { icon: 'volleyball', bg: 'var(--surface-sunken)', fg: 'var(--ink)' },
};

export const sportLabel = (s: Sport) => SPORTS.find((x) => x.id === s)?.label ?? s;

export function SportBadge({ sport, size = 36 }: { sport: Sport; size?: number }) {
  const s = SPORT_STYLE[sport];
  return (
    <span className="sport-badge" style={{ width: size, height: size, background: s.bg, color: s.fg }} aria-hidden="true">
      <Icon name={s.icon} size={Math.round(size * 0.62)} />
    </span>
  );
}
