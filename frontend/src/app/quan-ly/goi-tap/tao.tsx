import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { Banner, Btn, Chip, ChipRow, Field, Screen, Segmented, SportBadge } from '../../../components/kit';
import { Card, Num, T } from '../../../components/ui';
import { useCreatePlan } from '../../../hooks/useAdmin';
import { vnd } from '../../../lib/format';
import { autoName, DURATION_DISCOUNT, partLabel, partMonthly, partSport, suggestPrice, UNIT } from '../../../lib/plans';
import { radius, useColors } from '../../../theme/tokens';
import type { PlanPart } from '../../../types/admin';
import type { Activity, Sport } from '../../../types/domain';

const COURTS: { sport: Sport; label: string }[] = [
  { sport: 'cl', label: 'Sân cầu lông' },
  { sport: 'pb', label: 'Sân pickleball' },
  { sport: 'tn', label: 'Sân tennis' },
  { sport: 'bd', label: 'Sân bóng 5 người' },
];
const COURT_HOURS = [4, 8, 12, 20];
const CLASS_QTY = [4, 8, 12, 0]; // 0 = không giới hạn
const PT_QTY = [6, 12, 24];
const DURATIONS = [1, 3, 6, 12];
const EXTRAS = ['Bảo lưu 30 ngày', 'Khăn & nước', 'Tủ đồ riêng', 'Gửi xe miễn phí', 'Dẫn 1 bạn tập thử'];

type CourtPick = { on: boolean; qty: number; offPeak: boolean };

