import { Redirect, router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkOwner, MIN_PASSWORD, verifySalesCode } from '../api/auth.api';
import { AddressPicker, type AddressValue } from '../components/AddressPicker';
import { AuthField, formatPhone, passwordStrength, type AuthFieldRef } from '../components/AuthField';
import { Icon } from '../components/Icon';
import { Avatar, Badge, Banner, Btn, SPORT_ICON, SportBadge } from '../components/kit';
import { Label, Num, T } from '../components/ui';
import { fullAddress } from '../lib/vnAddress';
import { hasErrors, isCourtSport, MAX_COURTS, SIGNUP_SPORTS, validateClub, validateOwner, type ClubErrors, type OwnerErrors } from '../lib/signup';
import { useAuth } from '../store/auth';
import { radius, useColors } from '../theme/tokens';
import type { ClubSignup, SalesRep } from '../types/admin';
import type { Activity, Sport } from '../types/domain';

// Xem ghi chú ở màn đăng nhập: typed routes sinh sai đường dẫn index của nhóm (tabs).
const ADMIN_HOME = '/quan-ly' as Href;

const STEPS = [
  { short: 'Đại diện', title: 'Thông tin người đại diện', sub: 'Người đứng tên câu lạc bộ và giữ tài khoản quản lý. Số điện thoại dùng để đăng nhập.' },
  { short: 'Câu lạc bộ', title: 'Thông tin câu lạc bộ', sub: 'Tên, địa chỉ và các môn câu lạc bộ kinh doanh. Có thể chỉnh sửa sau trong phần Cài đặt.' },
  { short: 'Mật khẩu', title: 'Kiểm tra & đặt mật khẩu', sub: 'Xem lại hồ sơ, rồi đặt mật khẩu để hoàn tất đăng ký.' },
];

type PwErrors = Partial<Record<'password' | 'confirm', string>>;

