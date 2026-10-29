import { useState } from 'react';
import { View } from 'react-native';
import { Badge, Screen, Segmented, SportBadge, StatTile } from '../../components/kit';
import { Card, Num, T } from '../../components/ui';
import { usePlans } from '../../hooks/useAdmin';
import { vnd } from '../../lib/format';
import { useColors } from '../../theme/tokens';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const MONTHS = ['T5', 'T6', 'T7', 'T8', 'T9', 'T10'];

export default function AdminPlans() {
  const c = useColors();
  const { data: plans = [] } = usePlans();
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog');
  const rows = plans.filter((p) => (tab === 'custom' ? !!p.custom : !p.custom));
  const last = (p: (typeof plans)[number]) => p.sales[p.sales.length - 1];
  const active = plans.reduce((s, p) => s + p.active, 0);
  const revenue = plans.reduce((s, p) => s + last(p) * p.price, 0);
  const withR = plans.filter((p) => p.renewal !== null);
  const renewal = withR.reduce((s, p) => s + p.renewal! * p.active, 0) / Math.max(1, withR.reduce((s, p) => s + p.active, 0));

  return (
    <Screen title="Gói tập" sub="Thống kê tháng 10/2026" back>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <StatTile label="Đang dùng gói" value={String(active)} highlight />
        <StatTile label="Bán tháng 10" value={String(plans.reduce((s, p) => s + last(p), 0))} />
        <StatTile label="Doanh thu gói" value={vnd(revenue)} />
        <StatTile label="Tỉ lệ gia hạn" value={pct(renewal)} />
      </View>
      <Segmented options={[{ id: 'catalog', label: `Danh mục ${plans.filter((p) => !p.custom).length}` }, { id: 'custom', label: `Theo yêu cầu ${plans.filter((p) => p.custom).length}` }]} value={tab} onChange={setTab} />

      {rows.map((p) => {
        const max = Math.max(1, ...p.sales);
        return (
          <Card key={p.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <SportBadge sport={p.sport} size={40} />
              <View style={{ flex: 1 }}>
                <T w={700}>{p.name}</T>
                <T size={12} color={c.inkMuted}>{p.custom ? `Riêng: ${p.custom}` : p.template} · {p.months} tháng</T>
              </View>
              <Num size={20} w={600}>{vnd(p.price)}</Num>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {p.tags.map((t) => <Badge key={t} label={t} />)}
            </View>
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
      <T size={12} color={c.inkMuted}>Tạo gói theo khuôn khổ hoặc gói riêng cho khách trên website quản trị.</T>
    </Screen>
  );
}
