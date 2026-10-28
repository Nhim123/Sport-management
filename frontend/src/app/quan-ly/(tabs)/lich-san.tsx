import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CLOSE_HOUR, isFree, NOW_HOUR, OPEN_HOUR } from '../../../api/admin.api';
import { Icon } from '../../../components/Icon';
import { Badge, Banner, Btn, Chip, ChipRow, Field, Screen, Segmented, Sheet, SportBadge } from '../../../components/kit';
import { Num, T } from '../../../components/ui';
import { MEMBER_DISCOUNT } from '../../../constants';
import { useCreateDayBooking, useDayBookings, useMembers } from '../../../hooks/useAdmin';
import { useCourts } from '../../../hooks/useCourts';
import { hh, vnd } from '../../../lib/format';
import { radius, useColors } from '../../../theme/tokens';
import type { AdminBooking } from '../../../types/admin';

const ROW = 60;
const STATE_TONE = { booked: 'success', class: 'class', pending: 'warning', blocked: 'neutral' } as const;
const STATE_LABEL = { booked: 'Đã đặt', class: 'Lớp học', pending: 'Chờ cọc', blocked: 'Bảo trì' } as const;

export default function AdminSchedule() {
  const c = useColors();
  const params = useLocalSearchParams<{ court?: string }>();
  const { data: courts = [] } = useCourts();
  const { data: bookings = [] } = useDayBookings();
  const { data: members = [] } = useMembers();
  const create = useCreateDayBooking();

  const [courtId, setCourtId] = useState<string | undefined>(params.court);
  const court = courts.find((x) => x.id === courtId) ?? courts[0];
  const [hour, setHour] = useState<number | null>(null);
  const [dur, setDur] = useState(1);
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  if (!court) return <Screen title="Lịch sân"><T color={c.inkMuted}>Đang tải…</T></Screen>;

  const mine = bookings.filter((b) => b.courtId === court.id);
  const member = members.find((m) => phone.replace(/\D/g, '').length >= 9 && m.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
  const fits = hour !== null && hour + dur <= CLOSE_HOUR && isFree(bookings, court.id, hour, dur);
  const subtotal = court.price * dur;
  const discount = member ? Math.round(subtotal * MEMBER_DISCOUNT) : 0;

  // Dựng các khối: lượt đặt hoặc ô trống 1 giờ
  const blocks: { start: number; span: number; b?: AdminBooking }[] = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; ) {
    const b = mine.find((x) => x.start <= h && h < x.start + x.span);
    if (b) {
      const span = Math.min(b.start + b.span, CLOSE_HOUR) - h;
      blocks.push({ start: h, span, b });
      h += span;
    } else {
      blocks.push({ start: h, span: 1 });
      h += 1;
    }
  }

  const submit = (pending: boolean) => {
    if (hour === null || !fits) return;
    const name = member?.name ?? 'Khách lẻ';
    create.mutate(
      { courtId: court.id, start: hour, span: dur, state: pending ? 'pending' : 'booked', label: name, sub: pending ? 'Chưa cọc' : undefined },
      {
        onSuccess: () => {
          setNotice(`${pending ? 'Đã giữ chỗ' : 'Đã xác nhận'} ${court.name} ${hh(hour)}–${hh(hour + dur)} cho ${name}.`);
          setHour(null);
          setDur(1);
          setPhone('');
        },
        onError: (e) => setNotice((e as Error).message),
      },
    );
  };

  return (
    <Screen title="Lịch sân" sub="Chủ nhật, 18/10 · chạm ô trống để đặt">
      <ChipRow>
        {courts.map((x) => (
          <Chip key={x.id} label={x.name} on={x.id === court.id} onPress={() => setCourtId(x.id)} left={<SportBadge sport={x.sport} size={22} />} />
        ))}
      </ChipRow>

      {notice && <Banner text={notice} />}

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <SportBadge sport={court.sport} size={44} />
        <View style={{ flex: 1 }}>
          <Num size={24}>{court.name}</Num>
          <T size={13} color={c.inkMuted}>{court.kind} · {vnd(court.price)}/giờ</T>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        {blocks.map(({ start, span, b }) => {
          const now = NOW_HOUR >= start && NOW_HOUR < start + span;
          return (
            <View key={start} style={st.line}>
              <View style={{ width: 52 }}>
                <Num size={16} w={600} color={now ? c.ink : c.inkMuted}>{hh(start)}</Num>
                {now && <T size={10} w={700} color={c.brand}>BÂY GIỜ</T>}
              </View>
              {b ? (
                <View style={[st.block, { height: span * ROW + (span - 1) * 6, backgroundColor: b.state === 'booked' ? c.brandTint : b.state === 'class' ? c.clayTint : b.state === 'pending' ? c.warningTint : c.slotBlocked }, now && { borderWidth: 2, borderColor: c.ink }]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w={600} numberOfLines={1}>{b.label}</T>
                    <T size={12} color={c.inkMuted} numberOfLines={1}>{hh(b.start)}–{hh(b.start + b.span)}{b.sub ? ` · ${b.sub}` : ''}</T>
                  </View>
                  <Badge label={b.checkedIn ? 'Đã check-in' : STATE_LABEL[b.state]} tone={b.checkedIn ? 'volt' : STATE_TONE[b.state]} />
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${court.name} ${hh(start)} trống, đặt sân`}
                  onPress={() => { setHour(start); setDur(1); setNotice(null); }}
                  style={({ pressed }) => [st.block, st.free, { height: ROW, borderColor: c.line, backgroundColor: pressed ? c.brandTint : c.surfaceRaised }]}
                >
                  <T size={13} color={c.inkMuted} style={{ flex: 1 }}>Trống</T>
                  <Icon name="plus" size={18} color={c.brand} />
                  <T size={13} w={600} color={c.brand}>Đặt</T>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <Sheet visible={hour !== null} onClose={() => setHour(null)} title={`Đặt ${court.name}`}>
        {hour !== null && (
          <>
            <T color={c.inkMuted}>Chủ nhật 18/10 · <T w={700}>{hh(hour)} – {hh(hour + dur)}</T></T>
            <Segmented options={[1, 2, 3].map((n) => ({ id: n, label: `${n} giờ` }))} value={dur} onChange={setDur} />
            {!fits && <Banner tone="warning" text="Khung giờ này trùng lịch hoặc quá giờ đóng cửa – giảm thời lượng." />}
            <Field label="Số điện thoại khách" value={phone} onChangeText={setPhone} placeholder="09xx xxx xxx" keyboardType="phone-pad" />
            <View style={[st.who, { backgroundColor: member ? c.brandTint : c.surfaceSunken }]}>
              <T size={13} color={member ? c.brandInk : c.inkMuted}>
                {member ? `${member.name} · hội viên ${member.plan} · giảm ${MEMBER_DISCOUNT * 100}%` : 'Khách lẻ – không có ưu đãi hội viên'}
              </T>
            </View>
            <View style={{ gap: 6 }}>
              <View style={st.between}><T color={c.inkMuted}>{vnd(court.price)} × {dur} giờ</T><Num size={17} w={600}>{vnd(subtotal)}</Num></View>
              {discount > 0 && <View style={st.between}><T color={c.inkMuted}>Ưu đãi hội viên</T><Num size={17} w={600} color={c.brand}>{vnd(-discount)}</Num></View>}
              <View style={st.between}><T w={700}>Tổng cộng</T><Num size={28}>{vnd(subtotal - discount)}</Num></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn label="Giữ chỗ, chờ cọc" kind="secondary" disabled={!fits || create.isPending} onPress={() => submit(true)} style={{ flex: 1 }} />
              <Btn label="Xác nhận" disabled={!fits || create.isPending} onPress={() => submit(false)} style={{ flex: 1 }} />
            </View>
          </>
        )}
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  line: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  block: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: radius.md },
  free: { borderWidth: 1, borderStyle: 'dashed' },
  who: { padding: 12, borderRadius: radius.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
