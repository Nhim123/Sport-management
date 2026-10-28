import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { Avatar, Badge, Chip, ChipRow, ListRow, Screen } from '../../../components/kit';
import { T } from '../../../components/ui';
import { useMembers } from '../../../hooks/useAdmin';
import { fonts, radius, useColors } from '../../../theme/tokens';
import type { MemberGroup } from '../../../types/admin';

const GROUPS: { id: 'all' | MemberGroup; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang hoạt động' },
  { id: 'expiring', label: 'Sắp hết hạn' },
  { id: 'expired', label: 'Hết hạn' },
  { id: 'paused', label: 'Bảo lưu' },
];

export default function AdminMembers() {
  const c = useColors();
  const { data: members = [] } = useMembers();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<'all' | MemberGroup>('all');

  const k = q.trim().toLowerCase();
  const digits = k.replace(/\D/g, '');
  const rows = members.filter(
    (m) =>
      (group === 'all' || m.group === group) &&
      (!k || m.name.toLowerCase().includes(k) || m.code.toLowerCase().includes(k) || (digits.length > 2 && m.phone.replace(/\D/g, '').includes(digits))),
  );
  const inside = members.filter((m) => m.inside).length;

  return (
    <Screen title="Hội viên" sub={`${members.length} hội viên · ${inside} đang ở phòng tập`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surfaceRaised }}>
        <Icon name="search" size={18} color={c.inkMuted} />
        <TextInput
          accessibilityLabel="Tìm hội viên"
          value={q}
          onChangeText={setQ}
          placeholder="Tên, SĐT hoặc mã hội viên"
          placeholderTextColor={c.inkMuted}
          style={{ flex: 1, height: 44, color: c.ink, fontFamily: fonts.sans400, fontSize: 15 }}
        />
      </View>
      <ChipRow>
        {GROUPS.map((g) => (
          <Chip key={g.id} label={g.label} count={g.id === 'all' ? members.length : members.filter((m) => m.group === g.id).length} on={group === g.id} onPress={() => setGroup(g.id)} />
        ))}
      </ChipRow>

      {rows.length === 0 && <T color={c.inkMuted} style={{ textAlign: 'center', padding: 24 }}>Không tìm thấy hội viên phù hợp.</T>}
      {rows.map((m) => (
        <ListRow key={m.code} onPress={() => router.push({ pathname: '/quan-ly/hoi-vien/[code]', params: { code: m.code } })} accessibilityLabel={`${m.name}, ${m.status}`}>
          <Avatar name={m.name} size={40} ring={m.inside} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <T w={600} numberOfLines={1}>{m.name}</T>
            <T size={12} color={c.inkMuted} numberOfLines={1}>{m.code} · {m.plan}</T>
            <Badge label={m.status} tone={m.tone} />
          </View>
        </ListRow>
      ))}
    </Screen>
  );
}
