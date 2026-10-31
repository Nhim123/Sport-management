import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Avatar, Badge, Banner, Btn, Chip, ChipRow, Screen, Segmented, Sheet, toneColors } from '../../components/kit';
import { Card, Label, T } from '../../components/ui';
import { useSetShift, useStaff } from '../../hooks/useAdmin';
import { radius, useColors } from '../../theme/tokens';
import type { Shift, StaffMember, Tone } from '../../types/admin';

// Tuần đang xếp: T2 12/10 → CN 18/10 (hôm nay là CN)
const TODAY = 6;
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DATES = ['12/10', '13/10', '14/10', '15/10', '16/10', '17/10', '18/10'];
const SHIFTS: { id: Exclude<Shift, 'off' | 'P'>; label: string; time: string }[] = [
  { id: 'S', label: 'Ca sáng', time: '06:00–12:00' },
  { id: 'C', label: 'Ca chiều', time: '12:00–17:00' },
  { id: 'T', label: 'Ca tối', time: '17:00–23:00' },
];
const CELL: Record<Shift, { text: string; tone: Tone }> = {
  S: { text: 'S', tone: 'info' },
  C: { text: 'C', tone: 'warning' },
  T: { text: 'T', tone: 'class' },
  off: { text: '–', tone: 'neutral' },
  P: { text: 'P', tone: 'danger' },
};
/** Bấm ô trong lịch tuần: sáng → chiều → tối → nghỉ → sáng */
const NEXT: Record<Shift, Shift> = { S: 'C', C: 'T', T: 'off', off: 'S', P: 'P' };

const shiftName = (s: Shift) => SHIFTS.find((x) => x.id === s)?.label ?? (s === 'P' ? 'Nghỉ phép' : 'Nghỉ');
/** Ca không có lễ tân trực trong ngày */
const gapsOf = (staff: StaffMember[], day: number) => SHIFTS.filter((s) => !staff.some((x) => x.role === 'reception' && x.week[day] === s.id));