/** Đăng ký câu lạc bộ mới: người đại diện → câu lạc bộ → mật khẩu */
export default function Register() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { user, register } = useAuth();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [step, setStep] = useState(0);
  const [owner, setOwner] = useState<ClubSignup['owner']>({ name: '', phone: '', email: '' });
  const [club, setClub] = useState<ClubSignup['club']>({ name: '', address: '', province: '', ward: '', sports: [], courts: {} });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ownerErr, setOwnerErr] = useState<OwnerErrors>({});
  const [clubErr, setClubErr] = useState<ClubErrors>({});
  const [pwErr, setPwErr] = useState<PwErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Nhân viên tiếp thị Arena hướng dẫn đăng ký (ghi nhận doanh số)
  const [salesCode, setSalesCode] = useState('');
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [salesErr, setSalesErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const phoneRef = useRef<AuthFieldRef>(null);
  const emailRef = useRef<AuthFieldRef>(null);
  const confirmRef = useRef<AuthFieldRef>(null);

  if (user) return <Redirect href={ADMIN_HOME} />;

  const strength = passwordStrength(password, MIN_PASSWORD);
  const strengthColor = [c.line, c.danger, c.warning, c.brand, c.brand][strength.score];
  const matches = confirm.length > 0 && confirm === password && password.length >= MIN_PASSWORD;
  const courtSports = club.sports.filter(isCourtSport);

  const goTo = (n: number) => {
    setStep(n);
    setError(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const setO = (key: keyof ClubSignup['owner'], fmt: (v: string) => string = (v) => v) => (v: string) => {
    setOwner((o) => ({ ...o, [key]: fmt(v) }));
    if (ownerErr[key]) setOwnerErr((e) => ({ ...e, [key]: undefined }));
    if (error) setError(null);
  };
  const setC = (key: 'name') => (v: string) => {
    setClub((cl) => ({ ...cl, [key]: v }));
    if (clubErr[key]) setClubErr((e) => ({ ...e, [key]: undefined }));
  };
  /** Ô địa chỉ có gợi ý: một lần chọn có thể đổi cả địa chỉ, tỉnh/thành và toạ độ */
  const setAddress = (patch: Partial<AddressValue>) => {
    setClub((cl) => ({ ...cl, ...patch }));
    setClubErr((e) => ({
      ...e,
      ...('address' in patch && { address: undefined }),
      ...('wardCode' in patch && patch.wardCode && { ward: undefined }),
      ...('provinceCode' in patch && { province: undefined }),
    }));
  };
  const setPw = (key: keyof PwErrors, set: (v: string) => void) => (v: string) => {
    set(v);
    if (pwErr[key]) setPwErr((e) => ({ ...e, [key]: undefined }));
    if (error) setError(null);
  };

  const toggleSport = (a: Activity) => {
    setClub((cl) => {
      const on = cl.sports.includes(a);
      const sports = on ? cl.sports.filter((x) => x !== a) : SIGNUP_SPORTS.filter((x) => x === a || cl.sports.includes(x));
      const courts = { ...cl.courts };
      if (isCourtSport(a) && !on && !courts[a]) courts[a] = 1;
      return { ...cl, sports, courts };
    });
    if (clubErr.sports) setClubErr((e) => ({ ...e, sports: undefined }));
  };
  const setCourts = (sp: Sport, n: number) =>
    setClub((cl) => ({ ...cl, courts: { ...cl.courts, [sp]: Math.max(1, Math.min(MAX_COURTS, n)) } }));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setBusy(false);
    }
  };

  const nextFromOwner = () => {
    const e = validateOwner(owner);
    setOwnerErr(e);
    if (hasErrors(e)) return;
    run(async () => {
      await checkOwner(owner);
      goTo(1);
    });
  };

  const nextFromClub = () => {
    const e = validateClub(club);
    setClubErr(e);
    if (!hasErrors(e)) goTo(2);
  };

  const submit = () => {
    const e: PwErrors = {};
    if (password.length < MIN_PASSWORD) e.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;
    else if (password !== confirm) e.confirm = 'Mật khẩu nhập lại không khớp.';
    setPwErr(e);
    const code = salesCode.trim();
    if (!rep && !code) setSalesErr('Nhập mã nhân viên Arena đã hướng dẫn bạn đăng ký.');
    if (hasErrors(e) || (!rep && !code)) return;
    run(async () => {
      // Chưa bấm "Kiểm tra mã" thì xác minh luôn khi tạo; mã sai thì báo ngay dưới ô mã
      let r = rep;
      if (!r) {
        try {
          r = await verifySalesCode(code);
          setRep(r);
        } catch (err) {
          setSalesErr((err as Error).message);
          return;
        }
      }
      await register({ owner, club, salesCode: r.code }, password);
      // Bỏ màn đăng nhập nằm dưới trong stack để vào quản lý như đăng nhập thường
      if (router.canDismiss()) router.dismissAll();
      router.replace(ADMIN_HOME);
    });
  };

  const checkSales = () => {
    if (!salesCode.trim()) return setSalesErr('Nhập mã nhân viên Arena đã hướng dẫn bạn đăng ký.');
    setChecking(true);
    setSalesErr(null);
    verifySalesCode(salesCode)
      .then(setRep)
      .catch((err: Error) => setSalesErr(err.message))
      .finally(() => setChecking(false));
  };
  const changeSales = () => {
    setRep(null);
    setSalesErr(null);
  };

  const back = () => {
    if (step > 0) return goTo(step - 1);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const toLogin = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          {/* Đầu trang tối: vạch sân như thẻ hội viên */}
          <View style={[s.hero, { backgroundColor: c.passBg, paddingTop: insets.top + 8 }]}>
            <View pointerEvents="none" style={[s.court, { borderColor: c.passTrack }]}>
              <View style={[s.courtMid, { backgroundColor: c.passTrack }]} />
              <View style={[s.courtCircle, { borderColor: c.passTrack }]} />
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel={step > 0 ? 'Quay lại bước trước' : 'Quay lại đăng nhập'} onPress={back} hitSlop={8} style={s.back}>
              <Icon name="chevronLeft" size={20} color={c.passInk} />
              <T size={14} w={600} color={c.passInk}>{step > 0 ? 'Quay lại' : 'Đăng nhập'}</T>
            </Pressable>

            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Num size={18} color={c.passMuted}>ARENA</Num>
                <View style={[s.dot, { backgroundColor: c.volt }]} />
              </View>
              <Num size={40} color={c.passInk}>CÂU LẠC BỘ MỚI</Num>
              <T size={14} color={c.passMuted}>Đăng ký để quản lý sân, lớp và hội viên trên Arena</T>
            </View>

            {/* Thanh bước */}
            <View accessibilityRole="progressbar" accessibilityLabel={`Bước ${step + 1} trên ${STEPS.length}: ${STEPS[step].title}`} style={s.steps}>
              {STEPS.map((st, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <View key={st.short} style={{ flex: 1, gap: 8 }}>
                    <View style={[s.stepBar, { backgroundColor: done ? c.passLine : active ? c.volt : c.passTrack }]} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[s.stepNum, { backgroundColor: done ? c.passLine : active ? c.volt : 'transparent', borderColor: done ? c.passLine : active ? c.volt : c.passTrack }]}>
                        {done ? <Icon name="check" size={12} color={c.passBg} /> : <T size={11} w={700} color={active ? c.onVolt : c.passMuted}>{i + 1}</T>}
                      </View>
                      <T size={12} w={active ? 700 : 500} color={active || done ? c.passInk : c.passMuted} numberOfLines={1} style={{ flex: 1 }}>{st.short}</T>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Thân trang: tấm nền sáng phủ lên đầu trang */}
          <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={{ gap: 4 }}>
              <Label>Bước {step + 1}/{STEPS.length}</Label>
              <T size={20} w={700}>{STEPS[step].title}</T>
              <T size={13} color={c.inkMuted}>{STEPS[step].sub}</T>
            </View>

            {error && <Banner tone="danger" text={error} />}

            {step === 0 && (
              <>
                <AuthField
                  label="Họ và tên người đại diện"
                  icon="person"
                  value={owner.name}
                  onChangeText={setO('name')}
                  placeholder="VD: Nguyễn Văn An"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  error={ownerErr.name}
                />
                <AuthField
                  ref={phoneRef}
                  label="Số điện thoại"
                  icon="phone"
                  value={owner.phone}
                  onChangeText={setO('phone', formatPhone)}
                  placeholder="VD: 0908 111 222"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  hint="Dùng để đăng nhập vào Arena."
                  error={ownerErr.phone}
                />
                <AuthField
                  ref={emailRef}
                  label="Email"
                  icon="mail"
                  value={owner.email}
                  onChangeText={setO('email', (v) => v.trim())}
                  placeholder="VD: an.nguyen@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="go"
                  onSubmitEditing={nextFromOwner}
                  hint="Nhận hoá đơn và khôi phục mật khẩu."
                  error={ownerErr.email}
                />
                <Btn label={busy ? 'Đang kiểm tra…' : 'Tiếp tục'} disabled={busy} onPress={nextFromOwner} style={{ minHeight: 50 }} />
                <View style={[s.note, { backgroundColor: c.infoTint }]}>
                  <Icon name="info" size={18} color={c.info} />
                  <T size={12} color={c.info} style={{ flex: 1 }}>
                    Mỗi câu lạc bộ có <T size={12} w={700} color={c.info}>một tài khoản quản lý</T>, đứng tên người đại diện. Lễ tân, HLV và nhân viên khác không cần đăng ký.
                  </T>
                </View>
              </>
            )}

            {step === 1 && (
              <>
                <AuthField
                  label="Tên câu lạc bộ"
                  icon="trophy"
                  value={club.name}
                  onChangeText={setC('name')}
                  placeholder="VD: Arena Sport Quận 7"
                  autoCapitalize="words"
                  autoComplete="organization"
                  textContentType="organizationName"
                  returnKeyType="done"
                  hint="Tên hiển thị cho khách khi đặt sân và trên hoá đơn."
                  error={clubErr.name}
                />
                <AddressPicker
                  value={{ address: club.address, province: club.province, provinceCode: club.provinceCode, ward: club.ward, wardCode: club.wardCode, location: club.location }}
                  onChange={setAddress}
                  errors={{ address: clubErr.address, ward: clubErr.ward, province: clubErr.province }}
                />

                {/* Môn kinh doanh */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <T size={13} w={600}>Môn kinh doanh</T>
                    <T size={12} color={c.inkMuted}>{club.sports.length ? `Đã chọn ${club.sports.length}` : 'Chọn một hoặc nhiều'}</T>
                  </View>
                  <View accessibilityRole="list" style={s.sportGrid}>
                    {SIGNUP_SPORTS.map((a) => {
                      const on = club.sports.includes(a);
                      return (
                        <Pressable
                          key={a}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          accessibilityLabel={SPORT_ICON[a].label}
                          onPress={() => toggleSport(a)}
                          style={({ pressed }) => [
                            s.sportTile,
                            { borderColor: on ? c.brand : clubErr.sports ? c.danger : c.line, backgroundColor: on ? c.brandWash : c.surfaceRaised },
                            on && { borderWidth: 2, padding: 9 },
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <SportBadge sport={a} size={34} />
                          <T size={12} w={on ? 700 : 500} numberOfLines={1}>{SPORT_ICON[a].label}</T>
                          {on && (
                            <View style={[s.tick, { backgroundColor: c.brand }]}>
                              <Icon name="check" size={10} color={c.onBrand} />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                  {clubErr.sports && (
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <Icon name="alert" size={14} color={c.danger} />
                      <T size={12} color={c.danger}>{clubErr.sports}</T>
                    </View>
                  )}
                </View>

                {/* Số sân theo từng môn sân đã chọn */}
                {courtSports.length > 0 && (
                  <View style={[s.panel, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
                    <View style={{ gap: 2 }}>
                      <T size={13} w={600}>Số sân</T>
                      <T size={12} color={c.inkMuted}>Arena tạo sẵn danh sách sân theo số này để bạn nhận đặt sân ngay.</T>
                    </View>
                    {courtSports.map((sp, i) => {
                      const n = club.courts[sp] ?? 1;
                      return (
                        <View key={sp} style={[s.courtRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.lineSoft }]}>
                          <SportBadge sport={sp} size={32} />
                          <T w={600} style={{ flex: 1 }} numberOfLines={1}>{SPORT_ICON[sp].label}</T>
                          <Stepper
                            label={SPORT_ICON[sp].label}
                            value={n}
                            onMinus={() => setCourts(sp, n - 1)}
                            onPlus={() => setCourts(sp, n + 1)}
                            min={1}
                            max={MAX_COURTS}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={s.actions}>
                  <Btn label="Quay lại" kind="secondary" onPress={back} style={{ flex: 1, minHeight: 50 }} />
                  <Btn label="Tiếp tục" onPress={nextFromClub} style={{ flex: 2, minHeight: 50 }} />
                </View>
              </>
            )}

            {step === 2 && (
              <>
                {/* Tóm tắt hồ sơ */}
                <View style={[s.panel, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
                  <Summary title="Người đại diện" onEdit={() => goTo(0)}>
                    <T w={700}>{owner.name.trim()}</T>
                    <T size={12} color={c.inkMuted}>{owner.phone}</T>
                    <T size={12} color={c.inkMuted}>{owner.email}</T>
                  </Summary>
                  <View style={{ height: 1, backgroundColor: c.lineSoft }} />
                  <Summary title="Câu lạc bộ" onEdit={() => goTo(1)}>
                    <T w={700}>{club.name.trim()}</T>
                    <T size={12} color={c.inkMuted}>{fullAddress(club)}</T>
                    {club.location && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="pin" size={13} color={c.brand} />
                        <T size={12} w={600} color={c.brandInk}>Đã ghim vị trí trên bản đồ</T>
                      </View>
                    )}
                    <View style={s.chips}>
                      {club.sports.map((a) => (
                        <View key={a} style={[s.chip, { backgroundColor: c.surfaceSunken }]}>
                          <T size={12} w={600}>
                            {SPORT_ICON[a].label}
                            {isCourtSport(a) ? ` · ${club.courts[a] ?? 1} sân` : ''}
                          </T>
                        </View>
                      ))}
                    </View>
                  </Summary>
                </View>

                {/* Nhân viên tư vấn: mã nhân viên tiếp thị Arena – xác minh để ghi nhận doanh số */}
                <View style={[s.panel, { backgroundColor: c.surfaceRaised, borderColor: salesErr ? c.danger : c.line }]}>
                  <View style={{ gap: 2 }}>
                    <Label>Nhân viên tư vấn</Label>
                    <T size={12} color={c.inkMuted}>Mã của nhân viên Arena đã hướng dẫn bạn đăng ký – để Arena ghi nhận và hỗ trợ bạn sau này.</T>
                  </View>
                  {rep ? (
                    <View style={[s.rep, { backgroundColor: c.brandWash, borderColor: c.brandTint }]}>
                      <Avatar name={rep.name} size={42} ring />
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <T w={700} numberOfLines={1}>{rep.name}</T>
                        <T size={12} color={c.inkMuted} numberOfLines={2}>{rep.code} · {rep.team}</T>
                        <Badge label="✓ Đã xác minh" tone="success" />
                      </View>
                      <Pressable accessibilityRole="button" accessibilityLabel="Đổi mã nhân viên tư vấn" onPress={changeSales} hitSlop={8} style={[s.change, { borderColor: c.lineStrong }]}>
                        <T size={12} w={700} color={c.brandInk}>Đổi</T>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <AuthField
                        label="Mã nhân viên tư vấn"
                        icon="idcard"
                        value={salesCode}
                        onChangeText={(v) => {
                          setSalesCode(v.toUpperCase());
                          if (salesErr) setSalesErr(null);
                        }}
                        placeholder="VD: MKT001"
                        autoCapitalize="characters"
                        autoComplete="off"
                        maxLength={12}
                        returnKeyType="go"
                        onSubmitEditing={checkSales}
                        hint="In trên thẻ nhân viên hoặc danh thiếp của nhân viên tư vấn."
                        error={salesErr}
                      />
                      <Btn label={checking ? 'Đang kiểm tra…' : 'Kiểm tra mã'} kind="secondary" icon="check" disabled={checking} onPress={checkSales} />
                    </>
                  )}
                </View>

                <View style={{ gap: 8 }}>
                  <AuthField
                    label="Mật khẩu"
                    icon="lock"
                    value={password}
                    onChangeText={setPw('password', setPassword)}
                    placeholder={`Ít nhất ${MIN_PASSWORD} ký tự`}
                    secure
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    error={pwErr.password}
                  />
                  {password.length > 0 && !pwErr.password && (
                    <View style={{ gap: 6 }}>
                      <View accessibilityLabel={`Độ mạnh mật khẩu: ${strength.label}`} style={{ flexDirection: 'row', gap: 4 }}>
                        {[1, 2, 3, 4].map((n) => (
                          <View key={n} style={[s.meter, { backgroundColor: n <= strength.score ? strengthColor : c.line }]} />
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        <T size={12} color={c.inkMuted} style={{ flex: 1 }}>Nên dùng cả chữ, số và ký tự đặc biệt.</T>
                        <T size={12} w={700} color={strengthColor}>{strength.label}</T>
                      </View>
                    </View>
                  )}
                </View>

                <AuthField
                  ref={confirmRef}
                  label="Nhập lại mật khẩu"
                  icon="lock"
                  value={confirm}
                  onChangeText={setPw('confirm', setConfirm)}
                  placeholder="Nhập lại mật khẩu"
                  secure
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  valid={matches}
                  error={pwErr.confirm}
                />

                <T size={12} color={c.inkMuted}>Bấm “Tạo câu lạc bộ” là bạn xác nhận thông tin trên là chính xác và bạn có quyền đại diện cho câu lạc bộ.</T>

                <View style={s.actions}>
                  <Btn label="Quay lại" kind="secondary" onPress={back} disabled={busy} style={{ flex: 1, minHeight: 50 }} />
                  <Btn label={busy ? 'Đang tạo…' : 'Tạo câu lạc bộ'} disabled={busy} onPress={submit} style={{ flex: 2, minHeight: 50 }} />
                </View>
              </>
            )}

            <View style={s.footer}>
              <T size={13} color={c.inkMuted}>Đã có tài khoản?</T>
              <Pressable accessibilityRole="button" onPress={toLogin} hitSlop={6}>
                <T size={13} w={700} color={c.brandInk}>Đăng nhập</T>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Nút − số + */
function Stepper({ label, value, onMinus, onPlus, min, max }: { label: string; value: number; onMinus: () => void; onPlus: () => void; min: number; max: number }) {
  const c = useColors();
  const btn = (sign: '−' | '+', onPress: () => void, disabled: boolean, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [s.stepBtn, { borderColor: c.lineStrong, backgroundColor: pressed ? c.surfaceSunken : c.surfaceRaised, opacity: disabled ? 0.35 : 1 }]}
    >
      <T size={18} w={600}>{sign}</T>
    </Pressable>
  );
  return (
    <View accessibilityRole="adjustable" accessibilityLabel={`Số sân ${label}`} accessibilityValue={{ min, max, now: value }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {btn('−', onMinus, value <= min, `Bớt một sân ${label}`)}
      <Num size={22} style={{ minWidth: 28, textAlign: 'center' }}>{value}</Num>
      {btn('+', onPlus, value >= max, `Thêm một sân ${label}`)}
    </View>
  );
}

/** Một mục trong phần tóm tắt, có nút Sửa quay về bước tương ứng */
function Summary({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>{title}</Label>
        <Pressable accessibilityRole="button" accessibilityLabel={`Sửa ${title.toLowerCase()}`} onPress={onEdit} hitSlop={8}>
          <T size={13} w={700} color={c.brandInk}>Sửa</T>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 44, gap: 22, overflow: 'hidden' },
  court: { position: 'absolute', right: -70, top: 36, width: 230, height: 170, borderWidth: 2, borderRadius: 4 },
  courtMid: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, marginLeft: -1 },
  courtCircle: { position: 'absolute', left: '50%', top: '50%', width: 64, height: 64, marginLeft: -32, marginTop: -32, borderRadius: 32, borderWidth: 2 },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  steps: { flexDirection: 'row', gap: 10 },
  stepBar: { height: 4, borderRadius: 2 },
  stepNum: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  sheet: { flex: 1, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 24, gap: 18 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: radius.md },
  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportTile: { width: '31.5%', flexGrow: 1, alignItems: 'center', gap: 6, padding: 10, borderRadius: radius.md, borderWidth: 1 },
  tick: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  panel: { padding: 14, borderRadius: radius.lg, borderWidth: 1, gap: 12 },
  courtRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  rep: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  change: { height: 32, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, height: 26, borderRadius: 999, justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  meter: { flex: 1, height: 4, borderRadius: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 'auto', paddingTop: 8 },
});
