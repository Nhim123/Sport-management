import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { Badge, Screen, Segmented, SportBadge, StatTile } from '../../../components/kit';
import { Card, Num, T } from '../../../components/ui';
import { usePlans } from '../../../hooks/useAdmin';
import { vnd } from '../../../lib/format';
import { partLabel, partSport } from '../../../lib/plans';
import { radius, useColors } from '../../../theme/tokens';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const MONTHS = ['T5', 'T6', 'T7', 'T8', 'T9', 'T10'];

/** Gói tập của câu lạc bộ – mỗi gói ghép tuỳ ý từ phòng gym, giờ sân, lớp nhóm, PT, bơi */
export default function AdminPlans() {
  const c = useColors();
  const { data: plans = [] } = usePlans();
  const [tab, setTab] = useState<'club' | 'custom'>('club');
  const rows = plans.filter((p) => (tab === 'custom' ? !!p.custom : !p.custom));
  const last = (p: (typeof plans)[number]) => p.sales[p.sales.length - 1];
  const active = plans.reduce((s, p) => s + p.active, 0);
  const revenue = plans.reduce((s, p) => s + last(p) * p.price, 0);
  const withR = plans.filter((p) => p.renewal !== null);
  const renewal = withR.reduce((s, p) => s + p.renewal! * p.active, 0) / Math.max(1, withR.reduce((s, p) => s + p.active, 0));
  const mixed = plans.filter((p) => p.parts.length > 1).length;

  const fab = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tự ghép gói mới"
      onPress={() => router.push('/quan-ly/goi-tap/tao')}
      style={({ pressed }) => [st.fab, { backgroundColor: c.brand, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <Icon name="plus" color={c.onBrand} />
      <T w={700} color={c.onBrand}>Tự ghép gói</T>
    </Pressable>
  );

  return (
    <Screen title="Gói tập" sub={`${plans.length} gói · ${mixed} gói ghép nhiều dịch vụ`} back footer={fab}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <StatTile label="Đang dùng gói" value={String(active)} highlight />
        <StatTile label="Bán tháng 10" value={String(plans.reduce((s, p) => s + last(p), 0))} />
        <StatTile label="Doanh thu gói" value={vnd(revenue)} />
        <StatTile label="Tỉ lệ gia hạn" value={pct(renewal)} />
      </View>
      <Segmented
        options={[
          { id: 'club', label: `Gói của CLB ${plans.filter((p) => !p.custom).length}` },
          { id: 'custom', label: `Gói riêng khách ${plans.filter((p) => p.custom).length}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {rows.length === 0 && <T size={13} color={c.inkMuted}>Chưa có gói nào – bấm “Tự ghép gói” để tạo.</T>}

      {rows.map((p) => {
        const max = Math.max(1, ...p.sales);
        return (
          <Card key={p.id} style={{ gap: 10 }}>
            <View style={st.head}>
              <View style={st.logos}>
                {p.parts.slice(0, 3).map((x, i) => (
                  <View key={i} style={[st.logo, { marginLeft: i ? -10 : 0, borderColor: c.surfaceRaised }]}>
                    <SportBadge sport={partSport(x)} size={34} />
                  </View>
                ))}
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <T w={700}>{p.name}</T>
                <View style={st.priceRow}>
                  <T size={12} color={c.inkMuted} style={{ flex: 1 }}>{p.custom ? `Riêng: ${p.custom} · ` : ''}{p.months} tháng</T>
                  <Num size={20} w={600}>{vnd(p.price)}</Num>
                </View>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              {p.parts.map((x, i) => (
                <View key={i} style={st.part}>
                  <SportBadge sport={partSport(x)} size={22} />
                  <T size={13}>{partLabel(x)}</T>
                </View>
              ))}
            </View>
            {p.extras.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {p.extras.map((t) => <Badge key={t} label={t} />)}
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                ['Đang dùng', String(p.active)],
                ['Bán T10', String(last(p))],
                ['Gia hạn', p.renewal === null ? '—' : pct(p.renewal)],
                ['Hết hạn ≤14n', String(p.expiring)],
              ].map(([k, v]) => (
                <View key={k} style={{ flex: 1, padding: 8, borderRadius: 8, backgroundColor: c.surfaceSunken }}>
                  <Num size={18} w={600} color={k.startsWith('Hết') && p.expiring ? c.warning : c.ink}>{v}</Num>
                  <T size={11} color={c.inkMuted}>{k}</T>
                </View>
              ))}
            </View>
            {p.sales.some((v) => v > 0) && (
              <View accessibilityLabel={`Gói bán ${MONTHS.join(', ')}: ${p.sales.join(', ')}`} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 44 }}>
                  {p.sales.map((v, i) => (
                    <View key={i} style={{ flex: 1, height: `${Math.max(8, (v / max) * 100)}%`, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: c.brand, opacity: i === p.sales.length - 1 ? 1 : 0.55 }} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {MONTHS.map((m) => <T key={m} size={10} color={c.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{m}</T>)}
                </View>
              </View>
            )}
          </Card>
        );
      })}
      <View style={{ height: 72 }} />
    </Screen>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logos: { flexDirection: 'row' },
  logo: { borderWidth: 2, borderRadius: 12 },
  part: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
});
