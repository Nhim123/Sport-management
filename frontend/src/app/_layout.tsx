import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../store/auth';
import { useColors } from '../theme/tokens';

// Tạo một lần cho cả vòng đời app.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export default function RootLayout() {
  const c = useColors();
  const [loaded, error] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  // Chưa có font thì chưa vẽ (lỗi tải font vẫn cho chạy bằng font hệ thống)
  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.surface } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="dang-ky" />
          <Stack.Screen name="quan-ly" />
        </Stack>
      </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
