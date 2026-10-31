import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Platform, Pressable, StyleSheet, Vibration, View } from 'react-native';
import { bookingPrice, hm, NOW_HOUR, SAMPLE_CODES } from '../../../api/admin.api';
import { Icon } from '../../../components/Icon';
import { Avatar, Badge, Banner, Btn, Chip, ChipRow, Field, SectionHead, Screen, Sheet, SportBadge, SPORT_ICON, toneColors } from '../../../components/kit';
import { NoticeBell } from '../../../components/NoticeBell';
import { Card, Num, T } from '../../../components/ui';
import { useConfirmClassEntry, useConfirmCourtEntry, useResolveQr, useScanLog } from '../../../hooks/useAdmin';
import { vnd } from '../../../lib/format';
import { radius, useColors } from '../../../theme/tokens';
import type { AdminMember, ScanResult, Verdict } from '../../../types/admin';

const SHEET_TITLE: Record<ScanResult['kind'], string> = {
  booking: 'Vé đặt sân',
  class: 'Vé lớp học',
  member: 'Thẻ hội viên',
  invalid: 'Không hợp lệ',
};

/** Bỏ qua cùng một mã quét lại trong khoảng này (ms) */
const SAME_CODE_COOLDOWN = 2500;

/** Quét QR để xác nhận khách đã vào sân / hội viên đã vào lớp */
export default function ScanScreen() {
  const c = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(true);
  const [torch, setTorch] = useState(false);
  const [manual, setManual] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const last = useRef({ code: '', at: 0 });

  const resolve = useResolveQr();
  const court = useConfirmCourtEntry();
  const klass = useConfirmClassEntry();
  const { data: log = [] } = useScanLog();

  // Tắt camera khi rời màn để không quét ngầm
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const check = (raw: string) => {
    const code = raw.trim();
    if (!code || resolve.isPending || result) return;
    setNotice(null);
    resolve.mutate(code, {
      onSuccess: (r) => {
        setError(null);
        setPick(r.kind === 'member' ? r.options.find((o) => o.verdict.ok)?.cls.id ?? null : null);
        setResult(r);
      },
    });
  };

  const onScanned = ({ data }: BarcodeScanningResult) => {
    const now = Date.now();
    if (data === last.current.code && now - last.current.at < SAME_CODE_COOLDOWN) return;
    last.current = { code: data, at: now };
    if (Platform.OS !== 'web') Vibration.vibrate(40);
    check(data);
  };

  const close = () => {
    setResult(null);
    setError(null);
    last.current = { code: last.current.code, at: Date.now() };
  };

  const done = (msg: string) => {
    setResult(null);
    setManual('');
    setNotice(msg);
  };
  const fail = (e: Error) => setError(e.message);

  const scanning = focused && !result && !resolve.isPending;

  return (
    <Screen title="Quét QR" sub="Vé sân · vé lớp · thẻ hội viên" right={<NoticeBell />}>
      {notice && <Banner tone="success" text={notice} />}

      <View style={[st.viewport, { backgroundColor: '#0d100e' }]}>
        {!permission ? null : permission.granted ? (
          <>
            {focused && (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanning ? onScanned : undefined}
              />
            )}
            <ScanFrame active={scanning} />
            <View style={st.hint}>
              <T size={13} w={600} color="#fff">{resolve.isPending ? 'Đang kiểm tra mã…' : 'Đưa mã QR vào giữa khung'}</T>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torch ? 'Tắt đèn' : 'Bật đèn'}
              onPress={() => setTorch((v) => !v)}
              style={[st.torch, { backgroundColor: torch ? c.volt : 'rgba(0,0,0,0.45)' }]}
            >
              <Icon name="flash" size={20} color={torch ? c.onVolt : '#fff'} />
            </Pressable>
          </>
        ) : (
          <View style={st.ask}>
            <Icon name="scan" size={40} color="#fff" />
            <T w={700} color="#fff" style={{ textAlign: 'center' }}>Cần quyền camera để quét mã</T>
            <T size={13} color="rgba(255,255,255,0.7)" style={{ textAlign: 'center' }}>
              {permission.canAskAgain ? 'Camera chỉ dùng để đọc mã QR vé và thẻ hội viên.' : 'Quyền camera đã bị tắt – mở Cài đặt để bật lại, hoặc nhập mã bên dưới.'}
            </T>
            {permission.canAskAgain ? (
              <Btn label="Cho phép camera" kind="volt" onPress={requestPermission} />
            ) : (
              Platform.OS !== 'web' && <Btn label="Mở Cài đặt" kind="volt" onPress={() => Linking.openSettings()} />
            )}
          </View>
        )}
      </View>

      <Card style={{ gap: 12 }}>
        <Field label="Nhập mã thủ công" value={manual} onChangeText={setManual} placeholder="VD: ARENA:BK:b11 hoặc AR-00421" autoCapitalize="characters" onSubmitEditing={() => check(manual)} />
        <Btn label={resolve.isPending ? 'Đang kiểm tra…' : 'Kiểm tra mã'} kind="secondary" icon="search" disabled={!manual.trim() || resolve.isPending} onPress={() => check(manual)} />
        {__DEV__ && (
          <View style={{ gap: 8 }}>
            <T size={12} color={c.inkMuted}>Mã mẫu để thử (bản phát triển):</T>
            <ChipRow>
              {SAMPLE_CODES.map((s) => (
                <Chip key={s.code} label={s.label} onPress={() => check(s.code)} />
              ))}
            </ChipRow>
          </View>
        )}
      </Card>

      <SectionHead title={`Check-in qua QR · ${log.length}`} />
      {log.length === 0 ? (
        <T size={13} color={c.inkMuted}>Chưa có lượt check-in nào trong ca này.</T>
      ) : (
        <Card style={{ padding: 0 }}>
          {log.map((e, i) => (
            <View key={e.id} style={[st.logRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.lineSoft }]}>
              <SportBadge sport={e.sport} size={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w={600} numberOfLines={1}>{e.title}</T>
                <T size={12} color={c.inkMuted} numberOfLines={1}>{e.sub}</T>
              </View>
              <Num size={16} w={600}>{e.at}</Num>
            </View>
          ))}
        </Card>
      )}

      <Sheet visible={!!result} onClose={close} title={result ? SHEET_TITLE[result.kind] : ''}>
        {result && (
          <>
            <VerdictBox v={result.verdict} />
            {error && <Banner tone="danger" text={error} />}

            {result.kind === 'booking' && (
              <>
                <Card style={{ gap: 6 }}>
                  <View style={st.headRow}>
                    <SportBadge sport={result.sport} size={40} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w={700} numberOfLines={1}>{result.courtName}</T>
                      <T size={12} color={c.inkMuted}>{SPORT_ICON[result.sport].label}</T>
                    </View>
                  </View>
                  <Row label="Khách" value={result.booking.label} />
                  <Row label="Sân" value={result.courtName} />
                  <Row label="Giờ" value={`${hm(result.booking.start)} – ${hm(result.booking.start + result.booking.span)}`} />
                  <Row label="Thanh toán" value={result.booking.state === 'pending' ? `Chưa cọc · ${vnd(bookingPrice(result.booking))}` : 'Đã cọc'} />
                </Card>
                {result.verdict.ok && (
                  <Btn
                    label={court.isPending ? 'Đang xác nhận…' : result.booking.state === 'pending' ? `Đã thu ${vnd(bookingPrice(result.booking))} · cho vào sân` : 'Xác nhận vào sân'}
                    kind={result.booking.state === 'pending' ? 'volt' : 'primary'}
                    icon="check"
                    disabled={court.isPending}
                    onPress={() => {
                      const b = result.booking;
                      court.mutate(
                        { id: b.id, collected: b.state === 'pending' },
                        { onSuccess: () => done(`Đã xác nhận ${b.label} vào ${result.courtName} lúc ${hm(NOW_HOUR)}.`), onError: fail },
                      );
                    }}
                  />
                )}
              </>
            )}

            {result.kind === 'class' && (
              <>
                <MemberCard m={result.member} />
                <Card style={{ gap: 6 }}>
                  <View style={st.headRow}>
                    <SportBadge sport={result.cls.sport} size={40} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w={700} numberOfLines={1}>{result.cls.name}</T>
                      <T size={12} color={c.inkMuted}>{SPORT_ICON[result.cls.sport].label}</T>
                    </View>
                  </View>
                  <Row label="Giờ" value={`${result.cls.time} · ${result.cls.mins} phút`} />
                  <Row label="HLV · phòng" value={`${result.cls.coach} · ${result.cls.room}`} />
                  <Row label="Đã vào lớp" value={`${result.cls.present}/${result.cls.booked}`} />
                </Card>
                {result.verdict.ok && (
                  <Btn
                    label={klass.isPending ? 'Đang xác nhận…' : 'Xác nhận vào lớp'}
                    icon="check"
                    disabled={klass.isPending}
                    onPress={() =>
                      klass.mutate(
                        { classId: result.cls.id, memberCode: result.member.code },
                        { onSuccess: () => done(`Đã xác nhận ${result.member.name} vào lớp ${result.cls.name}.`), onError: fail },
                      )
                    }
                  />
                )}
              </>
            )}

            {result.kind === 'member' && (
              <>
                <MemberCard m={result.member} />
                {result.options.length > 0 && <T size={13} w={700}>Lớp có thể check-in</T>}
                {result.options.map((o) => {
                  const on = pick === o.cls.id;
                  const t = toneColors(c, o.verdict.tone);
                  return (
                    <Pressable
                      key={o.cls.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on, disabled: !o.verdict.ok }}
                      disabled={!o.verdict.ok}
                      onPress={() => setPick(o.cls.id)}
                      style={[st.option, { borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandTint : c.surfaceRaised, opacity: o.verdict.ok ? 1 : 0.7 }]}
                    >
                      <View style={[st.radio, { borderColor: on ? c.brand : c.lineStrong }]}>{on && <View style={[st.dot, { backgroundColor: c.brand }]} />}</View>
                      <Num size={18} color={c.clay} style={{ width: 50 }}>{o.cls.time}</Num>
                      <SportBadge sport={o.cls.sport} size={32} />
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <T w={600} numberOfLines={1}>{o.cls.name}</T>
                        <T size={12} color={c.inkMuted} numberOfLines={1}>{o.cls.room} · {o.enrolled ? 'đã đăng ký' : `chưa đăng ký · còn ${Math.max(0, o.cls.cap - o.cls.booked)} chỗ`}</T>
                        {!o.verdict.ok && <T size={12} color={t.fg}>{o.verdict.title}</T>}
                      </View>
                    </Pressable>
                  );
                })}
                {result.verdict.ok && (
                  <Btn
                    label={klass.isPending ? 'Đang xác nhận…' : 'Xác nhận vào lớp'}
                    icon="check"
                    disabled={!pick || klass.isPending}
                    onPress={() => {
                      const o = result.options.find((x) => x.cls.id === pick);
                      if (!o) return;
                      klass.mutate(
                        { classId: o.cls.id, memberCode: result.member.code },
                        { onSuccess: () => done(`Đã xác nhận ${result.member.name} vào lớp ${o.cls.name}.`), onError: fail },
                      );
                    }}
                  />
                )}
                <Btn
                  label="Xem hồ sơ hội viên"
                  kind="ghost"
                  onPress={() => {
                    const code = result.member.code;
                    close();
                    router.push({ pathname: '/quan-ly/hoi-vien/[code]', params: { code } });
                  }}
                />
              </>
            )}

            {result.kind === 'invalid' && <T size={12} color={c.inkMuted} numberOfLines={2}>Mã đã đọc: {result.code}</T>}

            <Btn label="Quét mã khác" kind="secondary" icon="scan" onPress={close} />
          </>
        )}
      </Sheet>
    </Screen>
  );
}

