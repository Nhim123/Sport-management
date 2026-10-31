import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { Banner, Btn, Chip, ChipRow, Field, Screen, Segmented, SportBadge, SPORT_ICON } from '../../../components/kit';
import { Card, Num, T } from '../../../components/ui';
import { useCreateRecurring, useDayBookings, useRecurring } from '../../../hooks/useAdmin';
import { useCourts } from '../../../hooks/useCourts';
import { hh, vnd } from '../../../lib/format';
import { addDays, conflicts, dayLabel, dm, occurrences, PREPAID_EXTRA, RECUR_DISCOUNT, sessionPrice, TODAY_ISO, WD } from '../../../lib/recurring';
import { radius, useColors } from '../../../theme/tokens';
import type { Sport } from '../../../types/domain';

const SPORTS: Sport[] = ['cl', 'pb', 'tn', 'bd'];
const HOURS = Array.from({ length: 17 }, (_, i) => 6 + i); // 06:00 → 22:00
const WEEKS = [4, 8, 12, 24];
const STARTS = [TODAY_ISO, addDays(TODAY_ISO, 1), addDays(TODAY_ISO, 8), addDays(TODAY_ISO, 15)];

/** Lập hợp đồng đặt sân định kỳ cho câu lạc bộ: sân, thứ trong tuần, giờ, thời hạn – kiểm tra trùng lịch trước khi tạo */
export default function CreateRecurring() {
  const c = useColors();
  const params = useLocalSearchParams<{ court?: string; start?: string; day?: string }>();
  const { data: courts = [] } = useCourts();
  const { data: series = [] } = useRecurring();
  const { data: today = [] } = useDayBookings();
  const create = useCreateRecurring();

  const preCourt = courts.find((x) => x.id === params.court);
  const [club, setClub] = useState('');
  const [contact, setContact] = useState('');
  const [sport, setSport] = useState<Sport | null>(null);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>(params.day ? [Number(params.day)] : []);
  const [start, setStart] = useState(params.start ? Number(params.start) : 18);
  const [span, setSpan] = useState(2);
  const [from, setFrom] = useState(TODAY_ISO);
  const [weeks, setWeeks] = useState(12);
  const [prepaid, setPrepaid] = useState(false);
  const [skipClash, setSkipClash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curSport = sport ?? preCourt?.sport ?? 'cl';
  const sportCourts = courts.filter((x) => x.sport === curSport);
  const court = sportCourts.find((x) => x.id === (courtId ?? params.court)) ?? sportCourts[0];
  const to = addDays(from, weeks * 7 - 1);
  const draft = { courtId: court?.id ?? '', days, start, span, from, to, skips: [] as string[] };
  const clash = court && days.length ? conflicts(draft, series, today) : [];
  const sessions = days.length ? occurrences({ ...draft, skips: skipClash ? clash.map((x) => x.date) : [] }) : [];
  const { discount, price } = sessionPrice(court?.price ?? 0, span, weeks, prepaid);
  const full = (court?.price ?? 0) * span;
  const late = start + span > 23;

  const toggleDay = (i: number) => setDays((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort()));

  const submit = () => {
    setError(null);
    if (!club.trim()) return setError('Nhập tên câu lạc bộ / nhóm.');
    if (!court) return setError('Chọn sân.');
    create.mutate(
      {
        input: { club, contact: contact.trim() || 'Chưa có liên hệ', courtId: court.id, days, start, span, from, to, pricePerSession: price, discount, pay: prepaid ? 'prepaid' : 'month', skips: [] },
        skipConflicts: skipClash,
      },
      { onSuccess: () => router.back(), onError: (e) => setError((e as Error).message) },
    );
  };

  const blocked = !days.length || late || (clash.length > 0 && !skipClash) || !sessions.length;
  const footer = (
    <View style={[st.footer, { borderTopColor: c.line, backgroundColor: c.surfaceRaised }]}>
      <Btn
        label={create.isPending ? 'Đang tạo…' : days.length ? `Tạo lịch định kỳ · ${sessions.length} buổi` : 'Chọn thứ trong tuần'}
        icon="check"
        disabled={blocked || create.isPending}
        onPress={submit}
      />
    </View>
  );

  return (
    <Screen title="Đặt định kỳ" sub="Câu lạc bộ / nhóm thuê sân cố định hàng tuần" back footer={footer}>
      {error && <Banner tone="danger" text={error} />}

      <Field label="Câu lạc bộ / nhóm *" value={club} onChangeText={setClub} placeholder="VD: CLB Cầu lông Sunrise" />
      <Field label="Người liên hệ · SĐT" value={contact} onChangeText={setContact} placeholder="VD: Anh Minh · 0901 234 567" />

      <Group title="Môn & sân">
        <ChipRow>
          {SPORTS.map((s) => (
            <Chip
              key={s}
              label={SPORT_ICON[s].label}
              on={s === curSport}
              onPress={() => {
                setSport(s);
                setCourtId(null);
              }}
              left={<SportBadge sport={s} size={22} />}
            />
          ))}
        </ChipRow>
        <ChipRow>
          {sportCourts.map((x) => (
            <Chip key={x.id} label={`${x.name} · ${vnd(x.price)}/giờ`} on={x.id === court?.id} onPress={() => setCourtId(x.id)} />
          ))}
        </ChipRow>
      </Group>

      <Group title="Chơi vào các thứ">
        <View style={st.days}>
          {WD.map((d, i) => {
            const on = days.includes(i);
            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={d}
                onPress={() => toggleDay(i)}
                style={[st.day, { backgroundColor: on ? c.brand : c.surfaceRaised, borderColor: on ? c.brand : c.line }]}
              >
                <T w={700} color={on ? c.onBrand : c.ink}>{d}</T>
              </Pressable>
            );
          })}
        </View>
      </Group>

      <Group title={`Giờ chơi · ${hh(start)} – ${hh(start + span)}`}>
        <ChipRow>
          {HOURS.map((h) => (
            <Chip key={h} label={hh(h)} on={h === start} onPress={() => setStart(h)} />
          ))}
        </ChipRow>
        <Segmented options={[1, 2, 3].map((n) => ({ id: n, label: `${n} giờ/buổi` }))} value={span} onChange={setSpan} />
        {late && <T size={12} color={c.danger}>Quá giờ đóng cửa 23:00 – chọn giờ sớm hơn hoặc giảm thời lượng.</T>}
      </Group>

      <Group title="Bắt đầu từ">
        <ChipRow>
          {STARTS.map((d) => (
            <Chip key={d} label={`${dayLabel(d)}${d === TODAY_ISO ? ' · hôm nay' : ''}`} on={d === from} onPress={() => setFrom(d)} />
          ))}
        </ChipRow>
      </Group>

      <Group title={`Thời hạn · đến ${dayLabel(to)}`}>
        <ChipRow>
          {WEEKS.map((w) => (
            <Chip key={w} label={`${w} tuần · −${Math.round((RECUR_DISCOUNT[w] ?? 0) * 100)}%`} on={w === weeks} onPress={() => setWeeks(w)} />
          ))}
        </ChipRow>
        <Segmented
          options={[{ id: 'month', label: 'Trả theo tháng' }, { id: 'prepaid', label: `Trả trước (−${PREPAID_EXTRA * 100}% thêm)` }]}
          value={prepaid ? 'prepaid' : 'month'}
          onChange={(v) => setPrepaid(v === 'prepaid')}
        />
      </Group>

      {days.length > 0 && court && (
        clash.length === 0 ? (
          <Banner text={`Không trùng lịch: ${court.name} trống ${hh(start)}–${hh(start + span)} vào ${days.map((d) => WD[d]).join(', ')} suốt ${weeks} tuần.`} />
        ) : (
          <Card style={{ gap: 8, borderColor: c.warning }}>
            <View style={st.row}>
              <Icon name="alert" size={18} color={c.warning} />
              <T w={700} color={c.warning} style={{ flex: 1 }}>Trùng lịch {clash.length} buổi</T>
            </View>
            {clash.slice(0, 5).map((x) => (
              <T key={x.date} size={13}>{dayLabel(x.date)} · đã có {x.who}</T>
            ))}
            {clash.length > 5 && <T size={12} color={c.inkMuted}>… và {clash.length - 5} buổi khác</T>}
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: skipClash }} onPress={() => setSkipClash((v) => !v)} style={st.row}>
              <View style={[st.check, { borderColor: skipClash ? c.brand : c.lineStrong, backgroundColor: skipClash ? c.brand : 'transparent' }]}>
                {skipClash && <Icon name="check" size={14} color={c.onBrand} />}
              </View>
              <T size={13} style={{ flex: 1 }}>Bỏ qua các buổi trùng (ghi thành ngày nghỉ)</T>
            </Pressable>
          </Card>
        )
      )}

      {days.length > 0 && court && (
        <Card style={{ gap: 6 }}>
          <View style={st.between}>
            <T color={c.inkMuted}>Giá lẻ {hh(start)}–{hh(start + span)}</T>
            <T color={c.inkMuted} style={{ textDecorationLine: discount ? 'line-through' : 'none' }}>{vnd(full)}</T>
          </View>
          <View style={st.between}>
            <T>Giá mỗi buổi (−{Math.round(discount * 100)}%)</T>
            <Num size={18} w={600}>{vnd(price)}</Num>
          </View>
          <View style={st.between}>
            <T color={c.inkMuted}>{sessions.length} buổi · {dm(from)} – {dm(to)}</T>
            <T color={c.inkMuted}>{prepaid ? 'Thu trước toàn bộ' : 'Thu theo tháng'}</T>
          </View>
          <View style={[st.between, { borderTopWidth: 1, borderTopColor: c.lineSoft, paddingTop: 8 }]}>
            <T w={700}>Giá trị hợp đồng</T>
            <Num size={24}>{vnd(price * sessions.length)}</Num>
          </View>
        </Card>
      )}
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <T size={13} w={700}>{title}</T>
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
