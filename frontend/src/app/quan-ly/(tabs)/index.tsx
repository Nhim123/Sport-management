import { router, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { courtLive, NOW_HOUR } from '../../../api/admin.api';
import { Icon, type IconName } from '../../../components/Icon';
import { Avatar, Badge, Bar, LIVE, ListRow, Screen, SectionHead, SportBadge, StatTile } from '../../../components/kit';
import { Card, Num, T } from '../../../components/ui';
import { useDashboard, useDayBookings, useMembers } from '../../../hooks/useAdmin';
import { useCourts } from '../../../hooks/useCourts';
import { useAuth } from '../../../store/auth';
import { radius, useColors } from '../../../theme/tokens';

const ACTIONS: { label: string; icon: IconName; href: Href }[] = [
  { label: 'Đặt sân', icon: 'calendar', href: '/quan-ly/lich-san' },
  { label: 'Trạng thái sân', icon: 'activity', href: '/quan-ly/trang-thai' },
  { label: 'Check-in', icon: 'qr', href: '/quan-ly/hoi-vien' },
  { label: 'Báo cáo', icon: 'chart', href: '/quan-ly/bao-cao' },
];

export default function AdminHome() {
  const c = useColors();
  const { data: d } = useDashboard();
  const { user } = useAuth();
  const { data: bookings = [] } = useDayBookings();
  const { data: courts = [] } = useCourts();
  const { data: members = [] } = useMembers();

  if (!d) {
    return (
      <Screen title="Tổng quan">
        <ActivityIndicator color={c.brand} />
      </Screen>
    );
  }

  const live = courts.map((ct) => ({ ct, l: courtLive(ct.id, bookings, NOW_HOUR) }));
  const renew = d.renew.map((code) => members.find((m) => m.code === code)).filter((m) => !!m);

  return (
    <Screen title={d.dateLabel} sub={`${(user?.name ?? d.staffName)} · ${(user?.roleLabel ?? d.staffRole)} · ${d.shift}`} right={<Avatar name={(user?.name ?? d.staffName)} ring />}>
      <View style={st.grid}>
        {d.kpis.map((k, i) => (
          <StatTile
            key={k.label}
            label={k.label}
            value={k.value}
            hint={(k.delta ? k.delta + ' ' : '') + k.hint}
            hintColor={k.delta ? (k.up ? c.brand : c.danger) : undefined}
            highlight={i === 0}
          />
        ))}
      </View>

      <View style={st.actions}>
        {ACTIONS.map((a) => (
          <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} style={st.action}>
            <View style={[st.actionIc, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
              <Icon name={a.icon} color={c.brand} />
            </View>
            <T size={12} w={600} style={{ textAlign: 'center' }}>{a.label}</T>
          </Pressable>
        ))}
      </View>

      <SectionHead title="Sân lúc này · 19:00" action="Xem tất cả" onAction={() => router.push('/quan-ly/trang-thai')} />
      <Card style={{ padding: 0 }}>
        {live.map(({ ct, l }, i) => (
          <View key={ct.id} style={[st.liveRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.lineSoft }]}>
            <SportBadge sport={ct.sport} size={32} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w={600}>{ct.name}</T>
              <T size={12} color={c.inkMuted} numberOfLines={1}>
                {l.current ? l.current.label : l.next ? `Tiếp: ${l.next.start}:00 · ${l.next.label}` : 'Trống tới khi đóng cửa'}
              </T>
            </View>
            <Badge label={LIVE[l.kind].label} tone={LIVE[l.kind].tone} />
          </View>
        ))}
      </Card>

      <SectionHead title="Lớp học hôm nay" />
      <Card style={{ padding: 0 }}>
        {d.classes.map((k, i) => (
          <View key={k.time + k.name} style={[st.liveRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.lineSoft }]}>
            <Num size={20} color={c.clay} style={{ width: 52 }}>{k.time}</Num>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w={600}>{k.name}</T>
              <T size={12} color={c.inkMuted}>{k.coach} · {k.room}</T>
            </View>
            <View style={{ width: 64, gap: 4, alignItems: 'flex-end' }}>
              <Num size={16} w={600}>{k.booked}/{k.cap}</Num>
              <View style={{ width: 64 }}>
                <Bar pct={(k.booked / k.cap) * 100} color={k.booked >= k.cap ? c.danger : c.clay} />
              </View>
            </View>
          </View>
        ))}
      </Card>

      <SectionHead title="Cần gia hạn" action="Hội viên" onAction={() => router.push('/quan-ly/hoi-vien')} />
      {renew.map((m) => (
        <ListRow key={m!.code} onPress={() => router.push({ pathname: '/quan-ly/hoi-vien/[code]', params: { code: m!.code } })} accessibilityLabel={`${m!.name}, ${m!.status}`}>
          <Avatar name={m!.name} size={36} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T w={600} numberOfLines={1}>{m!.name}</T>
            <T size={12} color={c.inkMuted} numberOfLines={1}>{m!.plan} · {m!.remain}</T>
          </View>
          <Badge label={m!.status} tone={m!.tone} />
        </ListRow>
      ))}
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { flex: 1, alignItems: 'center', gap: 6, minHeight: 44 },
  actionIc: { width: 56, height: 56, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
});
