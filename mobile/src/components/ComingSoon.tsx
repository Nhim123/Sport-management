import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../theme/tokens';
import { Card, Num, T } from './ui';

export function ComingSoon({ title }: { title: string }) {
  const c = useColors();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.surface }}>
      <View style={{ padding: 20, gap: 16 }}>
        <Num size={28}>{title}</Num>
        <Card>
          <T color={c.inkMuted}>Màn hình này chưa có trong bản thiết kế Arena.</T>
        </Card>
      </View>
    </SafeAreaView>
  );
}
