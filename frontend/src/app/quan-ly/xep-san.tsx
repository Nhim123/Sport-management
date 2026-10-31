import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CLOSE_HOUR, hm, isFree, NOW_HOUR, OPEN_HOUR } from '../../api/admin.api';
import { Icon } from '../../components/Icon';
import { Badge, Banner, Btn, Chip, ChipRow, Screen, SectionHead, SportBadge, SPORT_ICON } from '../../components/kit';
import { Card, Num, T } from '../../components/ui';
import { useConfirmNotice, useDayBookings, useNotices } from '../../hooks/useAdmin';
import { useCourts } from '../../hooks/useCourts';
import { vnd } from '../../lib/format';
import { useAuth } from '../../store/auth';
import { radius, useColors } from '../../theme/tokens';
import type { AdminBooking } from '../../types/admin';

const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

/** Xếp yêu cầu đặt sân online vào một sân trống: chọn giờ, chọn sân cùng môn rồi xác nhận */
export default function ArrangeCourt() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: notices = [] } = useNotices();
  const { data: bookings = [] } = useDayBookings();
  const { data: allCourts = [] } = useCourts();
  const confirm = useConfirmNotice();
  const n = notices.find((x) => x.id === id);
  const req = n?.booking;

  const [start, setStart] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ courtId: string; courtName: string; start: number } | null>(null);

  if (done && n) {
    return (
      <Screen title="Xếp sân" back>
        <View style={st.success}>
          <View style={[st.successIc, { backgroundColor: c.brand }]}>
            <Icon name="check" size={32} color={c.onBrand} />
          </View>
          <Num size={26}>Đã xếp sân</Num>
          <T style={{ textAlign: 'center' }}>
            <T w={700}>{n.who.split(' · ')[0]}</T> vào <T w={700}>{done.courtName}</T> · {hm(done.start)} – {hm(done.start + (req?.span ?? 1))}
          </T>
          <T size={13} color={c.inkMuted} style={{ textAlign: 'center' }}>Lượt đặt đã có trên lịch sân. Hãy báo lại cho khách sân được xếp.</T>
        </View>
        <Btn label="Xem trên lịch sân" icon="calendar" onPress={() => router.replace({ pathname: '/quan-ly/lich-san', params: { court: done.courtId } })} />
        <Btn label="Về thông báo" kind="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!n || !req) {
    return (
      <Screen title="Xếp sân" back>
        <T color={c.inkMuted}>{notices.length ? 'Không tìm thấy yêu cầu đặt sân này.' : 'Đang tải…'}</T>
      </Screen>
    );
  }
  if (n.status !== 'pending') {
    return (
      <Screen title="Xếp sân" back>
        <Banner tone="neutral" text={`Yêu cầu của ${n.who.split(' · ')[0]} đã được xử lý (${n.detail}).`} />
        <Btn label="Về thông báo" kind="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const courts = allCourts.filter((x) => x.sport === req.sport);
  const span = req.span;
  const slot = start ?? Math.max(req.start, NOW_HOUR);
  const freeAt = (h: number) => courts.filter((x) => isFree(bookings, x.id, h, span));
  const free = freeAt(slot);
  // Ưu tiên sân nhân viên đã bấm, rồi sân khách chọn, rồi sân trống đầu tiên
  const auto = free.find((x) => x.id === req.courtId) ?? free[0];
  const chosen = free.find((x) => x.id === picked) ?? auto;
  const slots = HOURS.filter((h) => h >= NOW_HOUR && h + span <= CLOSE_HOUR);

  const clash = (courtId: string): AdminBooking | undefined =>
    bookings.find((b) => b.courtId === courtId && b.start < slot + span && slot < b.start + b.span);

  const submit = () => {
    if (!chosen) return;
    setError(null);
    confirm.mutate(
      { id: n.id, by: user?.name ?? 'Nhân viên', placement: { courtId: chosen.id, start: slot } },
      {
        onSuccess: () => setDone({ courtId: chosen.id, courtName: chosen.name, start: slot }),
        onError: (e) => setError((e as Error).message),
      },
    );
  };

  const footer = (
    <View style={[st.footer, { borderTopColor: c.line, backgroundColor: c.surfaceRaised }]}>
      <Btn
        label={confirm.isPending ? 'Đang xếp sân…' : chosen ? `Xếp vào ${chosen.name} · ${hm(slot)}–${hm(slot + span)}` : 'Chưa có sân trống'}
        icon="check"
        disabled={!chosen || confirm.isPending}
        onPress={submit}
      />
    </View>
  );

  return (
    <Screen title="Xếp sân" sub={`${SPORT_ICON[req.sport].label} · yêu cầu đặt online`} back footer={footer}>
      <Card style={{ gap: 8 }}>
        <View style={st.row}>
          <SportBadge sport={req.sport} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T w={700} numberOfLines={1}>{n.who}</T>
            <T size={13} color={c.inkMuted}>Yêu cầu: {n.detail}</T>
          </View>
          {n.amount !== undefined && <Num size={18} w={600}>{vnd(n.amount)}</Num>}
        </View>
        {n.note && (
          <View style={[st.note, { backgroundColor: c.surfaceSunken }]}>
            <T size={13} color={c.inkMuted}>{n.note}</T>
          </View>
        )}
      </Card>

      {error && <Banner tone="danger" text={error} />}

      <SectionHead title={`Giờ vào sân · ${span} giờ`} />
      <ChipRow>
        {slots.map((h) => (
          <Chip
            key={h}
            label={`${hm(h)}${h === req.start ? ' · khách đặt' : ''}`}
            count={freeAt(h).length}
            on={h === slot}
            onPress={() => {
              setStart(h);
              setPicked(null);
              setError(null);
            }}
          />
        ))}
      </ChipRow>
      <T size={12} color={c.inkMuted}>Số trên mỗi giờ là số sân {SPORT_ICON[req.sport].label.toLowerCase()} còn trống.</T>

      <SectionHead title={`Chọn sân · ${free.length}/${courts.length} trống`} />
      {free.length === 0 && <Banner tone="warning" text={`Không còn sân trống lúc ${hm(slot)}. Chọn giờ khác hoặc quay lại để từ chối yêu cầu.`} />}

      {courts.map((ct) => {
        const ok = free.includes(ct);
        const on = chosen?.id === ct.id;
        const b = clash(ct.id);
        return (
          <Pressable
            key={ct.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on, disabled: !ok }}
            disabled={!ok}
            onPress={() => setPicked(ct.id)}
            style={[st.court, { borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandTint : c.surfaceRaised, opacity: ok ? 1 : 0.75 }]}
          >
            <View style={st.row}>
              <View style={[st.radio, { borderColor: on ? c.brand : c.lineStrong }]}>{on && <View style={[st.dot, { backgroundColor: c.brand }]} />}</View>
              <SportBadge sport={ct.sport} size={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w={700} numberOfLines={1}>{ct.name}</T>
                <T size={12} color={c.inkMuted} numberOfLines={1}>{ct.kind}</T>
              </View>
              {ct.id === req.courtId && <Badge label="Khách chọn" tone="info" />}
            </View>
            <T size={13} color={ok ? c.brandInk : c.danger}>
              {ok ? `Trống ${hm(slot)} – ${hm(slot + span)}` : b ? `Đã có ${b.label} · ${hm(b.start)}–${hm(b.start + b.span)}` : 'Không trống'}
            </T>
            <DayStrip courtId={ct.id} bookings={bookings} start={slot} span={span} />
          </Pressable>
        );
      })}
    </Screen>
  );
}

/** Dải giờ trong ngày của một sân: ô đã có lịch, ô đang chọn */
function DayStrip({ courtId, bookings, start, span }: { courtId: string; bookings: AdminBooking[]; start: number; span: number }) {
  const c = useColors();
  return (
    <View style={{ gap: 4 }}>
      <View style={st.strip}>
        {HOURS.map((h) => {
          const busy = !isFree(bookings, courtId, h, 1);
          const sel = h >= start && h < start + span;
          const past = h < NOW_HOUR;
          const bg = sel ? (busy ? c.danger : c.brand) : busy ? c.lineStrong : c.surfaceSunken;
          return <View key={h} style={[st.cell, { backgroundColor: bg, opacity: past && !sel ? 0.45 : 1 }]} />;
        })}
      </View>
      <View style={st.between}>
        <T size={11} color={c.inkMuted}>{hm(OPEN_HOUR)}</T>
        <T size={11} color={c.inkMuted}>{hm(CLOSE_HOUR)}</T>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  note: { borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  court: { gap: 10, padding: 14, borderRadius: radius.lg, borderWidth: 1.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  strip: { flexDirection: 'row', gap: 3 },
  cell: { flex: 1, height: 10, borderRadius: 3 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
  success: { alignItems: 'center', gap: 10, paddingVertical: 32, paddingHorizontal: 16 },
  successIc: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
