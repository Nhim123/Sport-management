import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CLOSE_HOUR, courtLive, isFree, NOW_HOUR, OPEN_HOUR } from '../../api/admin.api';
import { CourtArt } from '../../components/CourtArt';
import { Badge, Banner, Bar, Btn, Chip, ChipRow, LIVE, Screen, Sheet, SportBadge, SPORT_ICON } from '../../components/kit';
import { Card, Num, T } from '../../components/ui';
import { useCreateDayBooking, useDayBookings, useRemoveBooking, useUpdateBooking } from '../../hooks/useAdmin';
import { useCourts } from '../../hooks/useCourts';
import { hh } from '../../lib/format';
import { radius, useColors, type Colors } from '../../theme/tokens';
import type { AdminBooking, CourtLiveKind } from '../../types/admin';
import type { Sport } from '../../types/domain';

type Group = 'all' | 'busy' | 'free' | 'pending' | 'blocked';
const GROUP_OF: Record<CourtLiveKind, Exclude<Group, 'all'>> = { inUse: 'busy', class: 'busy', soon: 'free', free: 'free', pending: 'pending', blocked: 'blocked' };
const GROUPS: { id: Group; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'busy', label: 'Đang dùng' },
  { id: 'free', label: 'Trống' },
  { id: 'pending', label: 'Chờ cọc' },
  { id: 'blocked', label: 'Bảo trì' },
];
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

/** Màu đại diện cho trạng thái (thanh tổng quan, dải giờ) */
const kindColor = (c: Colors, k: CourtLiveKind | AdminBooking['state']) =>
  k === 'inUse' || k === 'booked' ? c.brand : k === 'class' ? c.clay : k === 'pending' ? c.warning : k === 'blocked' ? c.inkMuted : k === 'soon' ? c.info : c.volt;

const mins = (m: number) => (m < 60 ? `${m}′` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}′` : ''}`);