/** Khung ngắm với 4 góc và vạch quét chạy lên xuống */
function ScanFrame({ active }: { active: boolean }) {
  const c = useColors();
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(y, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, y]);

  const corner = { borderColor: active ? c.volt : 'rgba(255,255,255,0.5)' };
  return (
    <View pointerEvents="none" style={st.frameWrap}>
      <View style={st.frame}>
        <View style={[st.corner, st.tl, corner]} />
        <View style={[st.corner, st.tr, corner]} />
        <View style={[st.corner, st.bl, corner]} />
        <View style={[st.corner, st.br, corner]} />
        {active && (
          <Animated.View
            style={[st.line, { backgroundColor: c.volt, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [8, FRAME - 10] }) }] }]}
          />
        )}
      </View>
    </View>
  );
}

function VerdictBox({ v }: { v: Verdict }) {
  const c = useColors();
  const t = toneColors(c, v.tone);
  return (
    <View accessibilityRole="alert" style={[st.verdict, { backgroundColor: t.bg }]}>
      <View style={[st.verdictIc, { backgroundColor: t.fg }]}>
        <Icon name={v.tone === 'danger' ? 'close' : v.tone === 'warning' && !v.ok ? 'alert' : 'check'} size={22} color={t.bg} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <T w={700} size={16} color={t.fg}>{v.title}</T>
        {v.notes.map((n) => (
          <T key={n} size={13} color={t.fg}>• {n}</T>
        ))}
      </View>
    </View>
  );
}

function MemberCard({ m }: { m: AdminMember }) {
  const c = useColors();
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar name={m.name} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T w={700} numberOfLines={1}>{m.name}</T>
        <T size={12} color={c.inkMuted} numberOfLines={1}>{m.code} · {m.plan}</T>
      </View>
      <Badge label={m.status} tone={m.tone} />
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <T size={13} color={c.inkMuted}>{label}</T>
      <T size={13} w={600} style={{ flexShrink: 1, textAlign: 'right' }}>{value}</T>
    </View>
  );
}

const FRAME = 220;
const st = StyleSheet.create({
  viewport: { width: '100%', aspectRatio: 1, maxHeight: 380, borderRadius: radius.xl, overflow: 'hidden', alignSelf: 'center' },
  frameWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: 34, height: 34 },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  line: { position: 'absolute', left: 12, right: 12, height: 2, borderRadius: 1, opacity: 0.9 },
  hint: { position: 'absolute', bottom: 14, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  torch: { position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ask: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  verdict: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, alignItems: 'flex-start' },
  verdictIc: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
