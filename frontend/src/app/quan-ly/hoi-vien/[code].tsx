import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { getRenewPlans } from '../../../api/admin.api';
import { Avatar, Badge, Banner, Bar, Btn, Screen, Segmented, Sheet } from '../../../components/kit';
import { Card, Label, Num, T } from '../../../components/ui';
import { useCheckInMember, useMember, useRenewMember } from '../../../hooks/useAdmin';
import { vnd } from '../../../lib/format';
import { radius, useColors } from '../../../theme/tokens';

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const METHODS = ['Tiền mặt', 'Chuyển khoản', 'Thẻ'];

export default function AdminMemberDetail() {
  const c = useColors();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data: m, isLoading } = useMember(code);
  const checkIn = useCheckInMember();
  const renew = useRenewMember();
  const plans = getRenewPlans();
  const [renewOpen, setRenewOpen] = useState(false);
  const [planIndex, setPlanIndex] = useState(2);
  const [method, setMethod] = useState(METHODS[1]);
  const [notice, setNotice] = useState<string | null>(null);

  if (!m) return <Screen title="Hội viên" back><T color={c.inkMuted}>{isLoading ? 'Đang tải…' : 'Không tìm thấy hội viên.'}</T></Screen>;
  const visits = m.checkins28.reduce((a, b) => a + b, 0);

  return (
    <Screen title={m.name} sub={`${m.code} · ${m.phone}`} back>
      {notice && <Banner text={notice} />}
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Avatar name={m.name} size={56} ring={m.inside} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Badge label={m.status} tone={m.tone} />
              {m.inside && <Badge label="Đang ở phòng tập" tone="volt" />}
            </View>
            <T size={12} color={c.inkMuted}>Lần cuối: {m.last}</T>
          </View>
        </View>
        <View style={{ padding: 12, borderRadius: radius.md, backgroundColor: c.surface, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <T w={700} style={{ flex: 1 }}>{m.plan}</T>
            <T size={12} color={c.inkMuted}>{m.period}</T>
          </View>
          <Bar pct={m.usedPct} height={8} color={m.usedPct >= 90 ? c.warning : c.brand} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={13} color={c.inkMuted}>Còn <T w={700}>{m.remain}</T></T>
            {m.pt && <T size={13} color={c.inkMuted}>PT còn <T w={700} color={c.clay}>{m.pt.left}</T>/{m.pt.total}</T>}
          </View>
        </View>
        {m.debt > 0 && <Banner tone="danger" text={`Công nợ ${vnd(m.debt)} – thu khi khách tới.`} />}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn
            label={m.inside ? 'Check-out' : 'Check-in'}
            kind="volt"
            icon="qr"
            onPress={() => checkIn.mutate(m.code, { onSuccess: () => setNotice(m.inside ? `${m.name} đã rời phòng tập.` : `Đã check-in ${m.name}.`) })}
            style={{ flex: 1 }}
          />
          <Btn label="Gia hạn" icon="renew" onPress={() => setRenewOpen(true)} style={{ flex: 1 }} />
          <Btn label="Gọi" kind="secondary" icon="phone" onPress={() => Linking.openURL(`tel:${m.phone.replace(/\s/g, '')}`)} />
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Label>Check-in 4 tuần qua</Label>
          <T size={13} color={c.inkMuted}><T w={700}>{visits}</T> lần</T>
        </View>
        <View accessibilityLabel={`Lịch check-in 28 ngày, ${visits} ngày có tập`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {m.checkins28.map((v, i) => (
            <View key={i} style={{ width: '12%', flexGrow: 1, height: 20, borderRadius: 4, backgroundColor: i === 27 && m.inside ? c.volt : v ? c.brand : c.surfaceSunken }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {DOW.map((d) => <T key={d} size={11} color={c.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{d}</T>)}
        </View>
      </Card>

      <Card style={{ gap: 4 }}>
        <Label>Lịch sử thanh toán</Label>
        {m.payments.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < m.payments.length - 1 ? 1 : 0, borderBottomColor: c.lineSoft }}>
            <View style={{ flex: 1 }}>
              <T w={600} size={14}>{p.what}</T>
              <T size={12} color={c.inkMuted}>{p.when} · {p.method}</T>
            </View>
            <Num size={17} w={600}>{vnd(p.amount)}</Num>
          </View>
        ))}
      </Card>

      <Sheet visible={renewOpen} onClose={() => setRenewOpen(false)} title="Gia hạn gói">
        <T color={c.inkMuted}>Hạn mới tính từ hôm nay 18/10/2026.</T>
        {plans.map(([name, months, price], i) => {
          const on = planIndex === i;
          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setPlanIndex(i)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandWash : c.surfaceRaised }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: on ? 6 : 2, borderColor: on ? c.brand : c.lineStrong }} />
              <View style={{ flex: 1 }}>
                <T w={600}>{name}</T>
                <T size={12} color={c.inkMuted}>{months} tháng</T>
              </View>
              <Num size={18} w={600}>{vnd(price)}</Num>
            </Pressable>
          );
        })}
        <Segmented options={METHODS.map((x) => ({ id: x, label: x }))} value={method} onChange={setMethod} />
        <Btn
          label={`Thu ${vnd(plans[planIndex][2])} & gia hạn`}
          disabled={renew.isPending}
          onPress={() =>
            renew.mutate(
              { code: m.code, planIndex, method },
              {
                onSuccess: (r) => {
                  setRenewOpen(false);
                  setNotice(`Đã gia hạn ${r.plan} cho ${m.name}, hạn mới ${r.exp}.`);
                },
              },
            )
          }
        />
      </Sheet>
    </Screen>
  );
}
