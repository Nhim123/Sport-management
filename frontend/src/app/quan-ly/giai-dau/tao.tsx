import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { Banner, Btn, Chip, ChipRow, Field, Screen, Segmented, SportBadge, SPORT_ICON } from '../../../components/kit';
import { Card, Num, T } from '../../../components/ui';
import { useCreateTournament } from '../../../hooks/useAdmin';
import { useCourts } from '../../../hooks/useCourts';
import { hh, vnd } from '../../../lib/format';
import { DEFAULT_RULE, defaultSwissRounds, FORMATS, formatStats, formatSummary, MATCH_RULES, type FormatOptions } from '../../../lib/tournament';
import { radius, useColors } from '../../../theme/tokens';
import type { Format, Tournament } from '../../../types/admin';
import type { Sport } from '../../../types/domain';

const STEPS = ['Thông tin', 'Thể thức', 'Sân & giờ', 'Xem lại'];
const SPORTS: Sport[] = ['cl', 'pb', 'tn', 'bd'];
const ENTRY: Record<Sport, string[]> = { cl: ['Đơn', 'Đôi'], pb: ['Đơn', 'Đôi'], tn: ['Đơn', 'Đôi'], bd: ['Đồng đội'] };
const SIZES = [4, 8, 12, 16, 24, 32];
const GROUPS = [2, 3, 4, 6, 8];
const SEEDS = [0, 2, 4, 8];
const FEES = [0, 100000, 200000, 300000, 500000];
const FROM = [6, 7, 8, 9, 10];
const TO = [17, 18, 19, 20, 21, 22];
const DEADLINE = [3, 7, 14];

// "Hôm nay" của dữ liệu mẫu: CN 18/10/2026; giải đấu diễn ra vào cuối tuần (T7–CN)
const TODAY = new Date(2026, 9, 18);
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const day = (d: Date) => `${WD[d.getDay()]} ${dm(d)}`;
const WEEKENDS = Array.from({ length: 7 }, (_, i) => addDays(new Date(2026, 9, 31), i * 7));

