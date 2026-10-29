import { router, type Href } from 'expo-router';
import { View } from 'react-native';
import { Icon, type IconName } from '../../../components/Icon';
import { Avatar, ListRow, Screen } from '../../../components/kit';
import { Card, T } from '../../../components/ui';
import { useDashboard } from '../../../hooks/useAdmin';
import { useAuth } from '../../../store/auth';
import { radius, useColors } from '../../../theme/tokens';

const ITEMS: { label: string; sub: string; icon: IconName; href: Href }[] = [
  { label: 'Trạng thái sân', sub: 'Sân đang dùng, check-in, thu cọc, khóa sân', icon: 'activity', href: '/quan-ly/trang-thai' },
  { label: 'Giải đấu', sub: 'Danh sách, cặp đấu, mở/đóng đăng ký', icon: 'trophy', href: '/quan-ly/giai-dau' as Href },
  { label: 'Gói tập', sub: 'Thống kê từng gói, gói theo yêu cầu', icon: 'tag', href: '/quan-ly/goi-tap' },
  { label: 'Nhân viên', sub: 'Ca làm hôm nay, danh bạ', icon: 'idcard', href: '/quan-ly/nhan-vien' },
  { label: 'Báo cáo doanh thu', sub: 'Tháng 10 · đặt sân & sản phẩm', icon: 'chart', href: '/quan-ly/bao-cao' },
];

export default function AdminMore() {
  const c = useColors();
  const { data: d } = useDashboard();
  const { user, logout } = useAuth();
  return (
    <Screen title="Thêm">
      {d && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar name={(user?.name ?? d.staffName)} size={48} />
          <View style={{ flex: 1 }}>
            <T w={700} size={16}>{(user?.name ?? d.staffName)}</T>
            <T size={13} color={c.inkMuted}>{(user?.roleLabel ?? d.staffRole)} · {d.shift}</T>
          </View>
        </Card>
      )}
      {ITEMS.map((it) => (
        <ListRow key={it.label} onPress={() => router.push(it.href)} accessibilityLabel={it.label}>
          <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={it.icon} color={c.brandInk} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T w={600}>{it.label}</T>
            <T size={12} color={c.inkMuted} numberOfLines={1}>{it.sub}</T>
          </View>
        </ListRow>
      ))}
      <T size={12} color={c.inkMuted}>Tạo giải 5 bước, soạn gói tập và xếp lịch ca làm trên website quản trị.</T>
      <ListRow onPress={() => { logout(); router.replace('/'); }} accessibilityLabel="Đăng xuất">
        <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.surfaceSunken, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" color={c.ink} />
        </View>
        <T w={600} style={{ flex: 1 }}>Đăng xuất</T>
      </ListRow>
    </Screen>
  );
}
