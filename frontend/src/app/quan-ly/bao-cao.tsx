import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, SportBadge, StatTile } from '../../components/kit';
import { Bar } from '../../components/kit';
import { Card, Label, Num, T } from '../../components/ui';
import { useMonthReport } from '../../hooks/useAdmin';
import { useCourts } from '../../hooks/useCourts';
import { vnd } from '../../lib/format';
import { useColors } from '../../theme/tokens';

const delta = (cur: number, prev: number) => {
  const d = (cur - prev) / prev;
  return { text: `${d >= 0 ? '▲' : '▼'} ${Math.abs(d * 100).toFixed(1).replace('.', ',')}%`, up: d >= 0 };
};
const tr = (n: number) => `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;

export default function AdminReport() {
  const c = useColors();
  const { data: r } = useMonthReport();
  const { data: courts = [] } = useCourts();
  const [sel, setSel] = useState<number | null>(null);
  if (!r) return <Screen title="Báo cáo" back><T color={c.inkMuted}>Đang tải…</T></Screen>;

  const total = r.booking + r.products;
  const tiles = [
    { label: 'Tổng doanh thu', value: vnd(total), d: delta(total, r.bookingPrev + r.productsPrev) },
    { label: 'Đặt sân', value: vnd(r.booking), d: delta(r.booking, r.bookingPrev) },
    { label: 'Sản phẩm', value: vnd(r.products), d: delta(r.products, r.productsPrev) },
    { label: 'Lợi nhuận SP', value: vnd(r.profit), d: delta(r.profit, r.profitPrev) },
  ];
  const max = Math.max(...r.days.map(([a, b]) => a + b));
  const fixedShare = r.fixed.revenue / r.booking;
  const day = sel !== null ? r.days[sel] : null;

  return (
    <Screen title="Báo cáo" sub={r.label} back>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {tiles.map((t, i) => (
          <StatTile key={t.label} label={t.label} value={t.value} hint={`${t.d.text} ${r.compare}`} hintColor={t.d.up ? c.brand : c.danger} highlight={i === 0} />
        ))}
      </View>

      <Card style={{ gap: 10 }}>
        <Label>Doanh thu đặt sân theo ngày</Label>
        <T size={13} color={c.inkMuted}>
          {day ? `${sel! + 1}/10: cố định ${vnd(day[0])} · vãng lai ${vnd(day[1])} · tổng ${vnd(day[0] + day[1])}` : 'Chạm vào cột để xem chi tiết từng ngày.'}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 150 }}>
          {r.days.map(([fx, wk], i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Ngày ${i + 1}/10: cố định ${vnd(fx)}, vãng lai ${vnd(wk)}`}
              onPress={() => setSel(sel === i ? null : i)}
              style={{ flex: 1, height: '100%', justifyContent: 'flex-end', borderRadius: 4, backgroundColor: sel === i ? c.surfaceSunken : 'transparent' }}
            >
              <View style={{ height: `${(wk / max) * 100}%`, backgroundColor: c.clay, borderTopLeftRadius: 3, borderTopRightRadius: 3, marginBottom: 2 }} />
              <View style={{ height: `${(fx / max) * 100}%`, backgroundColor: c.info }} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[1, 5, 10, 15, 18].map((d) => <T key={d} size={10} color={c.inkMuted}>{d}/10</T>)}
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c.info }} /><T size={12}>Khách cố định</T></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c.clay }} /><T size={12}>Khách vãng lai</T></View>
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <Label>Vãng lai & cố định</Label>
        <View style={{ flexDirection: 'row', height: 12, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
          <View style={{ flex: fixedShare, backgroundColor: c.info }} />
          <View style={{ flex: 1 - fixedShare, backgroundColor: c.clay }} />
        </View>
        {[
          ['Khách cố định', r.fixed, fixedShare],
          ['Khách vãng lai', r.walkin, 1 - fixedShare],
        ].map(([name, v, share]) => {
          const s = v as typeof r.fixed;
          return (
            <View key={name as string} style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T w={600}>{name as string}</T>
                <T size={13} color={c.inkMuted}>{Math.round((share as number) * 100)}%</T>
              </View>
              <Num size={22} w={600}>{vnd(s.revenue)}</Num>
              <T size={12} color={c.inkMuted}>{s.count} lượt · {s.customers} khách · {vnd(Math.round(s.revenue / s.count))}/lượt</T>
            </View>
          );
        })}
      </Card>

      <Card style={{ gap: 10 }}>
        <Label>Theo sân</Label>
        {r.courts.map((x) => {
          const ct = courts.find((k) => k.id === x.courtId);
          return (
            <View key={x.courtId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {ct && <SportBadge sport={ct.sport} size={28} />}
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T size={14} w={600}>{ct?.name ?? x.courtId}</T>
                  <T size={13}>{tr(x.revenue)}</T>
                </View>
                <Bar pct={(x.revenue / r.courts[0].revenue) * 100} />
              </View>
            </View>
          );
        })}
      </Card>

      <Card style={{ gap: 4 }}>
        <Label>Lợi nhuận sản phẩm</Label>
        {r.productRows.map((p, i) => (
          <View key={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: c.lineSoft }}>
            <View style={{ flex: 1 }}>
              <T size={14} w={600}>{p.name}</T>
              <T size={12} color={c.inkMuted}>{p.qty.toLocaleString('vi-VN')} {p.unit} · doanh thu {tr(p.revenue)}</T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Num size={16} w={600}>{vnd(p.profit)}</Num>
              <T size={11} color={c.inkMuted}>biên {Math.round((p.profit / p.revenue) * 100)}%</T>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
