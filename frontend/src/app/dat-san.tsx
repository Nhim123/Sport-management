import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Num, PrimaryButton, ScreenHeader, T } from '../components/ui';
import { DOW, MEMBER_DISCOUNT, SPORTS, TIMES, TODAY } from '../constants';
import type { Sport } from '../types/domain';
import { useCourts, useTakenSlots } from '../hooks';
import { hh, vnd } from '../lib/format';
import { radius, useColors } from '../theme/tokens';

export default function BookingScreen() {
  const c = useColors();
  const [sport, setSport] = useState<Sport>('cl');
  const [day, setDay] = useState(0);
  const [courtIdx, setCourtIdx] = useState(0);
  const [hour, setHour] = useState<number | null>(null);

  const { data: allCourts = [] } = useCourts();
  const courts = allCourts.filter((x) => x.sport === sport);
  const court = courts.length ? courts[Math.min(courtIdx, courts.length - 1)] : undefined;
  const { data: takenSlots = [] } = useTakenSlots(court?.id, day);

  if (!court) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.brand} />
      </SafeAreaView>
    );
  }

  const taken = (h: number) => takenSlots.includes(h);
  const firstFree = TIMES.find((h) => h >= 19 && !taken(h)) ?? TIMES.find((h) => !taken(h)) ?? null;
  const time = hour !== null && !taken(hour) ? hour : firstFree;
  const price = Math.round(court.price * (1 - MEMBER_DISCOUNT));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.surface }}>
      <ScreenHeader title="Đặt sân" />

      <ScrollView contentContainerStyle={{ gap: 18, paddingTop: 4, paddingBottom: 24 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {SPORTS.map((s) => {
            const on = sport === s.id;
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={s.label}
                accessibilityState={{ selected: on }}
                onPress={() => { setSport(s.id); setCourtIdx(0); }}
                style={[styles.chip, { borderColor: on ? c.ink : c.lineStrong, backgroundColor: on ? c.ink : c.surfaceRaised }]}
              >
                <T size={13} w={600} color={on ? c.surface : c.ink}>{s.label}</T>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.section}>
          <T w={700} style={styles.h3}>Tháng 10</T>
          <View style={styles.days}>
            {Array.from({ length: 7 }, (_, i) => {
              const on = day === i;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={`${DOW[i]} ${TODAY + i}/10`}
                  accessibilityState={{ selected: on }}
                  onPress={() => setDay(i)}
                  style={[styles.day, { borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brand : c.surfaceRaised }]}
                >
                  <T size={11} w={600} color={on ? c.onBrand : c.ink}>{i === 0 ? 'Nay' : DOW[i]}</T>
                  <Num size={22} color={on ? c.onBrand : c.ink}>{TODAY + i}</Num>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.between, { marginBottom: 10 }]}>
            <T w={700}>Giờ bắt đầu</T>
            <T size={12} color={c.inkMuted}>Gạch ngang = đã kín</T>
          </View>
          <View style={styles.times}>
            {TIMES.map((h) => {
              const off = taken(h);
              const on = time === h;
              return (
                <Pressable
                  key={h}
                  accessibilityRole="button"
                  accessibilityLabel={hh(h) + (off ? ' – đã kín' : '')}
                  accessibilityState={{ disabled: off, selected: on }}
                  disabled={off}
                  onPress={() => setHour(h)}
                  style={[
                    styles.time,
                    off
                      ? { backgroundColor: c.slotBlocked, borderColor: c.slotBlocked }
                      : on
                        ? { backgroundColor: c.volt, borderColor: c.onVolt, borderWidth: 2 }
                        : { backgroundColor: c.surfaceRaised, borderColor: c.lineStrong },
                  ]}
                >
                  <Num
                    size={16}
                    w={600}
                    color={off ? c.inkMuted : on ? c.onVolt : c.ink}
                    style={off ? { textDecorationLine: 'line-through' } : undefined}
                  >
                    {hh(h)}
                  </Num>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <T w={700} style={styles.h3}>Chọn sân</T>
          <View style={{ gap: 8 }}>
            {courts.map((x, i) => {
              const on = court.id === x.id;
              return (
                <Pressable
                  key={x.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setCourtIdx(i)}
                  style={[
                    styles.court,
                    { borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandWash : c.surfaceRaised, borderWidth: on ? 2 : 1 },
                  ]}
                >
                  <View style={[styles.radio, { borderColor: on ? c.brand : c.lineStrong, borderWidth: on ? 6 : 2 }]} />
                  <View style={{ flex: 1 }}>
                    <T w={700}>{x.name}</T>
                    <T size={12} color={c.inkMuted}>{x.kind}</T>
                  </View>
                  <Num size={18} w={600}>{vnd(x.price)}/giờ</Num>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.surfaceRaised, borderTopColor: c.line }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T size={12} color={c.inkMuted} numberOfLines={1}>
            {court.name} · {DOW[day]} {TODAY + day}/10 · {time !== null ? hh(time) : 'chưa chọn giờ'} · 1 giờ
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Num size={26}>{vnd(price)}</Num>
            <T size={12} w={600} color={c.brand}>giá hội viên −{MEMBER_DISCOUNT * 100}%</T>
          </View>
        </View>
        <PrimaryButton
          label="Tiếp tục"
          disabled={time === null}
          onPress={() =>
            time !== null &&
            router.push({ pathname: '/thanh-toan', params: { courtId: court.id, day: String(day), hour: String(time) } })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20 },
  h3: { marginBottom: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, maxWidth: 56, height: 64, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { width: '23%', flexGrow: 1, height: 44, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  court: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 },
  radio: { width: 20, height: 20, borderRadius: radius.pill },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderTopWidth: 1 },
});

