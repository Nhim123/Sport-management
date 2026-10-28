import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';

export type IconName =
  | 'home' | 'calendar' | 'dumbbell' | 'person' | 'coach' | 'renew' | 'bell' | 'qr' | 'chevronLeft' | 'timer' | 'check'
  | 'users' | 'trophy' | 'tag' | 'idcard' | 'chart' | 'activity' | 'search' | 'plus' | 'chevronRight' | 'lock' | 'phone' | 'grid' | 'swap' | 'close'
  | 'badminton' | 'pickleball' | 'tennis' | 'football';

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
      {name === 'users' && <Path {...p} d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-6" />}
      {name === 'trophy' && <Path {...p} d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />}
      {name === 'tag' && (
        <>
          <Path {...p} d="M20 12l-8 8-9-9V3h8z" />
          <Circle {...p} cx={7.5} cy={7.5} r={1.5} />
        </>
      )}
      {name === 'idcard' && (
        <>
          <Rect {...p} x={3} y={5} width={18} height={14} rx={2} />
          <Circle {...p} cx={9} cy={11} r={2.5} />
          <Path {...p} d="M5.5 16.5c.6-1.6 1.9-2.5 3.5-2.5s2.9.9 3.5 2.5M14 9h5M14 12h5M14 15h3" />
        </>
      )}
      {name === 'chart' && <Path {...p} d="M4 20V10M10 20V4M16 20v-8M22 20H2" />}
      {name === 'activity' && <Path {...p} d="M3 12h4l3-8 4 16 3-8h4" />}
      {name === 'search' && (
        <>
          <Circle {...p} cx={11} cy={11} r={7} />
          <Path {...p} d="M20 20l-4-4" />
        </>
      )}
      {name === 'plus' && <Path {...p} d="M12 5v14M5 12h14" />}
      {name === 'chevronRight' && <Path {...p} d="M9 6l6 6-6 6" />}
      {name === 'lock' && (
        <>
          <Rect {...p} x={4} y={11} width={16} height={10} rx={2} />
          <Path {...p} d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      )}
      {name === 'phone' && <Path {...p} d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />}
      {name === 'grid' && <Path {...p} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />}
      {name === 'swap' && <Path {...p} d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />}
      {name === 'close' && <Path {...p} d="M6 6l12 12M18 6 6 18" />}
      {name === 'badminton' && (
        <>
          <Circle {...p} cx={12} cy={18.5} r={2.5} />
          <Path {...p} d="M9.8 17.2 6 4h12l-3.8 13.2M10 4l1.2 12.2M14 4l-1.2 12.2M7 8h10" />
        </>
      )}
      {name === 'pickleball' && (
        <>
          <Rect {...p} x={3} y={2.5} width={11} height={12} rx={4.5} />
          <Path {...p} d="M8.5 14.5V21" />
          <Circle {...p} cx={18} cy={17.5} r={3} />
        </>
      )}
      {name === 'tennis' && (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M6 4.6c2.5 2 3.8 4.6 3.8 7.4S8.5 17.4 6 19.4M18 4.6c-2.5 2-3.8 4.6-3.8 7.4s1.3 5.4 3.8 7.4" />
        </>
      )}
      {name === 'football' && (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="m12 7.5 4 2.9-1.5 4.6h-5L8 10.4zM12 7.5V3M16 10.4l4.2-1.4M14.5 15l2.6 3.6M9.5 15l-2.6 3.6M8 10.4 3.8 9" />
        </>
      )}
    </Svg>
  );
}
