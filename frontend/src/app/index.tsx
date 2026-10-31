import { Redirect, router, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_ACCOUNT } from '../api/auth.api';
import { Badge, Banner, Btn, Field } from '../components/kit';
import { Card, Num, T } from '../components/ui';
import { useAuth } from '../store/auth';
import { useColors } from '../theme/tokens';

// Tổng quan quản lý là index trong nhóm (tabs): typed routes của Expo sinh sai đường dẫn này, khi chạy vẫn đúng.
const ADMIN_HOME = '/quan-ly' as Href;

/** Màn đăng nhập – đăng nhập xong vào thẳng chế độ quản lý */
export default function Login() {
  const c = useColors();
  const { user, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Redirect href={ADMIN_HOME} />;

  const submit = async (id = identifier, pw = password) => {
    if (!id.trim() || !pw) {
      setError('Nhập số điện thoại (hoặc mã nhân viên) và mật khẩu.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(id, pw);
      router.replace(ADMIN_HOME);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, gap: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Num size={44}>ARENA</Num>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.volt, borderWidth: 2, borderColor: c.ink }} />
            </View>
            <T size={17} w={600}>Quản lý câu lạc bộ</T>
            <T size={14} color={c.inkMuted}>Đăng nhập bằng tài khoản quản lý của câu lạc bộ.</T>
          </View>

          <Card style={{ gap: 14, padding: 16 }}>
            {error && <Banner tone="danger" text={error} />}
            <Field label="Số điện thoại hoặc mã nhân viên" value={identifier} onChangeText={setIdentifier} placeholder="VD: 0908 111 222 hoặc NV01" autoCapitalize="none" />
            <Field label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="Mật khẩu" secureTextEntry onSubmitEditing={() => submit()} />
            <Btn label={busy ? 'Đang đăng nhập…' : 'Đăng nhập'} disabled={busy} onPress={() => submit()} />
          </Card>

          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
            <T size={13} color={c.inkMuted}>Chưa có tài khoản?</T>
            <Pressable accessibilityRole="button" onPress={() => router.push('/dang-ky')} hitSlop={6}>
              <T size={13} w={700} color={c.brandInk}>Đăng ký bằng mã nhân viên</T>
            </Pressable>
          </View>

          {__DEV__ && (
            <Card style={{ gap: 10, borderStyle: 'dashed' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Badge label="Bản test" tone="volt" />
                <T size={12} color={c.inkMuted} style={{ flex: 1 }}>
                  Tài khoản thử {DEMO_ACCOUNT.identifier} · {DEMO_ACCOUNT.password}
                </T>
              </View>
              <Btn label="Vào nhanh bằng tài khoản thử" kind="secondary" icon="flash" disabled={busy} onPress={() => submit(DEMO_ACCOUNT.identifier, DEMO_ACCOUNT.password)} />
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
