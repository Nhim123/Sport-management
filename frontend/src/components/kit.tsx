// Bộ component giao diện cho chế độ quản lý (dựa trên token Arena).
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Tone } from '../types/admin';
import type { Activity } from '../types/domain';
import { fonts, radius, useColors, type Colors } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Num, T } from './ui';

export function toneColors(c: Colors, tone: Tone) {
  switch (tone) {
    case 'success': return { bg: c.brandTint, fg: c.brandInk };
    case 'warning': return { bg: c.warningTint, fg: c.warning };
    case 'danger': return { bg: c.dangerTint, fg: c.danger };
    case 'class': return { bg: c.clayTint, fg: c.clayInk };
    case 'info': return { bg: c.infoTint, fg: c.info };
    case 'volt': return { bg: c.volt, fg: c.onVolt };
    default: return { bg: c.surfaceSunken, fg: c.inkMuted };
  }
}

export const initials = (name: string) => {
  const p = name.trim().split(/\s+/);
  return ((p.length > 1 ? p[p.length - 2][0] : '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase();
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const c = useColors();
  const t = toneColors(c, tone);
  return (
    <View style={[s.badge, { backgroundColor: t.bg }]}>
      <T size={11} w={600} color={t.fg}>{label}</T>
    </View>
  );
}

/** Logo & tên từng môn */
export const SPORT_ICON: Record<Activity, { icon: IconName; tone: Tone; label: string }> = {
  cl: { icon: 'badminton', tone: 'success', label: 'Cầu lông' },
  pb: { icon: 'pickleball', tone: 'info', label: 'Pickleball' },
  tn: { icon: 'tennis', tone: 'volt', label: 'Tennis' },
  bd: { icon: 'football', tone: 'class', label: 'Bóng đá' },
  gym: { icon: 'dumbbell', tone: 'neutral', label: 'Gym' },
  yoga: { icon: 'yoga', tone: 'class', label: 'Yoga' },
  hiit: { icon: 'hiit', tone: 'danger', label: 'HIIT' },
  swim: { icon: 'swim', tone: 'info', label: 'Bơi' },
  pt: { icon: 'whistle', tone: 'warning', label: 'PT cá nhân' },
};

export function SportBadge({ sport, size = 36 }: { sport: Activity; size?: number }) {
  const c = useColors();
  const { icon, tone } = SPORT_ICON[sport];
  const t = toneColors(c, tone);
  return (
    <View accessibilityLabel={SPORT_ICON[sport].label} style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={Math.round(size * 0.6)} color={t.fg} />
    </View>
  );
}

export function Avatar({ name, size = 40, ring }: { name: string; size?: number; ring?: boolean }) {
  const c = useColors();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center',
        borderWidth: ring ? 2 : 0, borderColor: c.volt,
      }}
    >
      <T size={Math.round(size * 0.32)} w={700} color={c.brandInk}>{initials(name)}</T>
    </View>
  );
}

