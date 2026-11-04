import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, type SharedValue, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Icon } from '../../components/Icon';
import { Avatar, Badge, Banner, Chip, ChipRow, Screen, Segmented, toneColors } from '../../components/kit';
import { Card, Label, T } from '../../components/ui';
import { useSetShift, useStaff } from '../../hooks/useAdmin';
import { radius, useColors, type Colors } from '../../theme/tokens';
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

/** Vùng thả: "đang rảnh" (cho nghỉ) + 3 ca. Thứ tự này = chỉ số dùng chung với UI thread. */
type ZoneId = 'pool' | 'S' | 'C' | 'T';
const ZONES: ZoneId[] = ['pool', 'S', 'C', 'T'];
type Frame = { x: number; y: number; w: number; h: number };
/** Chỉ cần đo vị trí trên màn hình của vùng thả */
type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };

const shiftName = (s: Shift) => SHIFTS.find((x) => x.id === s)?.label ?? (s === 'P' ? 'Nghỉ phép' : 'Nghỉ');
/** Ca không có lễ tân trực trong ngày */
const gapsOf = (staff: StaffMember[], day: number) => SHIFTS.filter((s) => !staff.some((x) => x.role === 'reception' && x.week[day] === s.id));

/** Viền sáng của vùng thả – chạy hoàn toàn trên UI thread, không re-render React khi kéo. */
function HoverRing({ index, hover, c }: { index: number; hover: SharedValue<number>; c: Colors }) {
  const aStyle = useAnimatedStyle(() => ({ opacity: withTiming(hover.value === index ? 1 : 0, { duration: 130 }) }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, borderWidth: 2.5, borderColor: c.brand }, aStyle]} />;
}

/** Một nhân viên kéo được: giữ rồi kéo thả vào ca để xếp. */
function DragPill({
  staff, zone, c, disabled, active, onPick, onDragMove, onDragEnd, onEnd,
}: {
  staff: StaffMember;
  zone: ZoneId;
  c: Colors;
  disabled?: boolean;
  active: boolean;
  onPick: (id: string, from: ZoneId) => void;
  /** Worklet (do parent sở hữu): cập nhật vùng đang rê tới, chạy trên UI thread */
  onDragMove: (absX: number, absY: number) => void;
  /** Worklet: chốt vùng thả khi nhấc tay */
  onDragEnd: (id: string, from: ZoneId) => void;
  onEnd: () => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lift = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activateAfterLongPress(160)
    .onStart(() => {
      lift.value = withSpring(1, { damping: 18, stiffness: 220 });
      runOnJS(onPick)(staff.id, zone);
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      onDragMove(e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      onDragEnd(staff.id, zone);
    })
    .onFinalize(() => {
      tx.value = withSpring(0, { damping: 20, stiffness: 240 });
      ty.value = withSpring(0, { damping: 20, stiffness: 240 });
      lift.value = withSpring(0);
      runOnJS(onEnd)();
    });

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: 1 + lift.value * 0.05 }],
    zIndex: lift.value > 0 ? 100 : 0,
    shadowOpacity: 0.18 * lift.value,
    elevation: lift.value * 10,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessibilityRole="button"
        accessibilityLabel={`${staff.name}${disabled ? ', đang nghỉ phép' : ', giữ và kéo để xếp ca'}`}
        style={[
          st.pill,
          { backgroundColor: c.surface, borderColor: active ? c.brand : c.line, shadowColor: '#000', shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, opacity: disabled ? 0.5 : 1 },
          aStyle,
        ]}
      >
        <Avatar name={staff.name} size={30} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w={600} size={13} numberOfLines={1}>{staff.name}</T>
          <T size={11} color={c.inkMuted} numberOfLines={1}>{staff.roleLabel}</T>
        </View>
        {disabled ? <Badge label="Nghỉ phép" tone="danger" /> : <Icon name="grid" size={16} color={c.inkMuted} />}
      </Animated.View>
    </GestureDetector>
  );
}

