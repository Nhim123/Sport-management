import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Avatar, Badge, Banner, Screen, Segmented } from '../../components/kit';
import { Card, Label, T } from '../../components/ui';
import { useStaff } from '../../hooks/useAdmin';
import { useColors } from '../../theme/tokens';
import type { Shift } from '../../types/admin';

const TODAY = 6; // CN 18/10
const SHIFTS: { id: Shift; label: string; time: string }[] = [
  { id: 'S', label: 'Ca sáng', time: '06:00–12:00' },
  { id: 'C', label: 'Ca chiều', time: '12:00–17:00' },
  { id: 'T', label: 'Ca tối', time: '17:00–23:00' },
];

export default function AdminStaff() {
  const c = useColors();
  const { data: staff = [] } = useStaff();
  const [tab, setTab] = useState<'today' | 'list'>('today');
  const gaps = SHIFTS.filter((s) => !staff.some((x) => x.role === 'reception' && x.week[TODAY] === s.id));
  const off = staff.filter((x) => x.week[TODAY] === 'off' || x.week[TODAY] === 'P');

  return (
    <Screen title="Nhân viên" sub="Chủ nhật 18/10 · đang trong ca tối" back>
      <Segmented options={[{ id: 'today', label: 'Ca hôm nay' }, { id: 'list', label: `Danh sách ${staff.length}` }]} value={tab} onChange={setTab} />

      {tab === 'today' ? (
        <>
          {gaps.length > 0 ? (
            <Banner tone="warning" text={`Chưa có lễ tân: ${gaps.map((g) => g.label.toLowerCase()).join(', ')}.`} />
          ) : (
            <Banner text="Mọi ca hôm nay đều có lễ tân trực." />
          )}
          {SHIFTS.map((s) => {
            const on = staff.filter((x) => x.week[TODAY] === s.id);
            return (
              <Card key={s.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <T w={700}>{s.label}</T>
                    {s.id === 'T' && <Badge label="Đang diễn ra" tone="volt" />}
                  </View>
                  <T size={12} color={c.inkMuted}>{s.time}</T>
                </View>
                {on.length === 0 && <T size={13} color={c.inkMuted}>Không ai trực.</T>}
                {on.map((x) => (
                  <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar name={x.name} size={32} ring={s.id === 'T'} />
                    <View style={{ flex: 1 }}>
                      <T w={600} size={14}>{x.name}</T>
                      <T size={12} color={c.inkMuted}>{x.roleLabel}</T>
                    </View>
                  </View>
                ))}
              </Card>
            );
          })}
          {off.length > 0 && (
            <Card style={{ gap: 6 }}>
              <Label>Nghỉ hôm nay</Label>
              {off.map((x) => (
                <T key={x.id} size={14}>{x.name} <T size={12} color={c.inkMuted}>· {x.week[TODAY] === 'P' ? 'nghỉ phép' : 'nghỉ'}</T></T>
              ))}
            </Card>
          )}
        </>
      ) : (
        staff.map((x) => (
          <Card key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={x.name} size={40} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <T w={600} numberOfLines={1}>{x.name}</T>
              <T size={12} color={c.inkMuted}>{x.code} · {x.roleLabel}</T>
              {x.status === 'leave' && <Badge label={x.note ?? 'Nghỉ phép'} tone="warning" />}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Gọi ${x.name}`}
              onPress={() => Linking.openURL(`tel:${x.phone.replace(/\s/g, '')}`)}
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.brandTint }}
            >
              <Icon name="phone" size={20} color={c.brandInk} />
            </Pressable>
          </Card>
        ))
      )}
      <T size={12} color={c.inkMuted}>Xếp lịch ca, phân quyền và bảng lương trên website quản trị.</T>
    </Screen>
  );
}
