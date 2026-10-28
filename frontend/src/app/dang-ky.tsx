import { Redirect, router, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MIN_PASSWORD, verifyStaff } from '../api/auth.api';
import { Icon } from '../components/Icon';
import { Avatar, Badge, Banner, Btn, Field } from '../components/kit';
import { Card, Num, T } from '../components/ui';
import { useAuth } from '../store/auth';
import { useColors } from '../theme/tokens';
import type { StaffMember } from '../types/admin';

// Xem ghi chú ở màn đăng nhập: typed routes sinh sai đường dẫn index của nhóm (tabs).
const ADMIN_HOME = '/quan-ly' as Href;

const STEPS = ['Xác minh nhân viên', 'Đặt mật khẩu'];

/** Đăng ký tài khoản – bắt buộc mã nhân viên do quản lý cấp, khớp số điện thoại trong hồ sơ */
export default function Register() {
  const c = useColors();
  const { user, register } = useAuth();
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Redirect href={ADMIN_HOME} />;
  const step = staff ? 1 : 0;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = () => {
    if (!code.trim()) return setError('Mã nhân viên là bắt buộc để tạo tài khoản.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Nhập số điện thoại đã đăng ký trong hồ sơ nhân viên.');
    run(async () => setStaff(await verifyStaff(code, phone)));
  };

  const submit = () => {
    if (password.length < MIN_PASSWORD) return setError(`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`);
    if (password !== confirm) return setError('Mật khẩu nhập lại không khớp.');
    run(async () => {
      await register(code, phone, password);
      // Bỏ màn đăng nhập nằm dưới trong stack để vào quản lý như đăng nhập thường
      if (router.canDismiss()) router.dismissAll();
      router.replace(ADMIN_HOME);
    });
  };

  const editStaff = () => {
    setStaff(null);
    setPassword('');
    setConfirm('');
    setError(null);
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại đăng nhập" onPress={back} hitSlop={8} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="chevronLeft" size={20} color={c.ink} />
            <T size={14} w={600}>Đăng nhập</T>
          </Pressable>

          <View style={{ gap: 6 }}>
            <Num size={34}>TẠO TÀI KHOẢN</Num>
            <T size={14} color={c.inkMuted}>Dành cho nhân viên quản lý và lễ tân. Cần mã nhân viên do quản lý cấp – không có mã thì không tạo được tài khoản.</T>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <View key={label} style={{ flex: 1, gap: 6 }}>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: done || active ? c.brand : c.line }} />
                  <T size={12} w={active ? 700 : 500} color={active ? c.ink : c.inkMuted}>
                    {i + 1}. {label}{done ? ' ✓' : ''}
                  </T>
                </View>
              );
            })}
          </View>

          {error && <Banner tone="danger" text={error} />}

          {step === 0 ? (
            <Card style={{ gap: 14, padding: 16 }}>
              <View style={{ gap: 6 }}>
                <Field label="Mã nhân viên *" value={code} onChangeText={setCode} placeholder="VD: NV03" autoCapitalize="characters" />
                <T size={12} color={c.inkMuted}>Bắt buộc. Mã in trên thẻ nhân viên hoặc hỏi quản lý câu lạc bộ.</T>
              </View>
              <View style={{ gap: 6 }}>
                <Field label="Số điện thoại trong hồ sơ *" value={phone} onChangeText={setPhone} placeholder="VD: 0935 402 118" keyboardType="phone-pad" onSubmitEditing={verify} />
                <T size={12} color={c.inkMuted}>Dùng để xác nhận bạn là chủ của mã nhân viên này.</T>
              </View>
              <Btn label={busy ? 'Đang kiểm tra…' : 'Tiếp tục'} disabled={busy} onPress={verify} />
            </Card>
          ) : (
            staff && (
              <Card style={{ gap: 14, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={staff.name} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w={700} numberOfLines={1}>{staff.name}</T>
                    <T size={13} color={c.inkMuted}>{staff.roleLabel} · {staff.code}</T>
                  </View>
                  <Badge label="Đã xác minh" tone="success" />
                </View>
                <Pressable accessibilityRole="button" onPress={editStaff} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
                  <T size={13} w={600} color={c.brandInk}>Không phải bạn? Nhập lại mã nhân viên</T>
                </Pressable>
                <View style={{ height: 1, backgroundColor: c.line }} />
                <Field label="Mật khẩu" value={password} onChangeText={setPassword} placeholder={`Ít nhất ${MIN_PASSWORD} ký tự`} secureTextEntry />
                <Field label="Nhập lại mật khẩu" value={confirm} onChangeText={setConfirm} placeholder="Nhập lại mật khẩu" secureTextEntry onSubmitEditing={submit} />
                <Btn label={busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản & vào quản lý'} disabled={busy} onPress={submit} />
              </Card>
            )
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 'auto' }}>
            <T size={13} color={c.inkMuted}>Đã có tài khoản?</T>
            <Pressable accessibilityRole="button" onPress={back} hitSlop={6}>
              <T size={13} w={700} color={c.brandInk}>Đăng nhập</T>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
