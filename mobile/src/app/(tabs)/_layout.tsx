import type { ColorValue } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Icon, type IconName } from '../../components/Icon';
import { fonts, useColors } from '../../theme/tokens';

const tabIcon = (name: IconName) => ({ color }: { color: ColorValue }) => <Icon name={name} color={color} />;

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.inkMuted,
        tabBarStyle: { backgroundColor: c.surfaceRaised, borderTopColor: c.line },
        tabBarLabelStyle: { fontFamily: fonts.sans600, fontSize: 11 },
        sceneStyle: { backgroundColor: c.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: tabIcon('home') }} />
      {/* Đặt sân mở màn toàn trang (ẩn tab bar) giống thiết kế */}
      <Tabs.Screen
        name="book"
        options={{ title: 'Đặt sân', tabBarIcon: tabIcon('calendar') }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/dat-san');
          },
        }}
      />
      <Tabs.Screen name="lop-hoc" options={{ title: 'Lớp học', tabBarIcon: tabIcon('dumbbell') }} />
      <Tabs.Screen name="tai-khoan" options={{ title: 'Tài khoản', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
