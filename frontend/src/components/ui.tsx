import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { fonts, radius, useColors } from '../theme/tokens';
import { Icon } from './Icon';

/** Chữ mặc định: Be Vietnam Pro, màu ink */
export function T({
  children,
  w = 400,
  size = 15,
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  w?: 400 | 500 | 600 | 700;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const c = useColors();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: fonts[`sans${w}`], fontSize: size, lineHeight: Math.round(size * 1.45), color: color ?? c.ink }, style]}
    >
      {children}
    </Text>
  );
}

/** Số / tiêu đề: Barlow Condensed */
export function Num({ children, size = 22, w = 700, color, style }: { children: ReactNode; size?: number; w?: 600 | 700; color?: string; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return (
    <Text style={[{ fontFamily: fonts[`display${w}`], fontSize: size, lineHeight: Math.round(size * 1.1), color: color ?? c.ink, fontVariant: ['tabular-nums'] }, style]}>
      {children}
    </Text>
  );
}

export function Label({ children, color }: { children: ReactNode; color?: string }) {
  const c = useColors();
  return (
    <Text style={{ fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16, letterSpacing: 0.5, textTransform: 'uppercase', color: color ?? c.inkMuted }}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ padding: 14, borderRadius: radius.lg, backgroundColor: c.surfaceRaised, borderWidth: 1, borderColor: c.line }, style]}>{children}</View>;
}

export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [styles.back, pressed && { backgroundColor: c.surfaceSunken }]}
      >
        <Icon name="chevronLeft" color={c.ink} />
      </Pressable>
      <Text style={{ flex: 1, fontFamily: fonts.display700, fontSize: 28, lineHeight: 32, color: c.ink }}>{title}</Text>
      {right}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, style }: { label: string; onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: pressed ? c.brandStrong : c.brand, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.sans700, fontSize: 15, color: c.onBrand }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingHorizontal: 12, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  primary: { height: 48, paddingHorizontal: 22, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
