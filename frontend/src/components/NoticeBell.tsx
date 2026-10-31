import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useNotices } from '../hooks/useAdmin';
import { fonts, radius, useColors } from '../theme/tokens';
import { Icon } from './Icon';
import { T } from './ui';

/** Nút chuông ở góc tiêu đề; có việc cần xác nhận thì hiện số đếm đỏ và chuông rung nhẹ */
export function NoticeBell() {
  const c = useColors();
  const { data = [] } = useNotices();
  const pending = data.filter((n) => n.status === 'pending').length;
  const swing = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pending) return;
    const native = Platform.OS !== 'web';
    const ring = Animated.sequence([
      ...[1, -1, 0.6, -0.6, 0].map((v) => Animated.timing(swing, { toValue: v, duration: 90, easing: Easing.linear, useNativeDriver: native })),
      Animated.delay(4000),
    ]);
    const loop = Animated.loop(ring);
    loop.start();
    return () => loop.stop();
  }, [pending, swing]);

  const rotate = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pending ? `Thông báo, ${pending} việc cần xác nhận` : 'Thông báo'}
      onPress={() => router.push('/quan-ly/thong-bao' as Href)}
      style={({ pressed }) => [
        st.btn,
        { borderColor: pending ? c.brand : c.line, backgroundColor: pressed ? c.surfaceSunken : pending ? c.brandTint : c.surfaceRaised },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Icon name="bell" color={pending ? c.brandInk : c.ink} />
      </Animated.View>
      {pending > 0 && (
        <View style={[st.badge, { backgroundColor: c.danger, borderColor: c.surface }]}>
          <T size={11} color="#fff" style={{ fontFamily: fonts.sans700, lineHeight: 14 }}>{pending > 9 ? '9+' : pending}</T>
        </View>
      )}
    </Pressable>
  );
}

const st = StyleSheet.create({
  btn: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
