import type { Sport } from '../data/mock';
import type { CourtStatusKind } from '../lib/courtStatus';
import { Icon } from './Icon';
import { SportBadge } from './SportIcon';

// Màu mặt sân minh hoạ – cố định, không đổi theo giao diện
const SURFACE: Record<Sport, { out: string; court: string }> = {
  cl: { out: '#245f45', court: '#2f7d5b' },
  pb: { out: '#1f4f7d', court: '#2e6fa8' },
  tn: { out: '#5f8f4f', court: '#3b6fb6' },
  bd: { out: '#2f7a34', court: '#3c8d40' },
  br: { out: '#8a5a2b', court: '#c58b4c' },
  bc: { out: '#1f5d8c', court: '#e0894a' },
};

const L = { stroke: '#fff', strokeWidth: 1.4, fill: 'none' };
const NET = { stroke: '#e8e8e8', strokeWidth: 2.6, strokeDasharray: '2 1.5' };

/** Vạch kẻ sân theo môn – khung 180×100 */
function Markings({ sport }: { sport: Sport }) {
  switch (sport) {
    case 'cl':
      return (
        <g>
          <rect x={10} y={10} width={160} height={80} {...L} />
          <path d="M10 16H170M10 84H170M18 10V90M162 10V90M66 10V90M114 10V90M10 50H66M114 50H170" {...L} />
          <line x1={90} y1={6} x2={90} y2={94} {...NET} />
        </g>
      );
    case 'pb':
      return (
        <g>
          <rect x={62} y={10} width={56} height={80} fill="#5b93c9" opacity={0.55} />
          <rect x={10} y={10} width={160} height={80} {...L} />
          <path d="M62 10V90M118 10V90M10 50H62M118 50H170" {...L} />
          <line x1={90} y1={6} x2={90} y2={94} {...NET} />
        </g>
      );
    case 'tn':
      return (
        <g>
          <rect x={10} y={8} width={160} height={84} {...L} />
          <path d="M10 18H170M10 82H170M50 18V82M130 18V82M50 50H130M10 50H14M166 50H170" {...L} />
          <line x1={90} y1={4} x2={90} y2={96} {...NET} />
        </g>
      );
    case 'bd':
      return (
        <g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={10 + i * 20} y={8} width={10} height={84} fill="#fff" opacity={0.06} />
          ))}
          <rect x={10} y={8} width={160} height={84} {...L} />
          <line x1={90} y1={8} x2={90} y2={92} {...L} />
          <circle cx={90} cy={50} r={13} {...L} />
          <circle cx={90} cy={50} r={1.6} fill="#fff" />
          <rect x={10} y={28} width={24} height={44} {...L} />
          <rect x={146} y={28} width={24} height={44} {...L} />
          <rect x={4} y={40} width={6} height={20} {...L} />
          <rect x={170} y={40} width={6} height={20} {...L} />
        </g>
      );
    case 'br':
      return (
        <g>
          <rect x={10} y={38} width={30} height={24} fill="#a8312f" opacity={0.55} />
          <rect x={140} y={38} width={30} height={24} fill="#a8312f" opacity={0.55} />
          <rect x={10} y={8} width={160} height={84} {...L} />
          <line x1={90} y1={8} x2={90} y2={92} {...L} />
          <circle cx={90} cy={50} r={11} {...L} />
          <rect x={10} y={38} width={30} height={24} {...L} />
          <rect x={140} y={38} width={30} height={24} {...L} />
          <path d="M10 14H24A36 36 0 0 1 24 86H10M170 14H156A36 36 0 0 0 156 86H170" {...L} />
          <circle cx={18} cy={50} r={2.4} fill="none" stroke="#ff7a1a" strokeWidth={1.4} />
          <circle cx={162} cy={50} r={2.4} fill="none" stroke="#ff7a1a" strokeWidth={1.4} />
        </g>
      );
    case 'bc':
      return (
        <g>
          <rect x={10} y={10} width={160} height={80} {...L} />
          <path d="M63 10V90M117 10V90" {...L} />
          <line x1={90} y1={6} x2={90} y2={94} {...NET} />
        </g>
      );
  }
}

/** Vị trí người chơi minh hoạ khi sân đang được dùng */
const PLAYERS: Record<Sport, [number, number][]> = {
  cl: [[45, 32], [45, 68], [135, 32], [135, 68]],
  pb: [[38, 32], [38, 68], [142, 32], [142, 68]],
  tn: [[30, 50], [150, 50]],
  bd: [[24, 50], [52, 30], [52, 70], [74, 50], [106, 50], [128, 30], [128, 70], [156, 50]],
  br: [[30, 34], [30, 66], [60, 50], [120, 50], [150, 34], [150, 66]],
  bc: [[40, 30], [40, 70], [75, 50], [105, 50], [140, 30], [140, 70]],
};

/** Hình sân nhìn từ trên xuống, phủ màu theo trạng thái; logo môn ở góc */
export function CourtArt({ sport, kind, label }: { sport: Sport; kind: CourtStatusKind; label?: string }) {
  const s = SURFACE[sport];
  const playing = kind === 'inUse' || kind === 'class';
  const overlay =
    kind === 'pending' ? { fill: 'var(--warning)', opacity: 0.38 } :
    kind === 'blocked' ? { fill: '#000', opacity: 0.5 } :
    kind === 'class' ? { fill: 'var(--clay)', opacity: 0.25 } :
    { fill: '#fff', opacity: kind === 'inUse' ? 0 : 0.12 };

  return (
    <div className="cs-art" role="img" aria-label={label}>
      <svg viewBox="0 0 180 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width={180} height={100} fill={s.out} />
        <rect x={10} y={8} width={160} height={84} fill={s.court} />
        <Markings sport={sport} />
        {playing &&
          PLAYERS[sport].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={sport === 'bd' ? 3.6 : 4.4} fill={x < 90 ? 'var(--volt)' : '#fff'} stroke="#0d100e" strokeWidth={1} />
          ))}
        <rect width={180} height={100} fill={overlay.fill} opacity={overlay.opacity} />
        {(kind === 'blocked' || kind === 'pending') &&
          Array.from({ length: 14 }, (_, i) => (
            <line
              key={i}
              x1={i * 16 - 40}
              y1={100}
              x2={i * 16 + 60}
              y2={0}
              stroke={kind === 'blocked' ? '#fff' : 'var(--warning)'}
              strokeWidth={kind === 'blocked' ? 3 : 4}
              opacity={kind === 'blocked' ? 0.12 : 0.35}
            />
          ))}
      </svg>
      <span className="cs-art-logo">
        <SportBadge sport={sport} size={30} />
      </span>
      {kind === 'blocked' && (
        <span className="cs-art-lock">
          <Icon name="lock" size={20} />
        </span>
      )}
    </div>
  );
}
