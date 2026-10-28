import { router } from 'expo-router';
import { View } from 'react-native';
import { Badge, Bar, ListRow, Screen, SportBadge } from '../../../components/kit';
import { T } from '../../../components/ui';
import { useTournaments } from '../../../hooks/useAdmin';
import { useColors } from '../../../theme/tokens';

export default function AdminTournaments() {
  const c = useColors();
  const { data: list = [] } = useTournaments();
  return (
    <Screen title="Giải đấu" sub={`${list.length} giải · ${list.filter((t) => t.status === 'open').length} đang nhận đăng ký`} back>
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
      <T size={12} color={c.inkMuted}>Tạo giải mới (5 bước, xem trước sơ đồ) trên website quản trị.</T>
    </Screen>
  );
}
