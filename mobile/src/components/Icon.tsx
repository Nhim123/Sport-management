import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';

export type IconName = 'home' | 'calendar' | 'dumbbell' | 'person' | 'coach' | 'renew' | 'bell' | 'qr' | 'chevronLeft' | 'timer' | 'check';

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: ColorValue }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path {...p} d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />}
      {name === 'calendar' && (
        <>
          <Rect {...p} x={3} y={5} width={18} height={16} rx={2} />
          <Path {...p} d="M16 3v4M8 3v4M3 11h18" />
        </>
      )}
      {name === 'dumbbell' && <Path {...p} d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12" />}
      {name === 'person' && (
        <>
          <Circle {...p} cx={12} cy={8} r={4} />
          <Path {...p} d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </>
      )}
      {name === 'coach' && (
        <>
          <Circle {...p} cx={12} cy={7} r={4} />
          <Path {...p} d="M5 21c0-4 3-7 7-7s7 3 7 7" />
        </>
      )}
      {name === 'renew' && <Path {...p} d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />}
      {name === 'bell' && <Path {...p} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />}
      {name === 'qr' && (
        <>
          <Rect {...p} x={3} y={3} width={7} height={7} />
          <Rect {...p} x={14} y={3} width={7} height={7} />
          <Rect {...p} x={3} y={14} width={7} height={7} />
          <Path {...p} d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
        </>
      )}
      {name === 'chevronLeft' && <Path {...p} d="M15 6l-6 6 6 6" />}
      {name === 'timer' && (
        <>
          <Circle {...p} cx={12} cy={13} r={8} />
          <Path {...p} d="M12 9v4l2 2M9 2h6" />
        </>
      )}
      {name === 'check' && <Path {...p} d="M5 12l5 5L20 7" />}
    </Svg>
  );
}
