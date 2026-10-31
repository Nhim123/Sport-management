import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { Badge, Bar, ListRow, Screen, SportBadge } from '../../../components/kit';
import { T } from '../../../components/ui';
import { useTournaments } from '../../../hooks/useAdmin';
import { radius, useColors } from '../../../theme/tokens';

export default function AdminTournaments() {
  const c = useColors();
  const { data: list = [] } = useTournaments();
  // Nút nổi góc dưới – luôn thấy khi cuộn danh sách
  const fab = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tạo giải đấu"
      onPress={() => router.push('/quan-ly/giai-dau/tao')}
      style={({ pressed }) => [st.fab, { backgroundColor: c.brand, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <Icon name="plus" color={c.onBrand} />
      <T w={700} color={c.onBrand}>Tạo giải đấu</T>
    </Pressable>
  );
  return (
    <Screen title="Giải đấu" sub={`${list.length} giải · ${list.filter((t) => t.status === 'open').length} đang nhận đăng ký`} back footer={fab}>
      {list.length === 0 && (
        <View style={st.empty}>
          <Icon name="trophy" size={36} color={c.inkMuted} />
          <T w={700}>Chưa có giải đấu nào</T>
          <T size={13} color={c.inkMuted} style={{ textAlign: 'center' }}>Bấm “Tạo giải đấu” để soạn giải mới trong 4 bước.</T>
        </View>
      )}
      {list.map((t) => (
        <ListRow key={t.id} onPress={() => router.push({ pathname: '/quan-ly/giai-dau/[id]', params: { id: t.id } })} accessibilityLabel={t.name}>
          <SportBadge sport={t.sport} size={44} />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <T w={700} numberOfLines={2}>{t.name}</T>
            <T size={12} color={c.inkMuted}>{t.dates}</T>
            <Badge label={t.status === 'open' ? 'Đang nhận đăng ký' : 'Nháp'} tone={t.status === 'open' ? 'success' : 'neutral'} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Bar pct={(t.entrants.length / t.maxEntrants) * 100} />
              </View>
              <T size={12} color={c.inkMuted}>{t.entrants.length}/{t.maxEntrants}</T>
            </View>
          </View>
        </ListRow>
      ))}
      <View style={{ height: 72 }} />
    </Screen>
  );
}

const st = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
});
