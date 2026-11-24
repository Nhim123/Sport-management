// Ô nhập cho màn đăng nhập / đăng ký: icon đầu dòng, viền theo trạng thái (focus · lỗi · hợp lệ),
// lỗi hiện ngay dưới ô, nút hiện/ẩn mật khẩu.
import { forwardRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions, type TextInputProps, type TextStyle } from 'react-native';
import { fonts, radius, useColors } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { T } from './ui';

type Props = {
  label: string;
  icon: IconName;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  /** Chữ gợi ý dưới ô (ẩn khi có lỗi) */
  hint?: string;
  /** Lỗi của riêng ô này */
  error?: string | null;
  /** Hiện dấu ✓ khi giá trị đã hợp lệ */
  valid?: boolean;
  /** Ô mật khẩu: che chữ và có nút hiện/ẩn */
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  maxLength?: number;
  onSubmitEditing?: () => void;
};

/** Trên web, trình duyệt tự vẽ viền focus bên trong ô – khung ngoài đã đổi màu khi focus nên bỏ viền này */
// (Chrome dùng outline-style "auto" – kiểu này bỏ qua outline-width, nên phải đổi sang "solid" + độ dày 0.)
export const WEB_NO_OUTLINE: TextStyle = { outlineStyle: 'solid', outlineWidth: 0 };

/** Kiểu ref của ô nhập (để gọi .focus() chuyển ô) */
export type AuthFieldRef = ComponentRef<typeof TextInput>;

export const AuthField = forwardRef<AuthFieldRef, Props>(function AuthField(
  { label, icon, value, onChangeText, placeholder, hint, error, valid, secure, keyboardType, autoCapitalize, autoComplete, textContentType, returnKeyType, maxLength, onSubmitEditing },
  ref,
) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);

  const border = error ? c.danger : focused ? c.brand : c.lineStrong;
  const iconColor = error ? c.danger : focused || valid ? c.brand : c.inkMuted;

  return (
    <View style={{ gap: 6 }}>
      <T size={13} w={600}>{label}</T>
      <View style={[s.box, { borderColor: border, backgroundColor: c.surfaceRaised }, focused && !error && { borderWidth: 2, paddingHorizontal: 11 }]}>
        <Icon name={icon} size={18} color={iconColor} />
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.inkMuted}
          keyboardType={keyboardType}
          secureTextEntry={secure && !shown}
          autoCapitalize={autoCapitalize ?? (secure ? 'none' : undefined)}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          maxLength={maxLength}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[s.input, { color: c.ink, fontFamily: fonts.sans400 }, Platform.OS === 'web' && WEB_NO_OUTLINE]}
        />
        {valid && !error && (
          <View style={[s.ok, { backgroundColor: c.brand }]}>
            <Icon name="check" size={12} color={c.onBrand} />
          </View>
        )}
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onPress={() => setShown((v) => !v)}
            hitSlop={8}
            style={s.eye}
          >
            <Icon name={shown ? 'eyeOff' : 'eye'} size={18} color={c.inkMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={s.msg}>
          <Icon name="alert" size={14} color={c.danger} />
          <T size={12} color={c.danger} style={{ flex: 1 }}>{error}</T>
        </View>
      ) : hint ? (
        <T size={12} color={c.inkMuted}>{hint}</T>
      ) : null}
    </View>
  );
});

/** Số điện thoại VN dạng "0908 111 222" (giữ tối đa 11 chữ số) */
export function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

/** Độ mạnh mật khẩu 0–4 kèm nhãn; chỉ để gợi ý, quy tắc bắt buộc vẫn là độ dài tối thiểu */
export function passwordStrength(pw: string, min: number): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: '' };
  if (pw.length < min) return { score: 1, label: 'Quá ngắn' };
  let score = 1;
  if (pw.length >= 10) score++;
  if (/[a-z]/i.test(pw) && /\d/.test(pw)) score++;
  if (/[^a-z0-9]/i.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) score++;
  const s = Math.min(score, 4) as 1 | 2 | 3 | 4;
  return { score: s, label: ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][s] };
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12 },
  input: { flex: 1, height: '100%', fontSize: 15, minWidth: 0 },
  ok: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eye: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  msg: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
});