/** Xếp lịch ca cho nhân viên – chỉ để nắm ai trực ca nào, không điểm danh / chấm công từng người */
export default function AdminStaff() {
  const c = useColors();
  const { data: staff = [] } = useStaff();
  const setShift = useSetShift();
  const [tab, setTab] = useState<'day' | 'week'>('day');
  const [day, setDay] = useState(TODAY);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);
  const [drag, setDrag] = useState<{ id: string; from: ZoneId } | null>(null);

  // Vị trí các vùng thả trên màn hình (đo khi bắt đầu kéo) – chia sẻ sang UI thread
  const zoneRefs = useRef<Record<ZoneId, Measurable | null>>({ pool: null, S: null, C: null, T: null });
  const frames = useSharedValue<Frame[]>([]);
  const hover = useSharedValue(-1);

  const assign = (x: StaffMember, d: number, shift: Shift, done?: string) =>
    setShift.mutate(
      { staffId: x.id, day: d, shift },
      {
        onSuccess: () => setMsg(done ? { tone: 'success', text: done } : null),
        onError: (e) => setMsg({ tone: 'danger', text: (e as Error).message }),
      },
    );

  const measureZones = () => {
    const arr: Frame[] = [];
    let pending = ZONES.length;
    const flush = () => { if (--pending === 0) frames.value = arr; };
    ZONES.forEach((id, i) => {
      const node = zoneRefs.current[id];
      if (node) node.measureInWindow((x, y, w, h) => { arr[i] = { x, y, w, h }; flush(); });
      else flush();
    });
  };

  const onPick = (id: string, from: ZoneId) => {
    setMsg(null);
    setDrag({ id, from });
    measureZones();
  };
  // Worklet UI thread: dò vùng đang rê tới từ frame đã đo (frames/hover là biến cục bộ ở đây)
  const onDragMove = (absX: number, absY: number) => {
    'worklet';
    const fr = frames.value;
    let idx = -1;
    for (let i = 0; i < fr.length; i++) {
      const f = fr[i];
      if (f && absX >= f.x && absX <= f.x + f.w && absY >= f.y && absY <= f.y + f.h) {
        idx = i;
        break;
      }
    }
    hover.value = idx;
  };
  const onDrop = (index: number, id: string, from: ZoneId) => {
    const z = index >= 0 ? ZONES[index] : null;
    if (!z || z === from) return;
    const person = staff.find((s) => s.id === id);
    if (!person) return;
    if (person.week[day] === 'P') return; // nghỉ phép thì không xếp
    const shift: Shift = z === 'pool' ? 'off' : z;
    const done =
      z === 'pool'
        ? `Đã cho ${person.name} nghỉ ${DAYS[day]} ${DATES[day]}.`
        : `Đã xếp ${person.name} vào ${shiftName(shift).toLowerCase()} ${DAYS[day]} ${DATES[day]}.`;
    assign(person, day, shift, done);
  };
  // Worklet UI thread: chốt vùng thả rồi báo sang JS
  const onDragEnd = (id: string, from: ZoneId) => {
    'worklet';
    runOnJS(onDrop)(hover.value, id, from);
    hover.value = -1;
  };
  const onEnd = () => setDrag(null);

  const gaps = gapsOf(staff, day);
  const free = staff.filter((x) => x.week[day] === 'off');
  const onLeave = staff.filter((x) => x.week[day] === 'P');
  const weekGaps = DAYS.map((_, d) => gapsOf(staff, d).length);

  const pillProps = { c, active: false, onPick, onDragMove, onDragEnd, onEnd };

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

          <T size={13} color={c.inkMuted}>Giữ một nhân viên rồi kéo thả vào ca để xếp. Kéo về ô “Đang rảnh” để cho nghỉ.</T>

          {gaps.length > 0 ? (
            <Banner tone="warning" text={`${DAYS[day]} ${DATES[day]} chưa có lễ tân: ${gaps.map((g) => g.label.toLowerCase()).join(', ')}.`} />
          ) : (
            <Banner text={`${DAYS[day]} ${DATES[day]}: ca nào cũng có lễ tân trực.`} />
          )}

          {/* Ô chứa nhân viên đang rảnh – cũng là nơi thả để cho nghỉ */}
          <View ref={(n) => { zoneRefs.current.pool = n; }} collapsable={false} style={{ zIndex: drag?.from === 'pool' ? 20 : 1 }}>
            <Card style={st.zone}>
              <View style={st.between}>
                <Label>Đang rảnh · kéo vào ca</Label>
                <T size={12} color={c.inkMuted}>{free.length} người</T>
              </View>
              {free.length === 0 && onLeave.length === 0 && <T size={13} color={c.inkMuted}>Mọi người đều đã được xếp ca.</T>}
              <View style={st.pillWrap}>
                {free.map((x) => (
                  <DragPill key={x.id} staff={x} zone="pool" {...pillProps} active={drag?.id === x.id} />
                ))}
                {onLeave.map((x) => (
                  <DragPill key={x.id} staff={x} zone="pool" {...pillProps} active={false} disabled />
                ))}
              </View>
            </Card>
            <HoverRing index={0} hover={hover} c={c} />
          </View>

          {/* 3 ca trong ngày – vùng thả */}
          {SHIFTS.map((s) => {
            const on = staff.filter((x) => x.week[day] === s.id);
            const noDesk = gaps.some((g) => g.id === s.id);
            return (
              <View key={s.id} ref={(n) => { zoneRefs.current[s.id] = n; }} collapsable={false} style={{ zIndex: drag?.from === s.id ? 20 : 1 }}>
                <Card style={st.zone}>
                  <View style={st.between}>
                    <View style={st.row}>
                      <View style={[st.shiftDot, { backgroundColor: toneColors(c, CELL[s.id].tone).fg }]} />
                      <T w={700}>{s.label}</T>
                      {noDesk && <Badge label="Thiếu lễ tân" tone="warning" />}
                    </View>
                    <T size={12} color={c.inkMuted}>{s.time} · {on.length} người</T>
                  </View>
                  {on.length === 0 ? (
                    <View style={[st.drop, { borderColor: c.lineStrong }]}>
                      <T size={13} color={c.inkMuted}>Thả nhân viên vào đây</T>
                    </View>
                  ) : (
                    <View style={st.pillWrap}>
                      {on.map((x) => (
                        <DragPill key={x.id} staff={x} zone={s.id} {...pillProps} active={drag?.id === x.id} />
                      ))}
                    </View>
                  )}
                </Card>
                <HoverRing index={ZONES.indexOf(s.id)} hover={hover} c={c} />
              </View>
            );
          })}

          <T size={12} color={c.inkMuted}>Lịch ca chỉ để nắm ai trực ca nào – app không điểm danh hay chấm công từng nhân viên.</T>
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
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  shiftDot: { width: 10, height: 10, borderRadius: 5 },
  zone: { gap: 10 },
  pillWrap: { gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 10, borderRadius: radius.lg, borderWidth: 1 },
  drop: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nameCol: { width: 92, paddingRight: 4 },
  cellWrap: { flex: 1, alignItems: 'center', minHeight: 30, justifyContent: 'center' },
  cell: { width: '100%', height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
