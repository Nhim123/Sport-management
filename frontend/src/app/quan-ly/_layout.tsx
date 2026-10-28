import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../store/auth';
import { useColors } from '../../theme/tokens';

/** Chế độ quản lý (nhân viên): tab chính + các màn chi tiết xếp chồng */
export default function AdminLayout() {
  const c = useColors();
  const { user } = useAuth();
  // Chưa đăng nhập → về màn đăng nhập
  if (!user) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.surface } }} />;
}