/** Trạng thái sân lúc này – lưới hình sân theo môn, chạm để xem chi tiết & thao tác */
export default function AdminCourtStatus() {
  const c = useColors();
  const { data: courts = [] } = useCourts();
  const { data: bookings = [] } = useDayBookings();
  const update = useUpdateBooking();
  const remove = useRemoveBooking();
  const create = useCreateDayBooking();
  const [group, setGroup] = useState<Group>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const all = courts.map((ct) => ({ ct, l: courtLive(ct.id, bookings, NOW_HOUR) }));
  const shown = all.filter(({ l }) => group === 'all' || GROUP_OF[l.kind] === group);
  const count = (g: Group) => (g === 'all' ? all.length : all.filter(({ l }) => GROUP_OF[l.kind] === g).length);
  const open = all.find((x) => x.ct.id === openId);
  const done = (msg: string) => {
    setNotice(msg);
    setOpenId(null);
  };
  const goSchedule = (courtId: string) => {
    setOpenId(null);
    router.push({ pathname: '/quan-ly/lich-san', params: { court: courtId } });
  };

  return (
    <Screen title="Trạng thái sân" sub="Chủ nhật 18/10 · 19:00" back>
      <Card style={{ gap: 10 }}>
        <View style={st.between}>
          <T w={700}>Sân lúc này</T>
          <Num size={20}>
            {count('busy')}/{all.length} <T size={13} color={c.inkMuted}>đang dùng</T>
          </Num>
        </View>
        <View style={st.stack}>
          {all.map(({ ct, l }) => (
            <View key={ct.id} style={{ flex: 1, backgroundColor: kindColor(c, l.kind) }} />
          ))}
        </View>
        <View style={st.legend}>
          {(['inUse', 'class', 'pending', 'blocked', 'free'] as CourtLiveKind[]).map((k) => {
            const n = all.filter(({ l }) => l.kind === k || (k === 'free' && l.kind === 'soon')).length;
            return n ? (
              <View key={k} style={st.row}>
                <View style={[st.swatch, { backgroundColor: kindColor(c, k) }]} />
                <T size={12} color={c.inkMuted}>{LIVE[k].label} {n}</T>
              </View>
            ) : null;
          })}
        </View>
      </Card>

      <ChipRow>
        {GROUPS.map((g) => (
          <Chip key={g.id} label={g.label} count={count(g.id)} on={group === g.id} onPress={() => setGroup(g.id)} />
        ))}
      </ChipRow>
      {notice && <Banner text={notice} />}

      <View style={st.grid}>
        {shown.map(({ ct, l }) => {
          const cur = l.current;
          return (
            <Pressable
              key={ct.id}
              accessibilityRole="button"
              accessibilityLabel={`${ct.name}, ${LIVE[l.kind].label}`}
              onPress={() => {
                setOpenId(ct.id);
                setNotice(null);
              }}
              style={({ pressed }) => [st.tile, { backgroundColor: c.surfaceRaised, borderColor: l.kind === 'pending' ? c.warning : c.line, opacity: pressed ? 0.85 : 1 }]}
            >
              <View>
                <CourtArt sport={ct.sport} kind={l.kind} />
                <View style={st.artTop}>
                  <Badge label={LIVE[l.kind].label} tone={LIVE[l.kind].tone} />
                  <View style={[st.logo, { borderColor: c.surfaceRaised }]}>
                    <SportBadge sport={ct.sport} size={26} />
                  </View>
                </View>
              </View>
              <View style={{ gap: 3, paddingHorizontal: 2 }}>
                <T w={700} numberOfLines={1}>{ct.name}</T>
                {cur ? (
                  <>
                    <T size={12} numberOfLines={1}>{cur.label}{cur.sub ? ` · ${cur.sub}` : ''}</T>
                    <Bar pct={l.progress * 100} color={kindColor(c, l.kind)} height={4} />
                    <T size={11} color={c.inkMuted} numberOfLines={1}>
                      {hh(cur.start)}–{hh(cur.start + cur.span)} · {l.kind === 'blocked' ? 'mở lại sau' : 'còn'} {mins(l.minutesLeft)}
                      {l.kind === 'inUse' && !cur.checkedIn ? ' · chưa check-in' : ''}
                    </T>
                  </>
                ) : (
                  <>
                    <T size={12} color={c.brandInk} numberOfLines={1}>Trống {mins(l.minutesLeft)}</T>
                    <T size={11} color={c.inkMuted} numberOfLines={1}>{l.next ? `Tiếp: ${hh(l.next.start)} · ${l.next.label}` : 'Trống tới khi đóng cửa'}</T>
                  </>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Sheet visible={!!open} onClose={() => setOpenId(null)} title={open?.ct.name ?? ''}>
        {open && (
          <CourtDetail
            courtName={open.ct.name}
            l={open.l}
            sport={open.ct.sport}
            kindLabel={open.ct.kind}
            mine={bookings.filter((b) => b.courtId === open.ct.id).sort((a, b) => a.start - b.start)}
            canLock={isFree(bookings, open.ct.id, NOW_HOUR, 1)}
            onCheckIn={(b) => update.mutate({ id: b.id, patch: { checkedIn: true } }, { onSuccess: () => done(`Đã check-in ${b.label} · ${open.ct.name}.`) })}
            onDeposit={(b) => update.mutate({ id: b.id, patch: { state: 'booked', sub: undefined, checkedIn: true } }, { onSuccess: () => done(`Đã thu cọc ${b.label} · ${open.ct.name}.`) })}
            onUnlock={(b) => remove.mutate(b.id, { onSuccess: () => done(`Đã mở khóa ${open.ct.name}.`) })}
            onLock={() => create.mutate({ courtId: open.ct.id, start: NOW_HOUR, span: 1, state: 'blocked', label: 'Khóa tạm', sub: 'Lễ tân khóa' }, { onSuccess: () => done(`Đã khóa ${open.ct.name} 19:00–20:00.`) })}
            onSchedule={() => goSchedule(open.ct.id)}
          />
        )}
      </Sheet>
    </Screen>
  );
}

/** Nội dung bảng chi tiết một sân: hình sân lớn, lịch hôm nay, thao tác theo trạng thái */
function CourtDetail(p: {
  courtName: string;
  l: ReturnType<typeof courtLive>;
  sport: Sport;
  kindLabel: string;
  mine: AdminBooking[];
  canLock: boolean;
  onCheckIn: (b: AdminBooking) => void;
  onDeposit: (b: AdminBooking) => void;
  onUnlock: (b: AdminBooking) => void;
  onLock: () => void;
  onSchedule: () => void;
}) {
  const c = useColors();
  const { l } = p;
  const cur = l.current;
  return (
    <>
      <View>
        <CourtArt sport={p.sport} kind={l.kind} />
        <View style={st.artTop}>
          <Badge label={LIVE[l.kind].label} tone={LIVE[l.kind].tone} />
        </View>
      </View>
      <View style={st.row}>
        <SportBadge sport={p.sport} size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w={700}>{SPORT_ICON[p.sport].label} · {p.kindLabel}</T>
          <T size={12} color={c.inkMuted}>
            {cur ? `${cur.label}${cur.sub ? ` · ${cur.sub}` : ''} · ${hh(cur.start)}–${hh(cur.start + cur.span)}` : l.next ? `Trống tới ${hh(l.next.start)}` : 'Trống tới khi đóng cửa'}
          </T>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <T size={12} w={700} color={c.inkMuted}>Lịch hôm nay</T>
        <View style={st.strip}>
          {HOURS.map((h) => {
            const b = p.mine.find((x) => x.start <= h && h < x.start + x.span);
            return (
              <View key={h} style={{ flex: 1, gap: 2, alignItems: 'center' }}>
                <View style={[st.cell, { backgroundColor: b ? kindColor(c, b.state) : c.surfaceSunken, borderColor: h === NOW_HOUR ? c.ink : 'transparent' }]} />
                <T size={9} color={h === NOW_HOUR ? c.ink : c.inkMuted}>{h}</T>
              </View>
            );
          })}
        </View>
        {p.mine.map((b) => (
          <T key={b.id} size={12} color={c.inkMuted}>{hh(b.start)}–{hh(b.start + b.span)} · {b.label}{b.sub ? ` · ${b.sub}` : ''}</T>
        ))}
      </View>

      {l.kind === 'inUse' && cur && !cur.checkedIn && <Btn label="Check-in khách" kind="volt" icon="check" onPress={() => p.onCheckIn(cur)} />}
      {l.kind === 'pending' && cur && <Btn label="Thu cọc & cho vào sân" onPress={() => p.onDeposit(cur)} />}
      {l.kind === 'blocked' && cur && <Btn label="Mở khóa sân" kind="secondary" icon="lock" onPress={() => p.onUnlock(cur)} />}
      {!cur && (
        <View style={st.row}>
          <Btn label="Đặt sân" icon="calendar" onPress={p.onSchedule} style={{ flex: 1 }} />
          <Btn label="Khóa 1 giờ" kind="secondary" icon="lock" disabled={!p.canLock} onPress={p.onLock} style={{ flex: 1 }} />
        </View>
      )}
      {cur && <Btn label="Mở lịch sân này" kind="ghost" onPress={p.onSchedule} />}
    </>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47.5%', flexGrow: 1, gap: 8, padding: 8, borderRadius: radius.lg, borderWidth: 1 },
  artTop: { position: 'absolute', top: 6, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { borderWidth: 2, borderRadius: 9 },
  strip: { flexDirection: 'row', gap: 3 },
  cell: { width: '100%', height: 14, borderRadius: 3, borderWidth: 1.5 },
});