/** Khung màn hình: tiêu đề lớn, nút quay lại tùy chọn, nội dung cuộn */
export function Screen({
  title, sub, back, right, children, footer, scroll = true,
}: { title: string; sub?: string; back?: boolean; right?: ReactNode; children: ReactNode; footer?: ReactNode; scroll?: boolean }) {
  const c = useColors();
  const body = <View style={s.body}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.surface }}>
      <View style={s.head}>
        {back && (
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/quan-ly' as Href))} style={s.back}>
            <Icon name="chevronLeft" color={c.ink} />
          </Pressable>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Num size={28}>{title}</Num>
          {sub ? <T size={13} color={c.inkMuted} numberOfLines={1}>{sub}</T> : null}
        </View>
        {right}
      </View>
      {scroll ? <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">{body}</ScrollView> : <View style={{ flex: 1 }}>{body}</View>}
      {footer}
    </SafeAreaView>
  );
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const c = useColors();
  return (
    <View style={s.between}>
      <T size={17} w={700}>{title}</T>
      {action && onAction ? (
        <Pressable accessibilityRole="link" onPress={onAction} hitSlop={8}>
          <T size={13} w={600} color={c.brand}>{action}</T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, on, onPress, count, left }: { label: string; on?: boolean; onPress: () => void; count?: number; left?: ReactNode }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={[s.chip, { borderColor: on ? c.ink : c.lineStrong, backgroundColor: on ? c.ink : c.surfaceRaised }]}
    >
      {left}
      <T size={13} w={600} color={on ? c.surface : c.ink}>{label}</T>
      {count !== undefined && <T size={12} color={on ? c.surface : c.inkMuted}>{count}</T>}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
      {children}
    </ScrollView>
  );
}

export function Segmented<V extends string | number>({ options, value, onChange }: { options: { id: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" style={[s.seg, { backgroundColor: c.surfaceSunken, borderColor: c.line }]}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={String(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.id)}
            style={[s.segBtn, on && { backgroundColor: c.surfaceRaised }]}
          >
            <T size={13} w={600} color={on ? c.ink : c.inkMuted}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatTile({ label, value, hint, hintColor, highlight, style }: { label: string; value: string; hint?: string; hintColor?: string; highlight?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[s.tile, { backgroundColor: c.surfaceRaised, borderColor: c.line }, highlight && { borderTopWidth: 4, borderTopColor: c.volt }, style]}>
      <T size={11} w={600} color={c.inkMuted} style={{ textTransform: 'uppercase', letterSpacing: 0.4 }} numberOfLines={1}>{label}</T>
      <Num size={24} w={600}>{value}</Num>
      {hint ? <T size={12} color={hintColor ?? c.inkMuted} numberOfLines={2}>{hint}</T> : null}
    </View>
  );
}

export function Bar({ pct, color, height = 6 }: { pct: number; color?: string; height?: number }) {
  const c = useColors();
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: c.surfaceSunken, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height, backgroundColor: color ?? c.brand }} />
    </View>
  );
}

export function Banner({ text, tone = 'success' }: { text: string; tone?: Tone }) {
  const c = useColors();
  const t = toneColors(c, tone);
  return (
    <View accessibilityRole="alert" style={[s.banner, { backgroundColor: t.bg }]}>
      <Icon name={tone === 'success' ? 'check' : tone === 'danger' ? 'alert' : 'timer'} size={18} color={t.fg} />
      <T size={13} color={t.fg} style={{ flex: 1 }}>{text}</T>
    </View>
  );
}

type BtnKind = 'primary' | 'secondary' | 'volt' | 'danger' | 'ghost';
export function Btn({ label, onPress, kind = 'primary', disabled, icon, style }: { label: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const v = {
    primary: { bg: c.brand, fg: c.onBrand, border: c.brand },
    secondary: { bg: c.surfaceRaised, fg: c.ink, border: c.lineStrong },
    volt: { bg: c.volt, fg: c.onVolt, border: c.volt },
    danger: { bg: c.danger, fg: c.surfaceRaised, border: c.danger },
    ghost: { bg: 'transparent', fg: c.brand, border: 'transparent' },
  }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, style]}
    >
      {icon && <Icon name={icon} size={18} color={v.fg} />}
      <T size={14} w={700} color={v.fg}>{label}</T>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, onSubmitEditing }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: KeyboardTypeOptions; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'sentences' | 'characters'; onSubmitEditing?: () => void }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <T size={13} w={600}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inkMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing}
        style={[s.input, { borderColor: c.lineStrong, backgroundColor: c.surfaceRaised, color: c.ink, fontFamily: fonts.sans400 }]}
      />
    </View>
  );
}

/** Thẻ bấm được, có mũi tên bên phải */
export function ListRow({ onPress, children, accessibilityLabel }: { onPress: () => void; children: ReactNode; accessibilityLabel?: string }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [s.row, { backgroundColor: pressed ? c.surfaceSunken : c.surfaceRaised, borderColor: c.line }]}
    >
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>{children}</View>
      <Icon name="chevronRight" size={18} color={c.inkMuted} />
    </Pressable>
  );
}

/** Bảng trượt từ dưới lên */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const c = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Đóng" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
        <SafeAreaView edges={['bottom']} style={[s.sheet, { backgroundColor: c.surfaceRaised }]}>
          <View style={s.between}>
            <Num size={24}>{title}</Num>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={s.back}>
              <Icon name="close" color={c.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/** Nhãn & màu cho trạng thái sân lúc này */
export const LIVE: Record<import('../types/admin').CourtLiveKind, { label: string; tone: Tone }> = {
  inUse: { label: 'Đang sử dụng', tone: 'success' },
  class: { label: 'Lớp học / PT', tone: 'class' },
  pending: { label: 'Chờ cọc', tone: 'warning' },
  blocked: { label: 'Bảo trì / Khóa', tone: 'neutral' },
  soon: { label: 'Sắp tới lượt', tone: 'info' },
  free: { label: 'Trống', tone: 'volt' },
};

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badge: { alignSelf: 'flex-start', height: 22, paddingHorizontal: 9, borderRadius: 999, justifyContent: 'center' },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  seg: { flexDirection: 'row', padding: 3, borderRadius: radius.md, borderWidth: 1, gap: 3 },
  segBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tile: { flex: 1, minWidth: 150, padding: 14, borderRadius: radius.lg, borderWidth: 1, gap: 2 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md },
  btn: { minHeight: 46, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  input: { height: 46, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12, gap: 8 },
});
