import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { Icon, type IconName } from '../../components/Icon';
import { Card, Label, Num, T } from '../../components/ui';
import { useMe, useMySchedule, useTonightClasses } from '../../hooks';
import { radius, useColors } from '../../theme/tokens';

export default function HomeScreen() {
  const c = useColors();
  const { data: me } = useMe();
  const { data: schedule = [] } = useMySchedule();
  const { data: classes = [] } = useTonightClasses();

  if (!me) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.brand} />
      </SafeAreaView>
    );
  }

  const shortcuts: { href: '/dat-san' | '/lop-hoc'; label: string; icon: IconName; clay?: boolean }[] = [
    { href: '/dat-san', label: 'Đặt sân', icon: 'calendar' },
    { href: '/lop-hoc', label: 'Lớp học', icon: 'dumbbell', clay: true },
    { href: '/lop-hoc', label: 'Lịch PT', icon: 'coach', clay: true },
    { href: '/dat-san', label: 'Gia hạn', icon: 'renew' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.surface }}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <T size={13} color={c.inkMuted}>Chào buổi tối,</T>
            <T size={22} w={700}>{me.firstName}</T>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thông báo, 2 mới"
            style={[styles.bell, { borderColor: c.line, backgroundColor: c.surfaceRaised }]}
          >
            <Icon name="bell" color={c.ink} />
            <View style={[styles.dot, { backgroundColor: c.danger, borderColor: c.surfaceRaised }]} />
          </Pressable>
        </View>

        <View accessibilityLabel="Thẻ hội viên" style={[styles.pass, { backgroundColor: c.passBg }]}>
          <Svg width={200} height={140} viewBox="0 0 200 140" style={styles.passCourt}>
            <Rect x={10} y={10} width={180} height={120} fill="none" stroke={c.passLine} strokeWidth={2} />
            <Line x1={100} y1={10} x2={100} y2={130} stroke={c.passLine} strokeWidth={2} />
            <Circle cx={100} cy={70} r={24} fill="none" stroke={c.passLine} strokeWidth={2} />
          </Svg>
          <Label color={c.passMuted}>{me.plan}</Label>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
            <Num size={44} color={c.passInk}>{me.daysLeft}</Num>
            <Num size={20} w={600} color={c.passInk}>ngày còn lại</Num>
          </View>
          <T size={13} color={c.passMuted}>Hạn đến {me.until} · PT còn {me.ptLeft} buổi</T>
          <View style={[styles.track, { backgroundColor: c.passTrack }]} accessibilityLabel={`Đã dùng ${me.usedPct}% thời hạn gói`}>
            <View style={{ width: `${me.usedPct}%`, height: 6, backgroundColor: c.volt }} />
          </View>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.passCta, { backgroundColor: c.volt, opacity: pressed ? 0.85 : 1 }]}>
            <Icon name="qr" color={c.onVolt} />
            <T w={700} color={c.onVolt}>Mã QR check-in</T>
          </Pressable>
        </View>

        <View style={styles.qaGrid}>
          {shortcuts.map((s) => (
            <Link key={s.label} href={s.href} asChild>
              <Pressable accessibilityRole="link" style={styles.qa}>
                <View style={[styles.qaIcon, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
                  <Icon name={s.icon} color={s.clay ? c.clay : c.brand} />
                </View>
                <T size={12} w={600}>{s.label}</T>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <T size={17} w={700}>Lịch của tôi</T>
            <T size={13} w={600} color={c.brand}>Xem tất cả</T>
          </View>
          {schedule.map((s) => {
            const bg = s.tone === 'brand' ? c.brandTint : c.clayTint;
            const fg = s.tone === 'brand' ? c.brandInk : c.clayInk;
            return (
              <Card key={s.id} style={[styles.row, { gap: 14 }]}>
                <View style={[styles.dateChip, { backgroundColor: bg }]}>
                  <T size={10} w={700} color={fg}>{s.tag}</T>
                  <Num size={22} color={fg}>{s.time}</Num>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w={600}>{s.title}</T>
                  <T size={13} color={c.inkMuted}>{s.sub}</T>
                </View>
                {s.upcoming && (
                  <View style={[styles.badge, { backgroundColor: c.volt }]}>
                    <T size={11} w={600} color={c.onVolt}>Sắp tới</T>
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        <View style={{ gap: 10 }}>
          <T size={17} w={700}>Lớp học tối nay</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {classes.map((k) => (
              <Card key={k.id} style={{ width: 160 }}>
                <Num size={20} color={c.clay}>{k.time}</Num>
                <T w={600} style={{ marginTop: 2 }}>{k.name}</T>
                <T size={12} w={k.full ? 600 : 400} color={k.full ? c.danger : c.inkMuted}>{k.sub}</T>
              </Card>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingTop: 24, gap: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bell: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 9, width: 10, height: 10, borderRadius: radius.pill, borderWidth: 2 },
  pass: { borderRadius: radius.xl, padding: 20, overflow: 'hidden' },
  passCourt: { position: 'absolute', right: -30, top: -10, opacity: 0.35 },
  track: { marginTop: 16, height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  passCta: { marginTop: 16, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  qaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  qa: { flex: 1, alignItems: 'center', gap: 8, minHeight: 44 },
  qaIcon: { width: 56, height: 56, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateChip: { width: 56, borderRadius: 12, paddingVertical: 6, alignItems: 'center' },
  badge: { height: 22, paddingHorizontal: 9, borderRadius: radius.pill, justifyContent: 'center' },
});
