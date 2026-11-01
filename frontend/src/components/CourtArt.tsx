// Hình sân nhìn từ trên xuống cho từng môn, phủ màu theo trạng thái lúc này.
import { View } from 'react-native';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import type { CourtLiveKind } from '../types/admin';
import type { Sport } from '../types/domain';
import { useColors } from '../theme/tokens';
import { Icon } from './Icon';

// Màu mặt sân minh hoạ (giữ cố định, không theo token giao diện)
const SURFACE: Record<Sport, { out: string; court: string }> = {
  cl: { out: '#245f45', court: '#2f7d5b' },
  pb: { out: '#1f4f7d', court: '#2e6fa8' },
  tn: { out: '#5f8f4f', court: '#3b6fb6' },
  bd: { out: '#2f7a34', court: '#3c8d40' },
};
const LINE = '#ffffff';

/** Vạch kẻ sân theo môn – khung 180×100 */
function Markings({ sport }: { sport: Sport }) {
  const l = { stroke: LINE, strokeWidth: 1.4 };
  switch (sport) {
    case 'cl':
      return (
        <G>
          <Rect x={10} y={10} width={160} height={80} fill="none" {...l} />
          <Line x1={10} y1={16} x2={170} y2={16} {...l} />
          <Line x1={10} y1={84} x2={170} y2={84} {...l} />
          <Line x1={18} y1={10} x2={18} y2={90} {...l} />
          <Line x1={162} y1={10} x2={162} y2={90} {...l} />
          <Line x1={66} y1={10} x2={66} y2={90} {...l} />
          <Line x1={114} y1={10} x2={114} y2={90} {...l} />
          <Line x1={10} y1={50} x2={66} y2={50} {...l} />
          <Line x1={114} y1={50} x2={170} y2={50} {...l} />
          <Line x1={90} y1={6} x2={90} y2={94} stroke="#e8e8e8" strokeWidth={2.6} strokeDasharray="2 1.5" />
        </G>
      );
    case 'pb':
      return (
        <G>
          <Rect x={10} y={10} width={160} height={80} fill="none" {...l} />
          <Rect x={62} y={10} width={56} height={80} fill="#5b93c9" opacity={0.55} />
          <Line x1={62} y1={10} x2={62} y2={90} {...l} />
          <Line x1={118} y1={10} x2={118} y2={90} {...l} />
          <Line x1={10} y1={50} x2={62} y2={50} {...l} />
          <Line x1={118} y1={50} x2={170} y2={50} {...l} />
          <Line x1={90} y1={6} x2={90} y2={94} stroke="#e8e8e8" strokeWidth={2.6} strokeDasharray="2 1.5" />
        </G>
      );
    case 'tn':
      return (
        <G>
          <Rect x={10} y={8} width={160} height={84} fill="none" {...l} />
          <Line x1={10} y1={18} x2={170} y2={18} {...l} />
          <Line x1={10} y1={82} x2={170} y2={82} {...l} />
          <Line x1={50} y1={18} x2={50} y2={82} {...l} />
          <Line x1={130} y1={18} x2={130} y2={82} {...l} />
          <Line x1={50} y1={50} x2={130} y2={50} {...l} />
          <Line x1={10} y1={50} x2={14} y2={50} {...l} />
          <Line x1={166} y1={50} x2={170} y2={50} {...l} />
          <Line x1={90} y1={4} x2={90} y2={96} stroke="#e8e8e8" strokeWidth={2.6} strokeDasharray="2 1.5" />
        </G>
      );
    case 'bd':
      return (
        <G>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Rect key={i} x={10 + i * 20} y={8} width={10} height={84} fill="#ffffff" opacity={0.06} />
          ))}
          <Rect x={10} y={8} width={160} height={84} fill="none" {...l} />
          <Line x1={90} y1={8} x2={90} y2={92} {...l} />
          <Circle cx={90} cy={50} r={13} fill="none" {...l} />
          <Circle cx={90} cy={50} r={1.6} fill={LINE} />
          <Rect x={10} y={28} width={24} height={44} fill="none" {...l} />
          <Rect x={146} y={28} width={24} height={44} fill="none" {...l} />
          <Rect x={4} y={40} width={6} height={20} fill="none" {...l} />
          <Rect x={170} y={40} width={6} height={20} fill="none" {...l} />
        </G>
      );
  }
}

/** Vị trí người chơi minh hoạ khi sân đang được dùng */
const PLAYERS: Record<Sport, [number, number][]> = {
  cl: [[45, 32], [45, 68], [135, 32], [135, 68]],
  pb: [[38, 32], [38, 68], [142, 32], [142, 68]],
  tn: [[30, 50], [150, 50]],
  bd: [[24, 50], [52, 30], [52, 70], [74, 50], [106, 50], [128, 30], [128, 70], [156, 50]],
};

/** Hình sân + lớp phủ trạng thái, tỉ lệ 1.8:1; không truyền `height` thì giãn hết chiều ngang */
export function CourtArt({ sport, kind, height }: { sport: Sport; kind: CourtLiveKind; height?: number }) {
  const c = useColors();
  const s = SURFACE[sport];
  const playing = kind === 'inUse' || kind === 'class';
  const overlay =
    kind === 'pending' ? { fill: c.warning, opacity: 0.38 } :
    kind === 'blocked' ? { fill: '#000000', opacity: 0.5 } :
    kind === 'class' ? { fill: c.clay, opacity: 0.25 } :
    kind === 'free' || kind === 'soon' ? { fill: '#ffffff', opacity: 0.12 } :
    null;

  return (
    <View style={[height ? { height } : { width: '100%' }, { aspectRatio: 1.8, borderRadius: 10, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 180 100" preserveAspectRatio="xMidYMid slice">
        <Rect x={0} y={0} width={180} height={100} fill={s.out} />
        <Rect x={10} y={8} width={160} height={84} fill={s.court} />
        <Markings sport={sport} />
        {playing &&
          PLAYERS[sport].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={sport === 'bd' ? 3.6 : 4.6} fill={x < 90 ? c.volt : '#ffffff'} stroke="#0d100e" strokeWidth={1} />
          ))}
        {overlay && <Rect x={0} y={0} width={180} height={100} fill={overlay.fill} opacity={overlay.opacity} />}
        {kind === 'blocked' &&
          Array.from({ length: 14 }, (_, i) => <Line key={i} x1={i * 16 - 40} y1={100} x2={i * 16 + 60} y2={0} stroke="#ffffff" strokeWidth={3} opacity={0.12} />)}
        {kind === 'pending' &&
          Array.from({ length: 14 }, (_, i) => <Line key={i} x1={i * 16 - 40} y1={100} x2={i * 16 + 60} y2={0} stroke={c.warning} strokeWidth={4} opacity={0.35} />)}
      </Svg>
      {kind === 'blocked' && (
        <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={20} color="#ffffff" />
          </View>
        </View>
      )}
    </View>
  );
}
