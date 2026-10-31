import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { Badge, Banner, Btn, Chip, ChipRow, ListRow, Screen, Segmented, Sheet, SportBadge, StatTile } from '../../../components/kit';
import { NoticeBell } from '../../../components/NoticeBell';
import { Card, T } from '../../../components/ui';
import { useExtendRecurring, useRecurring, useSetRecurringStatus, useToggleSkip } from '../../../hooks/useAdmin';
import { useCourts } from '../../../hooks/useCourts';
import { hh, vnd } from '../../../lib/format';
import { addDays, dayLabel, daysLeft, dm, occurrences, TODAY_ISO, WD } from '../../../lib/recurring';
import { radius, useColors } from '../../../theme/tokens';
import type { RecurringBooking, Tone } from '../../../types/admin';

type Tab = RecurringBooking['status'];
const STATUS: Record<Tab, { label: string; tone: Tone }> = {
  active: { label: 'Đang chạy', tone: 'success' },
  paused: { label: 'Tạm dừng', tone: 'warning' },
  ended: { label: 'Đã kết thúc', tone: 'neutral' },
};

/** Thứ trong tuần của hợp đồng: 7 ô T2…CN, ô có buổi được tô */
function WeekDots({ days }: { days: number[] }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {WD.map((d, i) => {
        const on = days.includes(i);
        return (
          <View key={d} style={[st.dot, { backgroundColor: on ? c.brand : c.surfaceSunken }]}>
            <T size={10} w={700} color={on ? c.onBrand : c.inkMuted}>{d}</T>
          </View>
        );
      })}
    </View>
  );
}