/** Xếp lịch ca cho nhân viên – chỉ để nắm ai trực ca nào, không điểm danh / chấm công từng người */
export default function AdminStaff() {
  const c = useColors();
  const { data: staff = [] } = useStaff();
  const setShift = useSetShift();
  const [tab, setTab] = useState<'day' | 'week'>('day');
  const [day, setDay] = useState(TODAY);
  const [adding, setAdding] = useState<Shift | null>(null);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  const assign = (x: StaffMember, d: number, shift: Shift, done?: string) =>
    setShift.mutate(
      { staffId: x.id, day: d, shift },
      {
        onSuccess: () => setMsg(done ? { tone: 'success', text: done } : null),
        onError: (e) => setMsg({ tone: 'danger', text: (e as Error).message }),
      },
    );

  const gaps = gapsOf(staff, day);
  const off = staff.filter((x) => x.week[day] === 'off' || x.week[day] === 'P');
  const weekGaps = DAYS.map((_, d) => gapsOf(staff, d).length);

  return (
    <Screen title="Nhân viên" sub={`Lịch ca tuần ${DATES[0]} – ${DATES[6]}`} back>
      <Segmented
        options={[{ id: 'day', label: 'Theo ngày' }, { id: 'week', label: 'Cả tuần' }]}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setMsg(null);
        }}
      />
      {msg && <Banner tone={msg.tone} text={msg.text} />}

      {tab === 'day' ? (
        <>
          <ChipRow>
            {DAYS.map((d, i) => (
              <Chip
                key={d}
                label={`${d} ${DATES[i]}${i === TODAY ? ' · hôm nay' : ''}`}
                on={i === day}
                onPress={() => {
                  setDay(i);
                  setMsg(null);
                }}
                left={weekGaps[i] ? <View style={[st.dot, { backgroundColor: c.danger }]} /> : undefined}
              />
            ))}
          </ChipRow>

          {gaps.length > 0 ? (
            <Banner tone="warning" text={`${DAYS[day]} ${DATES[day]} chưa có lễ tân: ${gaps.map((g) => g.label.toLowerCase()).join(', ')}.`} />
          ) : (
            <Banner text={`${DAYS[day]} ${DATES[day]}: ca nào cũng có lễ tân trực.`} />
          )}

          {SHIFTS.map((s) => {
            const on = staff.filter((x) => x.week[day] === s.id);
            const noDesk = gaps.some((g) => g.id === s.id);
            return (
              <Card key={s.id} style={{ gap: 10 }}>
                <View style={st.between}>
                  <View style={st.row}>
                    <T w={700}>{s.label}</T>
                    {noDesk && <Badge label="Thiếu lễ tân" tone="warning" />}
                  </View>
                  <T size={12} color={c.inkMuted}>{s.time} · {on.length} người</T>
                </View>
                {on.length === 0 && <T size={13} color={c.inkMuted}>Chưa xếp ai.</T>}
                {on.map((x) => (
                  <View key={x.id} style={st.row}>
                    <Avatar name={x.name} size={34} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w={600} size={14} numberOfLines={1}>{x.name}</T>
                      <T size={12} color={c.inkMuted}>{x.roleLabel}</T>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bỏ ${x.name} khỏi ${s.label.toLowerCase()}`}
                      onPress={() => assign(x, day, 'off', `Đã cho ${x.name} nghỉ ${DAYS[day]} ${DATES[day]}.`)}
                      hitSlop={6}
                      style={[st.remove, { backgroundColor: c.surfaceSunken }]}
                    >
                      <Icon name="close" size={16} color={c.inkMuted} />
                    </Pressable>
                  </View>
                ))}
                <Btn label="Xếp người vào ca" kind="secondary" icon="plus" onPress={() => setAdding(s.id)} />
              </Card>
            );
          })}

          {off.length > 0 && (
            <Card style={{ gap: 6 }}>
              <Label>Nghỉ ngày này</Label>
              {off.map((x) => (
                <T key={x.id} size={14}>
                  {x.name} <T size={12} color={c.inkMuted}>· {x.roleLabel} · {x.week[day] === 'P' ? x.note ?? 'nghỉ phép' : 'nghỉ'}</T>
                </T>
              ))}
            </Card>
          )}
        </>
      ) : (
        <>
          <T size={13} color={c.inkMuted}>Chạm vào ô để đổi ca: S sáng → C chiều → T tối → nghỉ. Ô P là nghỉ phép, không xếp được.</T>
          <Card style={{ padding: 10, gap: 4 }}>
            <View style={st.gridRow}>
              <View style={st.nameCol} />
              {DAYS.map((d, i) => (
                <View key={d} style={st.cellWrap}>
                  <T size={11} w={700} color={i === TODAY ? c.brand : c.inkMuted}>{d}</T>
                </View>
              ))}
            </View>
            {staff.map((x) => (
              <View key={x.id} style={st.gridRow}>
                <View style={st.nameCol}>
                  <T size={12} w={600} numberOfLines={1}>{x.name.split(' ').slice(-2).join(' ')}</T>
                  <T size={10} color={c.inkMuted} numberOfLines={1}>{x.roleLabel}</T>
                </View>
                {x.week.map((v, d) => {
                  const tc = toneColors(c, CELL[v].tone);
                  return (
                    <Pressable
                      key={d}
                      accessibilityRole="button"
                      accessibilityLabel={`${x.name}, ${DAYS[d]}: ${shiftName(v)}`}
                      disabled={v === 'P' || setShift.isPending}
                      onPress={() => assign(x, d, NEXT[v])}
                      style={st.cellWrap}
                    >
                      <View style={[st.cell, { backgroundColor: tc.bg, borderColor: d === TODAY ? c.brand : 'transparent' }]}>
                        <T size={13} w={700} color={tc.fg}>{CELL[v].text}</T>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
            <View style={[st.gridRow, { borderTopWidth: 1, borderTopColor: c.lineSoft, paddingTop: 6, marginTop: 2 }]}>
              <View style={st.nameCol}>
                <T size={11} color={c.inkMuted}>Thiếu lễ tân</T>
              </View>
              {weekGaps.map((g, d) => (
                <View key={d} style={st.cellWrap}>
                  <T size={12} w={700} color={g ? c.danger : c.brand}>{g ? g : '✓'}</T>
                </View>
              ))}
            </View>
          </Card>
        </>
      )}

      <T size={12} color={c.inkMuted}>Lịch ca chỉ để nắm ai trực ca nào – app không điểm danh hay chấm công từng nhân viên.</T>

      <Sheet visible={!!adding} onClose={() => setAdding(null)} title={adding ? `${shiftName(adding)} · ${DAYS[day]} ${DATES[day]}` : ''}>
        {adding &&
          staff
            .filter((x) => x.week[day] !== adding)
            .sort((a, b) => Number(a.week[day] !== 'off') - Number(b.week[day] !== 'off'))
            .map((x) => {
              const cur = x.week[day];
              const leave = cur === 'P';
              return (
                <Pressable
                  key={x.id}
                  accessibilityRole="button"
                  disabled={leave}
                  onPress={() => {
                    assign(x, day, adding, `Đã xếp ${x.name} vào ${shiftName(adding).toLowerCase()} ${DAYS[day]} ${DATES[day]}.`);
                    setAdding(null);
                  }}
                  style={[st.pick, { borderColor: c.line, opacity: leave ? 0.5 : 1 }]}
                >
                  <Avatar name={x.name} size={36} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w={600} numberOfLines={1}>{x.name}</T>
                    <T size={12} color={c.inkMuted}>{x.roleLabel}</T>
                  </View>
                  <Badge
                    label={cur === 'off' ? 'Đang nghỉ' : leave ? 'Nghỉ phép' : `Chuyển từ ${shiftName(cur).toLowerCase()}`}
                    tone={cur === 'off' ? 'success' : leave ? 'danger' : 'neutral'}
                  />
                </Pressable>
              );
            })}
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  remove: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nameCol: { width: 92, paddingRight: 4 },
  cellWrap: { flex: 1, alignItems: 'center', minHeight: 30, justifyContent: 'center' },
  cell: { width: '100%', height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.lg, borderWidth: 1 },
});
