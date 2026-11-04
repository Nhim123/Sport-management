import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NOW_HOUR } from '../../api/admin.api';
import { Icon } from '../../components/Icon';
import { Banner, Btn, Chip, ChipRow, Field, Screen, SectionHead, SportBadge } from '../../components/kit';
import { Num, T } from '../../components/ui';
import { useCreateNotice } from '../../hooks/useAdmin';
import { useBookWeekSlots, useCourtSetup, useCourts, useWeekTaken } from '../../hooks/useCourts';
import { hh, vnd } from '../../lib/format';
import { WD, weekday, TODAY_ISO } from '../../lib/recurring';
import { radius, useColors } from '../../theme/tokens';
import type { CourtShift } from '../../types/domain';

const TODAY_WD = weekday(TODAY_ISO); // 6 = CN theo dữ liệu mẫu
const key = (d: number, shiftId: string) => `${d}-${shiftId}`;

/**
 * Đặt & xếp sân trong một màn: khách chọn NGÀY + CA (theo thiết lập của chủ sân)
 * trên lưới tuần rồi gửi yêu cầu. Lượt đặt ở trạng thái "chờ thanh toán" cho tới
 * khi chủ sân xác nhận đã nhận tiền trong màn Thông báo.
 */
export default function BookAndSchedule() {
  const c = useColors();
  const { data: courts = [] } = useCourts();
  const { data: setup } = useCourtSetup();
  const [courtId, setCourtId] = useState<string | undefined>();
  const court = courts.find((x) => x.id === courtId) ?? courts[0];
  const { data: taken = {} } = useWeekTaken(court?.id);
  const book = useBookWeekSlots();
  const notify = useCreateNotice();

  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [sel, setSel] = useState<Record<string, true>>({});
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning' | 'danger'; text: string } | null>(null);

  if (!court || !setup) {
    return (
      <Screen title="Đặt & xếp sân" back>
        <T color={c.inkMuted}>Đang tải…</T>
      </Screen>
    );
  }

  const { openDays, shifts } = setup;
  const isOpen = (d: number) => openDays.includes(d);
  const closedDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !isOpen(d));
  const busy = book.isPending || notify.isPending;

  // Trạng thái một ca: đã đặt (paid) hay đang chờ thanh toán
  const caState = (d: number, sh: CourtShift): 'booked' | 'pending' | null => {
    const day = taken[d];
    if (!day) return null;
    for (let h = sh.start; h < sh.start + sh.span; h++) if (day.booked.includes(h)) return 'booked';
    for (let h = sh.start; h < sh.start + sh.span; h++) if (day.pending.includes(h)) return 'pending';
    return null;
  };
  const past = (d: number, sh: CourtShift) => d === TODAY_WD && sh.start < NOW_HOUR;

  const onCell = (d: number, sh: CourtShift) => {
    setNotice(null);
    if (!isOpen(d)) return setNotice({ tone: 'warning', text: `Chủ sân nghỉ ${WD[d]}.` });
    const k = key(d, sh.id);
    if (sel[k]) {
      setSel((cur) => {
        const next = { ...cur };
        delete next[k];
        return next;
      });
      return;
    }
    const state = caState(d, sh);
    if (state === 'booked') return setNotice({ tone: 'warning', text: `${sh.label} ${WD[d]} đã có người đặt.` });
    if (state === 'pending') return setNotice({ tone: 'warning', text: `${sh.label} ${WD[d]} đang chờ xác nhận thanh toán.` });
    if (past(d, sh)) return setNotice({ tone: 'warning', text: `${sh.label} hôm nay đã qua.` });
    setSel((cur) => ({ ...cur, [k]: true }));
  };

  const picked = Object.keys(sel).map((k) => {
    const d = Number(k.slice(0, k.indexOf('-')));
    const sh = shifts.find((x) => x.id === k.slice(k.indexOf('-') + 1))!;
    return { day: d, shift: sh };
  });
  const total = picked.reduce((sum, p) => sum + court.price * p.shift.span, 0);

  const changeCourt = (id: string) => {
    setCourtId(id);
    setSel({});
    setNotice(null);
  };

  const submit = async () => {
    if (!picked.length) return;
    if (!customer.trim()) return setNotice({ tone: 'warning', text: 'Nhập tên khách đặt sân.' });
    const count = picked.length;
    try {
      const res = await book.mutateAsync({
        courtId: court.id,
        customer: customer.trim(),
        phone: phone.trim(),
        slots: picked.map((p) => ({ day: p.day, start: p.shift.start, span: p.shift.span })),
      });
      await notify.mutateAsync({
        kind: 'payment',
        sport: court.sport,
        who: `${customer.trim()}${phone.trim() ? ' · ' + phone.trim() : ''}`,
        detail: `${court.name} · ${count} ca`,
        amount: res.total,
        note: `Khách đặt: ${picked.map((p) => `${WD[p.day]} ${p.shift.label}`).join(', ')}. Xin xác nhận đã nhận thanh toán.`,
        weekBookingId: res.id,
      });
      setSel({});
      setCustomer('');
      setPhone('');
      setNotice({ tone: 'success', text: `Đã gửi chủ sân xác nhận thanh toán ${count} ca (${vnd(res.total)}). Các ca đang "chờ thanh toán".` });
    } catch (e) {
      setNotice({ tone: 'danger', text: (e as Error).message });
    }
  };

  const footer = (
    <View style={[st.footer, { borderTopColor: c.line, backgroundColor: c.surfaceRaised }]}>
      <Btn
        label={busy ? 'Đang gửi…' : picked.length ? `Đặt ${picked.length} ca · ${vnd(total)}` : 'Chạm một ca trống để chọn'}
        icon="check"
        disabled={!picked.length || busy}
        onPress={submit}
      />
    </View>
  );

  return (
    <Screen title="Đặt & xếp sân" sub="Chọn sân, ngày & ca · gửi chủ sân xác nhận thanh toán" back footer={footer}>
      <ChipRow>
        {courts.map((x) => (
          <Chip key={x.id} label={x.name} on={x.id === court.id} onPress={() => changeCourt(x.id)} left={<SportBadge sport={x.sport} size={22} />} />
        ))}
      </ChipRow>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SportBadge sport={court.sport} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Num size={24}>{court.name}</Num>
          <T size={13} color={c.inkMuted}>{court.kind} · {vnd(court.price)}/giờ</T>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Field label="Tên khách đặt sân *" value={customer} onChangeText={setCustomer} placeholder="VD: Anh Minh" />
        <Field label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="VD: 0901 234 567" keyboardType="phone-pad" />
      </View>

      <Banner
        tone="info"
        text={`Thiết lập của chủ sân · ${shifts.length} ca/ngày · ${closedDays.length ? `nghỉ ${closedDays.map((d) => WD[d]).join(', ')}` : 'mở cả tuần'}`}
      />

      {notice && <Banner tone={notice.tone} text={notice.text} />}

      <SectionHead title="Chọn ngày & ca" />
      <View style={st.legend}>
        <Legend color={c.surfaceRaised} border={c.line} label="Trống" />
        <Legend color={c.brand} label="Đang chọn" />
        <Legend color={c.warningTint} border={c.warning} label="Chờ thanh toán" />
        <Legend color={c.dangerTint} label="Đã đặt" />
        <Legend color={c.surfaceSunken} label="Nghỉ" />
      </View>

      <View style={{ gap: 4 }}>
        {/* Hàng tiêu đề: cột ca + 7 thứ */}
        <View style={st.row}>
          <View style={st.caCol} />
          {WD.map((d, i) => {
            const open = isOpen(i);
            const today = i === TODAY_WD;
            return (
              <View key={d} style={st.head}>
                <T size={12} w={700} color={today ? c.brand : open ? c.ink : c.inkMuted}>{d}</T>
                {today ? <T size={9} w={700} color={c.brand}>nay</T> : !open ? <T size={9} color={c.inkMuted}>nghỉ</T> : null}
              </View>
            );
          })}
        </View>

        {shifts.map((sh) => (
          <View key={sh.id} style={st.row}>
            <View style={st.caCol}>
              <T size={12} w={700} numberOfLines={1}>{sh.label}</T>
              <T size={11} color={c.inkMuted}>{hh(sh.start)}–{hh(sh.start + sh.span)}</T>
            </View>
            {WD.map((_, d) => {
              const open = isOpen(d);
              const on = sel[key(d, sh.id)] === true;
              const state = open ? caState(d, sh) : null;
              const isPast = open && past(d, sh);
              const bg = !open
                ? c.surfaceSunken
                : on
                  ? c.brand
                  : state === 'booked'
                    ? c.dangerTint
                    : state === 'pending'
                      ? c.warningTint
                      : isPast
                        ? c.surfaceSunken
                        : c.surfaceRaised;
              const border = on ? c.brand : state === 'booked' ? c.danger : state === 'pending' ? c.warning : c.line;
              const stLabel = !open ? 'nghỉ' : state === 'booked' ? 'đã đặt' : state === 'pending' ? 'chờ thanh toán' : on ? 'đang chọn' : 'trống';
              return (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  accessibilityLabel={`${sh.label} ${WD[d]} ${stLabel}`}
                  accessibilityState={{ selected: on, disabled: !open || state !== null || isPast }}
                  onPress={() => onCell(d, sh)}
                  style={[st.cell, { backgroundColor: bg, borderColor: border, opacity: !open || (isPast && !on) ? 0.5 : 1 }]}
                >
                  {on && <Icon name="check" size={14} color={c.onBrand} />}
                  {state === 'booked' && !on && <View style={[st.dot, { backgroundColor: c.danger }]} />}
                  {state === 'pending' && !on && <Icon name="timer" size={13} color={c.warning} />}
                  {!open && <T size={12} color={c.inkMuted}>—</T>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <T size={12} color={c.inkMuted}>
        Chạm một ca trống để chọn (nhiều ngày & ca cùng lúc). Đặt xong, chủ sân sẽ nhận thông báo để xác nhận đã thu tiền.
      </T>

      {picked.length > 0 && (
        <View style={[st.summary, { backgroundColor: c.surfaceSunken }]}>
          <View style={st.between}>
            <T color={c.inkMuted}>{picked.length} ca đã chọn</T>
            <Num size={20} w={600}>{vnd(total)}</Num>
          </View>
          <Pressable accessibilityRole="button" onPress={() => { setSel({}); setNotice(null); }} hitSlop={8}>
            <T size={13} w={600} color={c.brand}>Xóa lựa chọn</T>
          </Pressable>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/quan-ly/dinh-ky/tao')}
        style={[st.link, { borderColor: c.line }]}
      >
        <Icon name="renew" size={18} color={c.brand} />
        <T size={13} style={{ flex: 1 }}>Cần hợp đồng thuê cố định dài hạn? <T size={13} w={700} color={c.brandInk}>Đặt định kỳ</T></T>
      </Pressable>
    </Screen>
  );
}

function Legend({ color, border, label }: { color: string; border?: string; label: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[st.swatch, { backgroundColor: color, borderColor: border ?? color }]} />
      <T size={12} color={c.inkMuted}>{label}</T>
    </View>
  );
}

const st = StyleSheet.create({
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
  legend: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  swatch: { width: 16, height: 16, borderRadius: 5, borderWidth: 1 },
  row: { flexDirection: 'row', gap: 4, alignItems: 'stretch' },
  caCol: { width: 84, justifyContent: 'center' },
  head: { flex: 1, alignItems: 'center', paddingBottom: 2 },
  cell: { flex: 1, height: 46, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  summary: { padding: 12, borderRadius: radius.md, gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, borderWidth: 1 },
});
