import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ColorValue, type GestureResponderEvent } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '../../../components/Icon';
import { T } from '../../../components/ui';
import { fonts, useColors } from '../../../theme/tokens';

const tabIcon = (name: IconName) => ({ color }: { color: ColorValue }) => <Icon name={name} color={color} />;

/** Nút Quét QR nổi ở giữa thanh tab */
function ScanTabButton({ onPress, accessibilityState, 'aria-selected': ariaSelected }: { onPress?: (e: GestureResponderEvent) => void; accessibilityState?: { selected?: boolean }; 'aria-selected'?: boolean; children?: ReactNode }) {
  const c = useColors();
  const on = !!(accessibilityState?.selected ?? ariaSelected);
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel="Quét QR check-in" accessibilityState={{ selected: on }} aria-selected={on} onPress={onPress} style={st.scanWrap}>
      {({ pressed }) => (
        <>
          <View style={[st.scanBtn, { backgroundColor: on ? c.ink : c.brand, borderColor: c.surfaceRaised, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
            <Icon name="qr" size={26} color={on ? c.volt : c.onBrand} />
          </View>
          <T size={11} w={600} color={on ? c.brand : c.inkMuted}>Quét QR</T>
        </>
      )}
    </Pressable>
  );
}

export default function AdminTabs() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.inkMuted,
        tabBarStyle: { backgroundColor: c.surfaceRaised, borderTopColor: c.line, overflow: 'visible' },
        tabBarLabelStyle: { fontFamily: fonts.sans600, fontSize: 11 },
        sceneStyle: { backgroundColor: c.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tổng quan', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="lich-san" options={{ title: 'Lịch sân', tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen name="quet-qr" options={{ title: 'Quét QR', tabBarButton: (props) => <ScanTabButton {...props} /> }} />
      <Tabs.Screen name="hoi-vien" options={{ title: 'Hội viên', tabBarIcon: tabIcon('users') }} />
      <Tabs.Screen name="them" options={{ title: 'Thêm', tabBarIcon: tabIcon('grid') }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  scanWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4, gap: 2 },
  scanBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -24,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