/** Câu lạc bộ tự ghép gói: chọn tuỳ ý phòng gym, giờ sân từng môn, lớp nhóm, PT, bơi – giá gợi ý tự tính */
export default function BuildPlan() {
  const c = useColors();
  const create = useCreatePlan();
  const [gym, setGym] = useState({ on: true, offPeak: false });
  const [courts, setCourts] = useState<Record<Sport, CourtPick>>({
    cl: { on: false, qty: 8, offPeak: false },
    pb: { on: false, qty: 8, offPeak: false },
    tn: { on: false, qty: 4, offPeak: false },
    bd: { on: false, qty: 4, offPeak: false },
  });
  const [cls, setCls] = useState({ on: false, qty: 0 });
  const [pt, setPt] = useState({ on: false, qty: 12 });
  const [swim, setSwim] = useState(false);
  const [months, setMonths] = useState(3);
  const [extras, setExtras] = useState<string[]>([]);
  const [audience, setAudience] = useState<'all' | 'one'>('all');
  const [customer, setCustomer] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parts: PlanPart[] = [
    ...(gym.on ? [{ kind: 'gym' as const, offPeak: gym.offPeak || undefined }] : []),
    ...COURTS.filter((x) => courts[x.sport].on).map((x) => ({ kind: 'court' as const, sport: x.sport, qty: courts[x.sport].qty, offPeak: courts[x.sport].offPeak || undefined })),
    ...(cls.on ? [{ kind: 'class' as const, qty: cls.qty || undefined }] : []),
    ...(pt.on ? [{ kind: 'pt' as const, qty: pt.qty }] : []),
    ...(swim ? [{ kind: 'swim' as const }] : []),
  ];
  const sug = suggestPrice(parts, months);
  const finalName = name.trim() || autoName(parts, months) + (audience === 'one' && customer.trim() ? ' (riêng)' : '');
  const typed = Number(price.replace(/\D/g, ''));
  const finalPrice = typed || sug.total;
  const setCourt = (s: Sport, patch: Partial<CourtPick>) => setCourts((cur) => ({ ...cur, [s]: { ...cur[s], ...patch } }));

  const submit = () => {
    setError(null);
    if (!parts.length) return setError('Chọn ít nhất một dịch vụ cho gói.');
    if (audience === 'one' && !customer.trim()) return setError('Nhập tên khách cho gói riêng.');
    create.mutate(
      { name: finalName, parts, months, price: finalPrice, extras, custom: audience === 'one' ? customer.trim() : undefined },
      { onSuccess: () => router.back(), onError: (e) => setError((e as Error).message) },
    );
  };

  const footer = (
    <View style={[st.footer, { borderTopColor: c.line, backgroundColor: c.surfaceRaised }]}>
      <Btn label={create.isPending ? 'Đang tạo…' : parts.length ? `Tạo gói · ${vnd(finalPrice)}` : 'Chọn dịch vụ cho gói'} icon="check" disabled={!parts.length || create.isPending} onPress={submit} />
    </View>
  );

  return (
    <Screen title="Tự ghép gói" sub="Chọn dịch vụ, thời hạn và giá theo ý câu lạc bộ" back footer={footer}>
      {error && <Banner tone="danger" text={error} />}

      <T size={13} w={700}>1 · Dịch vụ trong gói</T>
      <PartCard sport="gym" title="Phòng gym" sub={`${vnd(gym.offPeak ? UNIT.gymOffPeak : UNIT.gym)}/tháng`} on={gym.on} onToggle={() => setGym((g) => ({ ...g, on: !g.on }))}>
        <Segmented options={[{ id: 'all', label: 'Cả ngày' }, { id: 'off', label: 'Giờ thấp điểm' }]} value={gym.offPeak ? 'off' : 'all'} onChange={(v) => setGym((g) => ({ ...g, offPeak: v === 'off' }))} />
      </PartCard>

      {COURTS.map((x) => {
        const v = courts[x.sport];
        return (
          <PartCard key={x.sport} sport={x.sport} title={x.label} sub={v.on ? `${vnd(partMonthly({ kind: 'court', sport: x.sport, qty: v.qty, offPeak: v.offPeak }))}/tháng` : `${vnd(UNIT.courtHour[x.sport])}/giờ thuê lẻ`} on={v.on} onToggle={() => setCourt(x.sport, { on: !v.on })}>
            <T size={12} color={c.inkMuted}>Số giờ sân mỗi tháng</T>
            <ChipRow>
              {COURT_HOURS.map((h) => (
                <Chip key={h} label={`${h} giờ`} on={v.qty === h} onPress={() => setCourt(x.sport, { qty: h })} />
              ))}
            </ChipRow>
            <Segmented options={[{ id: 'any', label: 'Giờ bất kỳ' }, { id: 'off', label: 'Giờ thấp điểm (−30%)' }]} value={v.offPeak ? 'off' : 'any'} onChange={(o) => setCourt(x.sport, { offPeak: o === 'off' })} />
          </PartCard>
        );
      })}

      <PartCard sport="yoga" title="Lớp nhóm" sub="Yoga, HIIT, lớp kỹ thuật" on={cls.on} onToggle={() => setCls((v) => ({ ...v, on: !v.on }))}>
        <ChipRow>
          {CLASS_QTY.map((q) => (
            <Chip key={q} label={q ? `${q} buổi/tháng` : 'Không giới hạn'} on={cls.qty === q} onPress={() => setCls((v) => ({ ...v, qty: q }))} />
          ))}
        </ChipRow>
      </PartCard>

      <PartCard sport="pt" title="PT cá nhân" sub={`${vnd(UNIT.ptSession)}/buổi`} on={pt.on} onToggle={() => setPt((v) => ({ ...v, on: !v.on }))}>
        <ChipRow>
          {PT_QTY.map((q) => (
            <Chip key={q} label={`${q} buổi`} on={pt.qty === q} onPress={() => setPt((v) => ({ ...v, qty: q }))} />
          ))}
        </ChipRow>
      </PartCard>

      <PartCard sport="swim" title="Hồ bơi" sub={`${vnd(UNIT.swim)}/tháng`} on={swim} onToggle={() => setSwim((v) => !v)} />

      <T size={13} w={700}>2 · Thời hạn</T>
      <ChipRow>
        {DURATIONS.map((m) => (
          <Chip key={m} label={`${m} tháng${DURATION_DISCOUNT[m] ? ` · −${DURATION_DISCOUNT[m] * 100}%` : ''}`} on={m === months} onPress={() => setMonths(m)} />
        ))}
      </ChipRow>

      <T size={13} w={700}>3 · Quyền lợi thêm</T>
      <ChipRow>
        {EXTRAS.map((x) => (
          <Chip key={x} label={x} on={extras.includes(x)} onPress={() => setExtras((cur) => (cur.includes(x) ? cur.filter((y) => y !== x) : [...cur, x]))} />
        ))}
      </ChipRow>

      <T size={13} w={700}>4 · Dành cho</T>
      <Segmented options={[{ id: 'all', label: 'Mọi khách' }, { id: 'one', label: 'Riêng một khách' }]} value={audience} onChange={setAudience} />
      {audience === 'one' && <Field label="Tên khách *" value={customer} onChangeText={setCustomer} placeholder="VD: Nguyễn Minh Anh" />}

      <T size={13} w={700}>5 · Tên & giá</T>
      <Field label="Tên gói" value={name} onChangeText={setName} placeholder={autoName(parts, months)} />

      <Card style={{ gap: 8 }}>
        {parts.length === 0 ? (
          <T size={13} color={c.inkMuted}>Chưa chọn dịch vụ nào.</T>
        ) : (
          parts.map((p, i) => (
            <View key={i} style={st.line}>
              <SportBadge sport={partSport(p)} size={22} />
              <T size={13} style={{ flex: 1 }}>{partLabel(p)}</T>
              <T size={13} color={c.inkMuted}>{p.kind === 'pt' ? vnd(UNIT.ptSession * (p.qty ?? 0)) : `${vnd(partMonthly(p))} × ${months}`}</T>
            </View>
          ))
        )}
        {sug.discount > 0 && (
          <View style={st.line}>
            <T size={13} style={{ flex: 1 }} color={c.brandInk}>Giảm gói {months} tháng</T>
            <T size={13} color={c.brandInk}>−{vnd(sug.monthly * months * sug.discount)}</T>
          </View>
        )}
        <View style={[st.line, { borderTopWidth: 1, borderTopColor: c.lineSoft, paddingTop: 8 }]}>
          <T w={700} style={{ flex: 1 }}>Giá gợi ý</T>
          <Num size={22}>{vnd(sug.total)}</Num>
        </View>
      </Card>
      <Field label="Giá bán (để trống = giá gợi ý)" value={price} onChangeText={setPrice} placeholder={String(sug.total)} keyboardType="number-pad" />
      {typed > 0 && sug.total > 0 && (
        <T size={12} color={typed < sug.total ? c.warning : c.inkMuted}>
          {typed < sug.total ? `Thấp hơn giá gợi ý ${Math.round((1 - typed / sug.total) * 100)}%.` : `Cao hơn giá gợi ý ${Math.round((typed / sug.total - 1) * 100)}%.`}
        </T>
      )}
    </Screen>
  );
}

/** Thẻ bật/tắt một dịch vụ trong gói; bật lên thì hiện tuỳ chọn */
function PartCard({ sport, title, sub, on, onToggle, children }: { sport: Activity; title: string; sub: string; on: boolean; onToggle: () => void; children?: ReactNode }) {
  const c = useColors();
  return (
    <View style={[st.part, { borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandTint : c.surfaceRaised }]}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={title} onPress={onToggle} style={st.partHead}>
        <SportBadge sport={sport} size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w={700}>{title}</T>
          <T size={12} color={c.inkMuted}>{sub}</T>
        </View>
        <View style={[st.check, { borderColor: on ? c.brand : c.lineStrong, backgroundColor: on ? c.brand : 'transparent' }]}>
          {on && <Icon name="check" size={14} color={c.onBrand} />}
        </View>
      </Pressable>
      {on && children ? <View style={{ gap: 8 }}>{children}</View> : null}
    </View>
  );
}

const st = StyleSheet.create({
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
  part: { gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1.5 },
  partHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