/** Hợp đồng đặt sân định kỳ của các câu lạc bộ / nhóm cố định */
export default function RecurringList() {
  const c = useColors();
  const { data: list = [] } = useRecurring();
  const { data: courts = [] } = useCourts();
  const setStatus = useSetRecurringStatus();
  const extend = useExtendRecurring();
  const skip = useToggleSkip();
  const [tab, setTab] = useState<Tab>('active');
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  const courtOf = (id: string) => courts.find((x) => x.id === id);
  const active = list.filter((r) => r.status === 'active');
  const in30 = addDays(TODAY_ISO, 30);
  const revenue30 = active.reduce((s, r) => s + occurrences(r, TODAY_ISO).filter((d) => d <= in30).length * r.pricePerSession, 0);
  const expiring = active.filter((r) => daysLeft(r) <= 14);
  const rows = list.filter((r) => r.status === tab);
  const open = list.find((r) => r.id === openId);

  const fab = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tạo lịch đặt định kỳ"
      onPress={() => router.push('/quan-ly/dinh-ky/tao')}
      style={({ pressed }) => [st.fab, { backgroundColor: c.brand, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <Icon name="plus" color={c.onBrand} />
      <T w={700} color={c.onBrand}>Đặt định kỳ</T>
    </Pressable>
  );

  const doExtend = (r: RecurringBooking, weeks: number) =>
    extend.mutate(
      { id: r.id, weeks },
      {
        onSuccess: (x) => setMsg({ tone: 'success', text: `Đã gia hạn ${r.club} đến ${dm(x.to)}: thêm ${x.added} buổi${x.skipped ? `, bỏ ${x.skipped} buổi trùng lịch` : ''}.` }),
        onError: (e) => setMsg({ tone: 'danger', text: (e as Error).message }),
      },
    );
  const doStatus = (r: RecurringBooking, status: Tab, text: string) => {
    setStatus.mutate({ id: r.id, status }, { onSuccess: () => setMsg({ tone: status === 'ended' ? 'neutral' : 'success', text }) });
    setOpenId(null);
  };

  return (
    <Screen title="Đặt định kỳ" sub={`${active.length} câu lạc bộ đang thuê cố định`} back right={<NoticeBell />} footer={fab}>
      <View style={st.stats}>
        <StatTile label="Đang chạy" value={String(active.length)} highlight />
        <StatTile label="Buổi / tuần" value={String(active.reduce((s, r) => s + r.days.length, 0))} />
        <StatTile label="Thu 30 ngày tới" value={vnd(revenue30)} />
        <StatTile label="Sắp hết hạn" value={String(expiring.length)} />
      </View>
      {msg && <Banner tone={msg.tone} text={msg.text} />}
      {expiring.length > 0 && tab === 'active' && <Banner tone="warning" text={`Sắp hết hạn: ${expiring.map((r) => `${r.club} (${dm(r.to)})`).join(', ')} – nhắc khách gia hạn.`} />}

      <Segmented
        options={(Object.keys(STATUS) as Tab[]).map((k) => ({ id: k, label: `${STATUS[k].label} ${list.filter((r) => r.status === k).length}` }))}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setMsg(null);
        }}
      />

      {rows.length === 0 && <T size={13} color={c.inkMuted}>Không có hợp đồng nào.</T>}
      {rows.map((r) => {
        const ct = courtOf(r.courtId);
        const next = occurrences(r, TODAY_ISO, 1)[0];
        const left = occurrences(r, TODAY_ISO).length;
        const soon = r.status === 'active' && daysLeft(r) <= 14;
        return (
          <ListRow
            key={r.id}
            onPress={() => {
              setOpenId(r.id);
              setMsg(null);
            }}
            accessibilityLabel={`${r.club}, ${STATUS[r.status].label}`}
          >
            {ct && <SportBadge sport={ct.sport} size={44} />}
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <T w={700} numberOfLines={1}>{r.club}</T>
              <T size={12} color={c.inkMuted} numberOfLines={1}>{ct?.name} · {hh(r.start)}–{hh(r.start + r.span)} · {vnd(r.pricePerSession)}/buổi</T>
              <WeekDots days={r.days} />
              <View style={st.badges}>
                {r.status !== 'active' && <Badge label={STATUS[r.status].label} tone={STATUS[r.status].tone} />}
                {soon && <Badge label={`Hết hạn ${dm(r.to)}`} tone="warning" />}
                {r.status === 'active' && next && <Badge label={next === TODAY_ISO ? 'Buổi tới: hôm nay' : `Buổi tới: ${dayLabel(next)}`} tone="info" />}
                <T size={11} color={c.inkMuted}>{dm(r.from)} – {dm(r.to)} · còn {left} buổi</T>
              </View>
            </View>
          </ListRow>
        );
      })}
      <View style={{ height: 72 }} />

      <Sheet visible={!!open} onClose={() => setOpenId(null)} title={open?.club ?? ''}>
        {open && (
          <>
            <Card style={{ gap: 6 }}>
              <Row label="Liên hệ" value={open.contact} />
              <Row label="Sân · giờ" value={`${courtOf(open.courtId)?.name} · ${hh(open.start)}–${hh(open.start + open.span)}`} />
              <Row label="Thời hạn" value={`${dm(open.from)} – ${dm(open.to)} · ${occurrences(open).length} buổi`} />
              <Row label="Giá" value={`${vnd(open.pricePerSession)}/buổi · giảm ${Math.round(open.discount * 100)}%`} />
              <Row label="Thanh toán" value={`${open.pay === 'prepaid' ? 'Trả trước' : 'Theo tháng'} · đã trả ${open.paidSessions} buổi`} />
              <WeekDots days={open.days} />
            </Card>

            {open.status !== 'ended' && (
              <>
                <T size={13} w={700}>Buổi sắp tới – chạm để cho nghỉ / mở lại</T>
                {occurrences({ ...open, skips: [] }, TODAY_ISO, 6).map((d) => {
                  const off = open.skips.includes(d);
                  return (
                    <Pressable
                      key={d}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: !off }}
                      onPress={() => skip.mutate({ id: open.id, date: d })}
                      style={[st.session, { borderColor: c.line, backgroundColor: off ? c.surfaceSunken : c.surfaceRaised }]}
                    >
                      <T w={600} style={{ flex: 1, textDecorationLine: off ? 'line-through' : 'none' }} color={off ? c.inkMuted : c.ink}>
                        {dayLabel(d)}{d === TODAY_ISO ? ' · hôm nay' : ''} · {hh(open.start)}–{hh(open.start + open.span)}
                      </T>
                      <Badge label={off ? 'Nghỉ' : 'Có buổi'} tone={off ? 'neutral' : 'success'} />
                    </Pressable>
                  );
                })}
              </>
            )}

            <T size={13} w={700}>Gia hạn</T>
            <ChipRow>
              {[4, 8, 12].map((w) => (
                <Chip key={w} label={`+${w} tuần`} onPress={() => doExtend(open, w)} />
              ))}
            </ChipRow>
            {open.status === 'active' && <Btn label="Tạm dừng hợp đồng" kind="secondary" onPress={() => doStatus(open, 'paused', `Đã tạm dừng lịch của ${open.club}.`)} />}
            {open.status === 'paused' && <Btn label="Tiếp tục hợp đồng" onPress={() => doStatus(open, 'active', `${open.club} chơi lại theo lịch.`)} />}
            {open.status !== 'ended' && <Btn label="Kết thúc hợp đồng" kind="danger" onPress={() => doStatus(open, 'ended', `Đã kết thúc hợp đồng với ${open.club}.`)} />}
          </>
        )}
      </Sheet>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <T size={13} color={c.inkMuted}>{label}</T>
      <T size={13} w={600} style={{ flexShrink: 1, textAlign: 'right' }}>{value}</T>
    </View>
  );
}

const st = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dot: { width: 26, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  session: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1 },
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