/** Tạo giải đấu trên điện thoại – 4 bước, kiểm tra từng bước trước khi đi tiếp */
export default function CreateTournament() {
  const c = useColors();
  const { data: allCourts = [] } = useCourts();
  const create = useCreateTournament();
  const [step, setStep] = useState(0);
  const [showErr, setShowErr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [sport, setSport] = useState<Sport>('cl');
  const [entry, setEntry] = useState('Đôi');
  const [weekend, setWeekend] = useState(3);
  const [deadline, setDeadline] = useState(7);
  const [fee, setFee] = useState(200000);
  const [prize, setPrize] = useState('');
  const [format, setFormat] = useState<Format>('knockout');
  const [size, setSize] = useState(16);
  const [seeds, setSeeds] = useState(4);
  const [opts, setOpts] = useState<FormatOptions>({ thirdPlace: true, legs: 1, groups: 4, advance: 2, swissRounds: defaultSwissRounds(16) });
  const [ruleIdx, setRuleIdx] = useState<number | null>(null);
  const [courtIds, setCourtIds] = useState<string[] | null>(null);
  const [from, setFrom] = useState(8);
  const [to, setTo] = useState(20);

  const courts = allCourts.filter((x) => x.sport === sport);
  const picked = courtIds ?? courts.map((x) => x.id);
  const chosen = courts.filter((x) => picked.includes(x.id));
  const startD = WEEKENDS[weekend];
  const endD = addDays(startD, 1);
  const deadlineD = addDays(startD, -deadline);
  const rule = MATCH_RULES[sport][ruleIdx ?? DEFAULT_RULE[sport]];
  const stats = formatStats(format, size, opts);
  const capacity = chosen.length * (to - from) * Math.floor((60 / rule.minutes) * 10) / 10 * 2;
  const noun = sport === 'bd' || entry === 'Đồng đội' ? 'đội' : entry === 'Đôi' ? 'cặp' : 'VĐV';
  const setOpt = (p: Partial<FormatOptions>) => setOpts((o) => ({ ...o, ...p }));

  const errors: Record<string, string> = {};
  if (step === 0) {
    if (name.trim().length < 5) errors.name = 'Nhập tên giải (ít nhất 5 ký tự).';
    if (deadlineD < TODAY) errors.deadline = 'Hạn đăng ký đã qua – chọn ngày thi đấu muộn hơn hoặc hạn ngắn hơn.';
  }
  if (step === 1) {
    if (format === 'groups' && size / opts.groups < 3) errors.format = `Mỗi bảng cần ít nhất 3 ${noun} – giảm số bảng hoặc tăng quy mô.`;
    if (format === 'roundrobin' && size > 16) errors.format = `Vòng tròn ${size} ${noun} là ${stats.matches} trận – quá nhiều, nên chọn vòng bảng.`;
    if (format === 'swiss' && opts.swissRounds >= size) errors.format = `Số vòng Thụy Sĩ phải ít hơn số ${noun}.`;
  }
  if (step === 2) {
    if (!chosen.length) errors.courts = 'Chọn ít nhất 1 sân thi đấu.';
    if (to <= from) errors.hours = 'Giờ kết thúc phải sau giờ bắt đầu.';
  }
  const err = (k: string) => (showErr ? errors[k] : undefined);

  const next = () => {
    if (Object.keys(errors).length) return setShowErr(true);
    setShowErr(false);
    setStep((s) => s + 1);
  };
  const back = () => {
    setShowErr(false);
    setError(null);
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  const changeSport = (s: Sport) => {
    setSport(s);
    setEntry(ENTRY[s].includes(entry) ? entry : ENTRY[s][ENTRY[s].length - 1]);
    setCourtIds(null);
    setRuleIdx(null);
  };
  const changeSize = (n: number) => {
    setSize(n);
    setOpt({
      groups: n / opts.groups < 3 ? GROUPS.filter((g) => n / g >= 3).pop() ?? 2 : opts.groups,
      swissRounds: Math.min(opts.swissRounds, n - 1),
    });
    if (seeds > n / 2) setSeeds(SEEDS.filter((x) => x <= n / 2).pop() ?? 0);
  };
  const toggleCourt = (id: string) => setCourtIds(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  const draft = {
    format,
    groupCount: format === 'groups' ? opts.groups : 1,
    thirdPlace: format === 'knockout' || format === 'groups' ? opts.thirdPlace : undefined,
    legs: format === 'roundrobin' ? opts.legs : undefined,
    advance: format === 'groups' ? opts.advance : undefined,
    swissRounds: format === 'swiss' ? opts.swissRounds : undefined,
  };

  const submit = (status: Tournament['status']) => {
    setError(null);
    create.mutate(
      {
        ...draft,
        name,
        sport,
        entry,
        maxEntrants: size,
        seeds,
        dates: `${day(startD)} – ${day(endD)}/${endD.getFullYear()}`,
        regDeadline: `${day(deadlineD)}/${deadlineD.getFullYear()}`,
        courts: `${chosen.map((x) => x.name).join(', ')} · ${hh(from)}–${hh(to)}`,
        fee,
        prize: prize.trim() || 'Chưa công bố',
        matchRule: rule.label,
        status,
      },
      {
        onSuccess: (t) => router.replace({ pathname: '/quan-ly/giai-dau/[id]', params: { id: t.id } }),
        onError: (e) => setError((e as Error).message),
      },
    );
  };

  const footer = (
    <View style={[st.footer, { borderTopColor: c.line, backgroundColor: c.surfaceRaised }]}>
      {step < 3 ? (
        <View style={st.row}>
          <Btn label={step === 0 ? 'Hủy' : 'Quay lại'} kind="secondary" onPress={back} style={{ flex: 1 }} />
          <Btn label="Tiếp tục" onPress={next} style={{ flex: 1.6 }} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Btn label={create.isPending ? 'Đang tạo…' : 'Tạo & mở đăng ký'} icon="check" disabled={create.isPending} onPress={() => submit('open')} />
          <View style={st.row}>
            <Btn label="Quay lại" kind="ghost" onPress={back} style={{ flex: 1 }} />
            <Btn label="Lưu nháp" kind="secondary" disabled={create.isPending} onPress={() => submit('draft')} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Screen title="Tạo giải đấu" sub={`Bước ${step + 1}/4 · ${STEPS[step]}`} back footer={footer}>
      <View style={st.row}>
        {STEPS.map((label, i) => (
          <View key={label} style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? c.brand : c.line }} />
            <T size={11} w={i === step ? 700 : 500} color={i === step ? c.ink : c.inkMuted} numberOfLines={1}>{label}</T>
          </View>
        ))}
      </View>
      {error && <Banner tone="danger" text={error} />}
      {showErr && Object.keys(errors).length > 0 && <Banner tone="danger" text="Kiểm tra lại các mục được đánh dấu." />}

      {step === 0 && (
        <>
          <View style={{ gap: 6 }}>
            <Field label="Tên giải *" value={name} onChangeText={setName} placeholder="VD: Giải cầu lông Arena mùa đông" />
            {err('name') && <T size={12} color={c.danger}>{err('name')}</T>}
          </View>
          <Group title="Môn thi đấu">
            <ChipRow>
              {SPORTS.map((s) => (
                <Chip key={s} label={SPORT_ICON[s].label} on={s === sport} onPress={() => changeSport(s)} left={<SportBadge sport={s} size={22} />} />
              ))}
            </ChipRow>
          </Group>
          {ENTRY[sport].length > 1 && (
            <Group title="Nội dung">
              <Segmented options={ENTRY[sport].map((e) => ({ id: e, label: e }))} value={entry} onChange={setEntry} />
            </Group>
          )}
          <Group title="Ngày thi đấu (cuối tuần)">
            <ChipRow>
              {WEEKENDS.map((d, i) => (
                <Chip key={i} label={`${dm(d)} – ${dm(addDays(d, 1))}`} on={i === weekend} onPress={() => setWeekend(i)} />
              ))}
            </ChipRow>
          </Group>
          <Group title={`Hạn đăng ký · ${day(deadlineD)}`}>
            <Segmented options={DEADLINE.map((n) => ({ id: n, label: `${n} ngày trước` }))} value={deadline} onChange={setDeadline} />
            {err('deadline') && <T size={12} color={c.danger}>{err('deadline')}</T>}
          </Group>
          <Group title={`Lệ phí / ${noun}`}>
            <ChipRow>
              {FEES.map((f) => (
                <Chip key={f} label={f ? vnd(f) : 'Miễn phí'} on={f === fee} onPress={() => setFee(f)} />
              ))}
            </ChipRow>
          </Group>
          <Field label="Giải thưởng" value={prize} onChangeText={setPrize} placeholder="VD: Cúp + 10.000.000₫ cho nhà vô địch" />
        </>
      )}

      {step === 1 && (
        <>
          <Group title={`Quy mô · số ${noun}`}>
            <ChipRow>
              {SIZES.map((n) => (
                <Chip key={n} label={String(n)} on={n === size} onPress={() => changeSize(n)} />
              ))}
            </ChipRow>
          </Group>

          <Group title="Chọn thể thức giải">
            {FORMATS.map((f) => {
              const on = f.id === format;
              const s = formatStats(f.id, size, opts);
              return (
                <Pressable
                  key={f.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={f.label}
                  onPress={() => setFormat(f.id)}
                  style={[st.format, { borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandTint : c.surfaceRaised }]}
                >
                  <View style={[st.diagram, { backgroundColor: on ? c.surfaceRaised : c.surfaceSunken }]}>
                    <FormatDiagram format={f.id} active={on} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <View style={st.row}>
                      <T w={700} style={{ flex: 1 }}>{f.label}</T>
                      <View style={[st.radio, { borderColor: on ? c.brand : c.lineStrong }]}>{on && <View style={[st.dot, { backgroundColor: c.brand }]} />}</View>
                    </View>
                    <T size={12} color={c.inkMuted}>{f.hint}</T>
                    <T size={12} w={600} color={on ? c.brandInk : c.inkMuted}>≈ {s.matches} trận · mỗi {noun} ≥ {s.minGames} trận · {f.goodFor}</T>
                  </View>
                </Pressable>
              );
            })}
            {err('format') && <T size={12} color={c.danger}>{err('format')}</T>}
          </Group>

          <Card style={{ gap: 12 }}>
            <T size={13} w={700}>Tuỳ chọn · {FORMATS.find((f) => f.id === format)?.label}</T>
            {format === 'roundrobin' && (
              <Option label="Số lượt">
                <Segmented options={[{ id: 1, label: '1 lượt' }, { id: 2, label: 'Lượt đi – về' }]} value={opts.legs} onChange={(v) => setOpt({ legs: v as 1 | 2 })} />
              </Option>
            )}
            {format === 'groups' && (
              <>
                <Option label="Số bảng">
                  <ChipRow>
                    {GROUPS.filter((g) => size / g >= 3).map((g) => (
                      <Chip key={g} label={`${g} bảng · ~${Math.round(size / g)} ${noun}`} on={g === opts.groups} onPress={() => setOpt({ groups: g })} />
                    ))}
                  </ChipRow>
                </Option>
                <Option label="Đi tiếp mỗi bảng">
                  <Segmented options={[{ id: 1, label: 'Nhất bảng' }, { id: 2, label: 'Nhất & nhì bảng' }]} value={opts.advance} onChange={(v) => setOpt({ advance: v as 1 | 2 })} />
                </Option>
              </>
            )}
            {format === 'swiss' && (
              <Option label="Số vòng">
                <ChipRow>
                  {[3, 4, 5, 6, 7].filter((r) => r < size).map((r) => (
                    <Chip key={r} label={`${r} vòng${r === defaultSwissRounds(size) ? ' · gợi ý' : ''}`} on={r === opts.swissRounds} onPress={() => setOpt({ swissRounds: r })} />
                  ))}
                </ChipRow>
              </Option>
            )}
            {(format === 'knockout' || format === 'groups') && (
              <Option label="Trận tranh hạng 3">
                <Segmented options={[{ id: 'yes', label: 'Có' }, { id: 'no', label: 'Không' }]} value={opts.thirdPlace ? 'yes' : 'no'} onChange={(v) => setOpt({ thirdPlace: v === 'yes' })} />
              </Option>
            )}
            {format === 'double' && <T size={12} color={c.inkMuted}>Đội thua ở nhánh thắng xuống nhánh thua; chung kết giữa đội thắng hai nhánh.</T>}
            <Option label="Hạt giống">
              <ChipRow>
                {SEEDS.filter((x) => x <= size / 2).map((x) => (
                  <Chip key={x} label={x ? `${x} hạt giống` : 'Không xếp'} on={x === seeds} onPress={() => setSeeds(x)} />
                ))}
              </ChipRow>
            </Option>
          </Card>

          <Group title={`Thể thức trận đấu · ${SPORT_ICON[sport].label}`}>
            <ChipRow>
              {MATCH_RULES[sport].map((r, i) => (
                <Chip key={r.label} label={`${r.label} · ~${r.minutes}′`} on={r.label === rule.label} onPress={() => setRuleIdx(i)} />
              ))}
            </ChipRow>
          </Group>

          <Card style={st.stats}>
            <Stat label="Số trận" value={`≈ ${stats.matches}`} />
            <Stat label="Số vòng" value={String(stats.rounds)} />
            <Stat label="Giờ sân cần" value={`${Math.ceil((stats.matches * rule.minutes) / 60)}h`} />
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <Group title={`Sân ${SPORT_ICON[sport].label.toLowerCase()} · ${chosen.length}/${courts.length} sân`}>
            {courts.map((ct) => {
              const on = picked.includes(ct.id);
              return (
                <Pressable
                  key={ct.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggleCourt(ct.id)}
                  style={[st.option, { borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandTint : c.surfaceRaised }]}
                >
                  <View style={[st.check, { borderColor: on ? c.brand : c.lineStrong, backgroundColor: on ? c.brand : 'transparent' }]}>
                    {on && <Icon name="check" size={14} color={c.onBrand} />}
                  </View>
                  <SportBadge sport={ct.sport} size={36} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w={700}>{ct.name}</T>
                    <T size={12} color={c.inkMuted}>{ct.kind}</T>
                  </View>
                </Pressable>
              );
            })}
            {err('courts') && <T size={12} color={c.danger}>{err('courts')}</T>}
          </Group>
          <Group title="Bắt đầu mỗi ngày">
            <ChipRow>
              {FROM.map((h) => (
                <Chip key={h} label={hh(h)} on={h === from} onPress={() => setFrom(h)} />
              ))}
            </ChipRow>
          </Group>
          <Group title="Kết thúc mỗi ngày">
            <ChipRow>
              {TO.map((h) => (
                <Chip key={h} label={hh(h)} on={h === to} onPress={() => setTo(h)} />
              ))}
            </ChipRow>
            {err('hours') && <T size={12} color={c.danger}>{err('hours')}</T>}
          </Group>
          <Banner
            tone={capacity >= stats.matches ? 'success' : 'warning'}
            text={
              capacity >= stats.matches
                ? `Đủ sân: 2 ngày × ${chosen.length} sân × ${to - from} giờ (trận ~${rule.minutes}′) chứa được khoảng ${Math.floor(capacity)} trận (cần ${stats.matches}).`
                : `Có thể thiếu sân: chỉ chứa khoảng ${Math.floor(capacity)} trận nhưng cần ${stats.matches}. Thêm sân, kéo dài giờ, rút gọn luật trận hoặc đổi thể thức.`
            }
          />
        </>
      )}

      {step === 3 && (
        <>
          <Card style={{ gap: 10 }}>
            <View style={st.row}>
              <SportBadge sport={sport} size={48} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Num size={22}>{name.trim()}</Num>
                <T size={13} color={c.inkMuted}>{SPORT_ICON[sport].label} · {entry}</T>
              </View>
            </View>
            <Row label="Ngày thi đấu" value={`${day(startD)} – ${day(endD)}/${endD.getFullYear()}`} />
            <Row label="Hạn đăng ký" value={`${day(deadlineD)}/${deadlineD.getFullYear()}`} />
            <Row label="Thể thức" value={formatSummary(draft)} />
            <Row label="Thể thức trận" value={`${rule.label} · ~${rule.minutes} phút`} />
            <Row label="Quy mô" value={`${size} ${noun} · ${seeds ? `${seeds} hạt giống` : 'không xếp hạt giống'}`} />
            <Row label="Sân" value={chosen.map((x) => x.name).join(', ')} />
            <Row label="Giờ thi đấu" value={`${hh(from)} – ${hh(to)} · ≈ ${stats.matches} trận`} />
            <Row label="Lệ phí" value={fee ? `${vnd(fee)} / ${noun}` : 'Miễn phí'} />
            <Row label="Giải thưởng" value={prize.trim() || 'Chưa công bố'} />
          </Card>
          <T size={12} color={c.inkMuted}>“Tạo & mở đăng ký” cho khách đăng ký ngay; “Lưu nháp” để chỉnh tiếp trước khi công bố.</T>
        </>
      )}
    </Screen>
  );
}

/** Sơ đồ thu nhỏ minh hoạ cách đấu của từng thể thức */
function FormatDiagram({ format, active }: { format: Format; active: boolean }) {
  const c = useColors();
  const ink = active ? c.brand : c.lineStrong;
  const soft = active ? c.brandTint : c.line;
  const bar = (w: number, color = ink) => <View style={{ width: w, height: 5, borderRadius: 3, backgroundColor: color }} />;
  const col = (n: number, w = 12, color = ink) => (
    <View style={{ justifyContent: 'space-around', height: '100%' }}>
      {Array.from({ length: n }, (_, i) => <View key={i}>{bar(w, color)}</View>)}
    </View>
  );

  switch (format) {
    case 'knockout':
      return (
        <View style={st.diagRow}>
          {col(4)}
          {col(2)}
          {col(1, 10, c.volt)}
        </View>
      );
    case 'double':
      return (
        <View style={{ flex: 1, justifyContent: 'space-around' }}>
          <View style={[st.diagRow, { height: 18 }]}>{col(2)}{col(1)}</View>
          <View style={[st.diagRow, { height: 18 }]}>{col(2, 12, c.clay)}{col(1, 12, c.clay)}{col(1, 10, c.volt)}</View>
        </View>
      );
    case 'roundrobin':
      return (
        <View style={{ gap: 2 }}>
          {[0, 1, 2, 3].map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 2 }}>
              {[0, 1, 2, 3].map((k) => (
                <View key={k} style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: r === k ? c.surfaceSunken : r < k ? ink : soft }} />
              ))}
            </View>
          ))}
        </View>
      );
    case 'groups':
      return (
        <View style={st.diagRow}>
          <View style={{ gap: 4 }}>
            {[0, 1].map((g) => (
              <View key={g} style={{ flexDirection: 'row', gap: 2, padding: 2, borderRadius: 3, borderWidth: 1, borderColor: ink }}>
                {[0, 1, 2].map((k) => <View key={k} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ink }} />)}
              </View>
            ))}
          </View>
          {col(2)}
          {col(1, 10, c.volt)}
        </View>
      );
    case 'swiss':
      return (
        <View style={st.diagRow}>
          {[0, 1, 2].map((r) => (
            <View key={r} style={{ justifyContent: 'space-around', height: '100%' }}>
              {[0, 1, 2].map((k) => <View key={k}>{bar(10, r === 2 && k === 0 ? c.volt : k < 2 ? ink : soft)}</View>)}
            </View>
          ))}
        </View>
      );
  }
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <T size={13} w={700}>{title}</T>
      {children}
    </View>
  );
}

function Option({ label, children }: { label: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <T size={12} color={c.inkMuted}>{label}</T>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Num size={22}>{value}</Num>
      <T size={12} color={c.inkMuted}>{label}</T>
    </View>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1.5 },
  format: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1.5 },
  diagram: { width: 64, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', padding: 6 },
  diagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: '100%' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 12 },
});
