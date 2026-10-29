import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { courtLive, isFree, NOW_HOUR } from '../../api/admin.api';
import { Badge, Banner, Bar, Btn, Chip, ChipRow, LIVE, Screen, SportBadge } from '../../components/kit';
import { Card, T } from '../../components/ui';
import { useCreateDayBooking, useDayBookings, useRemoveBooking, useUpdateBooking } from '../../hooks/useAdmin';
import { useCourts } from '../../hooks/useCourts';
import { hh } from '../../lib/format';
import { useColors } from '../../theme/tokens';
import type { CourtLiveKind } from '../../types/admin';

type Group = 'all' | 'busy' | 'free' | 'pending' | 'blocked';
const GROUP_OF: Record<CourtLiveKind, Exclude<Group, 'all'>> = { inUse: 'busy', class: 'busy', soon: 'free', free: 'free', pending: 'pending', blocked: 'blocked' };
const GROUPS: { id: Group; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'busy', label: 'Đang dùng' },
  { id: 'free', label: 'Trống' },
  { id: 'pending', label: 'Chờ cọc' },
  { id: 'blocked', label: 'Bảo trì' },
];

const mins = (m: number) => (m < 60 ? `${m} phút` : `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ''}`);

export default function AdminCourtStatus() {
  const c = useColors();
  const { data: courts = [] } = useCourts();
  const { data: bookings = [] } = useDayBookings();
  const update = useUpdateBooking();
  const remove = useRemoveBooking();
  const create = useCreateDayBooking();
  const [group, setGroup] = useState<Group>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const all = courts.map((ct) => ({ ct, l: courtLive(ct.id, bookings, NOW_HOUR) }));
  const shown = all.filter(({ l }) => group === 'all' || GROUP_OF[l.kind] === group);
  const count = (g: Group) => (g === 'all' ? all.length : all.filter(({ l }) => GROUP_OF[l.kind] === g).length);

  return (
    <Screen title="Trạng thái sân" sub="Chủ nhật 18/10 · 19:00" back>
      <ChipRow>
        {GROUPS.map((g) => (
          <Chip key={g.id} label={g.label} count={count(g.id)} on={group === g.id} onPress={() => setGroup(g.id)} />
        ))}
      </ChipRow>
      {notice && <Banner text={notice} />}

      {shown.map(({ ct, l }) => {
        const cur = l.current;
        return (
          <Card key={ct.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <SportBadge sport={ct.sport} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w={700} size={16}>{ct.name}</T>
                <T size={12} color={c.inkMuted}>{ct.kind}</T>
              </View>
              <Badge label={LIVE[l.kind].label} tone={LIVE[l.kind].tone} />
            </View>

            {cur ? (
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <T w={600} numberOfLines={1} style={{ flex: 1 }}>{cur.label}{cur.sub ? ` · ${cur.sub}` : ''}</T>
                  <T size={13} color={c.inkMuted}>{hh(cur.start)}–{hh(cur.start + cur.span)}</T>
                </View>
                <Bar pct={l.progress * 100} color={l.kind === 'pending' ? c.warning : l.kind === 'class' ? c.clay : c.brand} />
                <T size={12} color={c.inkMuted}>
                  {l.kind === 'blocked' ? `Mở lại sau ${mins(l.minutesLeft)}` : `Còn ${mins(l.minutesLeft)}`}
                  {l.kind === 'inUse' ? (cur.checkedIn ? ' · đã check-in' : ' · khách chưa check-in') : ''}
                </T>
              </View>
            ) : (
              <T size={13} color={c.inkMuted}>{l.next ? `Trống ${mins(l.minutesLeft)} · tiếp theo ${hh(l.next.start)} ${l.next.label}` : 'Trống tới khi đóng cửa'}</T>
            )}
            {cur && l.next && <T size={12} color={c.inkMuted}>Tiếp theo: {hh(l.next.start)} · {l.next.label}</T>}

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {l.kind === 'inUse' && cur && !cur.checkedIn && (
                <Btn label="Check-in" kind="volt" onPress={() => update.mutate({ id: cur.id, patch: { checkedIn: true } }, { onSuccess: () => setNotice(`Đã check-in ${cur.label} · ${ct.name}.`) })} style={{ flex: 1 }} />
              )}
              {l.kind === 'pending' && cur && (
                <Btn label="Thu cọc" onPress={() => update.mutate({ id: cur.id, patch: { state: 'booked', sub: undefined, checkedIn: true } }, { onSuccess: () => setNotice(`Đã thu cọc ${cur.label} · ${ct.name}.`) })} style={{ flex: 1 }} />
              )}
              {l.kind === 'blocked' && cur && (
                <Btn label="Mở khóa" kind="secondary" onPress={() => remove.mutate(cur.id, { onSuccess: () => setNotice(`Đã mở khóa ${ct.name}.`) })} style={{ flex: 1 }} />
              )}
              {!cur && (
                <>
                  <Btn label="Đặt sân" onPress={() => router.push({ pathname: '/quan-ly/lich-san', params: { court: ct.id } })} style={{ flex: 1 }} />
                  <Btn
                    label="Khóa 1 giờ"
                    kind="secondary"
                    disabled={!isFree(bookings, ct.id, NOW_HOUR, 1)}
                    onPress={() => create.mutate({ courtId: ct.id, start: NOW_HOUR, span: 1, state: 'blocked', label: 'Khóa tạm', sub: 'Lễ tân khóa' }, { onSuccess: () => setNotice(`Đã khóa ${ct.name} 19:00–20:00.`) })}
                    style={{ flex: 1 }}
                  />
                </>
              )}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
