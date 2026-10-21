import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Rect } from 'react-native-svg';
import { Icon } from '../components/Icon';
import { Label, Num, PrimaryButton, ScreenHeader, T } from '../components/ui';
import { COURTS, DOW_LONG, HOLD_SECONDS, MEMBER_DISCOUNT, PAY_METHODS, RACKET_RENT, TODAY } from '../data/mock';
import { hh, vnd } from '../lib/format';
import { radius, useColors, type Colors } from '../theme/tokens';

function toneColors(c: Colors, tone: (typeof PAY_METHODS)[number]['tone']) {
  switch (tone) {
    case 'info': return { bg: c.infoTint, fg: c.info };
    case 'clay': return { bg: c.clayTint, fg: c.clayInk };
    case 'brand': return { bg: c.brandTint, fg: c.brandInk };
    default: return { bg: c.surfaceSunken, fg: c.ink };
  }
}

export default function CheckoutScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ courtId?: string; day?: string; hour?: string }>();
  const court = COURTS.find((x) => x.id === params.courtId) ?? COURTS[1];
  const day = Number(params.day ?? 0) || 0;
  const hour = Number(params.hour ?? 19) || 19;
  const dayLabel = `${DOW_LONG[day]} ${TODAY + day}/10`;

  const [left, setLeft] = useState(HOLD_SECONDS);
  const [racket, setRacket] = useState(false);
  const [method, setMethod] = useState('qr');
  const [paidCode, setPaidCode] = useState<string | null>(null);

  useEffect(() => {
    if (paidCode) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [paidCode]);

  const discount = Math.round(court.price * MEMBER_DISCOUNT);
  const total = court.price - discount + (racket ? RACKET_RENT : 0);
  const expired = left === 0;
  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  const isDesk = method === 'desk';

  if (paidCode) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: c.surface }]}>
        <View style={[styles.okCircle, { backgroundColor: c.brand }]}>
          <Icon name="check" size={36} color={c.onBrand} />
        </View>
        <Num size={28}>{isDesk ? 'Đã giữ chỗ' : 'Đặt sân thành công'}</Num>
        <T color={c.inkMuted} style={{ textAlign: 'center' }}>
          {court.name} · {dayLabel} · {hh(hour)}–{hh(hour + 1)}{'\n'}Mã đặt sân <T w={700}>{paidCode}</T>
        </T>
        <PrimaryButton label="Về trang chủ" onPress={() => router.dismissTo('/')} style={{ marginTop: 8 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.surface }}>
      <ScreenHeader
        title="Thanh toán"
        right={
          <View
            accessibilityRole="timer"
            accessibilityLabel={`Thời gian giữ chỗ còn ${mmss}`}
            style={[styles.hold, { backgroundColor: expired ? c.dangerTint : c.warningTint }]}
          >
            <Icon name="timer" size={14} color={expired ? c.danger : c.warning} />
            {expired ? (
              <T size={12} w={600} color={c.danger}>Hết giờ giữ chỗ</T>
            ) : (
              <>
                <T size={12} w={600} color={c.warning}>Giữ chỗ</T>
                <Num size={15} w={600} color={c.warning}>{mmss}</Num>
              </>
            )}
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 16 }}>
        <View style={[styles.order, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
          <View style={[styles.orderHead, { backgroundColor: c.brand }]}>
            <View style={{ flex: 1 }}>
              <Label color={c.onBrand}>Arena · Chi nhánh Quận 7</Label>
              <Num size={30} color={c.onBrand}>{court.name}</Num>
              <T size={13} color={c.onBrand}>{dayLabel} · {hh(hour)}–{hh(hour + 1)}</T>
            </View>
            <Svg width={80} height={56} viewBox="0 0 80 56">
              <Rect x={2} y={2} width={76} height={52} fill="none" stroke={c.volt} strokeWidth={2} />
              <Line x1={40} y1={2} x2={40} y2={54} stroke={c.volt} strokeWidth={2} />
              <Line x1={2} y1={14} x2={78} y2={14} stroke={c.volt} strokeWidth={1.5} />
              <Line x1={2} y1={42} x2={78} y2={42} stroke={c.volt} strokeWidth={1.5} />
            </Svg>
          </View>
          <View style={{ padding: 16, paddingTop: 14, gap: 8 }}>
            <View style={styles.line}>
              <T size={14} color={c.inkMuted}>Thuê sân 1 giờ</T>
              <Num size={17} w={600}>{vnd(court.price)}</Num>
            </View>
            <View style={styles.line}>
              <T size={14} color={c.inkMuted}>Ưu đãi hội viên −{MEMBER_DISCOUNT * 100}%</T>
              <Num size={17} w={600} color={c.brand}>{vnd(-discount)}</Num>
            </View>
            <View style={styles.line}>
              <T size={14} color={c.inkMuted}>Thuê vợt (tuỳ chọn)</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {racket && <Num size={17} w={600}>{vnd(RACKET_RENT)}</Num>}
                <Pressable accessibilityRole="button" onPress={() => setRacket((r) => !r)} style={styles.link} hitSlop={8}>
                  <T size={13} w={600} color={racket ? c.danger : c.brand}>{racket ? 'Bỏ' : '+ Thêm'}</T>
                </Pressable>
              </View>
            </View>
            <View style={[styles.line, styles.total, { borderTopColor: c.line }]}>
              <T w={700}>Tổng thanh toán</T>
              <Num size={30}>{vnd(total)}</Num>
            </View>
          </View>
        </View>

        <View accessibilityRole="radiogroup" accessibilityLabel="Phương thức thanh toán">
          <T w={700} style={{ marginBottom: 10 }}>Phương thức thanh toán</T>
          <View style={[styles.pmList, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
            {PAY_METHODS.map((m, i) => {
              const on = method === m.id;
              const tone = toneColors(c, m.tone);
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setMethod(m.id)}
                  style={[styles.pm, i < PAY_METHODS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.lineSoft }]}
                >
                  <View style={[styles.radio, { borderColor: on ? c.brand : c.lineStrong, borderWidth: on ? 6 : 2 }]} />
                  <View style={[styles.logo, { backgroundColor: tone.bg }]}>
                    <T size={11} w={700} color={tone.fg}>{m.logo}</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T size={14} w={700}>{m.title}</T>
                    {!!m.sub && <T size={12} color={m.warn ? c.warning : c.inkMuted}>{m.sub}</T>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <T size={12} color={c.inkMuted}>
          Huỷ miễn phí trước 4 giờ. Sau thời hạn này, tiền sân được chuyển thành điểm thưởng cho lần đặt sau.
        </T>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.surfaceRaised, borderTopColor: c.line }]}>
        <PrimaryButton
          style={{ height: 52 }}
          disabled={expired}
          label={expired ? 'Hết thời gian giữ chỗ' : isDesk ? `Giữ chỗ · cọc ${vnd(Math.round(total / 2))}` : `Thanh toán ${vnd(total)}`}
          onPress={() => setPaidCode('ĐS-' + String(7000 + Math.floor(Math.random() * 999)))}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  okCircle: { width: 72, height: 72, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  hold: { height: 28, paddingHorizontal: 10, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 },
  order: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  orderHead: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { alignItems: 'baseline', borderTopWidth: 1, borderStyle: 'dashed', paddingTop: 10, marginTop: 2 },
  link: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 4 },
  pmList: { borderRadius: radius.lg, borderWidth: 1 },
  pm: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 44 },
  radio: { width: 20, height: 20, borderRadius: radius.pill },
  logo: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderTopWidth: 1 },
});
