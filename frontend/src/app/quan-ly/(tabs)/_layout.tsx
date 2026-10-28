import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '../../../components/Icon';
import { fonts, useColors } from '../../../theme/tokens';

const tabIcon = (name: IconName) => ({ color }: { color: ColorValue }) => <Icon name={name} color={color} />;

export default function AdminTabs() {
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
      <Tabs.Screen name="index" options={{ title: 'Tổng quan', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="lich-san" options={{ title: 'Lịch sân', tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen name="trang-thai" options={{ title: 'Sân', tabBarIcon: tabIcon('activity') }} />
      <Tabs.Screen name="hoi-vien" options={{ title: 'Hội viên', tabBarIcon: tabIcon('users') }} />
      <Tabs.Screen name="them" options={{ title: 'Thêm', tabBarIcon: tabIcon('grid') }} />
    </Tabs>
  );
}
