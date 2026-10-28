import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge, Banner, Btn, Screen, SportBadge } from '../../../components/kit';
import { Card, Label, Num, T } from '../../../components/ui';
import { useSetTournamentStatus, useTournament } from '../../../hooks/useAdmin';
import { vnd } from '../../../lib/format';
import { useColors } from '../../../theme/tokens';
import type { Tournament } from '../../../types/admin';

const FORMAT = { knockout: 'Loại trực tiếp', roundrobin: 'Vòng tròn', groups: 'Vòng bảng + loại trực tiếp' } as const;

/** Thứ tự hạt giống chuẩn (giống website): 8 → [1,8,4,5,2,7,3,6] */
function seedOrder(size: number) {
  let o = [1];
  while (o.length < size) {
    const m = o.length * 2;
    o = o.flatMap((x) => [x, m + 1 - x]);
  }
  return o;
}

function slots(t: Tournament) {
  return Array.from({ length: t.maxEntrants }, (_, i) => ({ name: t.entrants[i] ?? `Suất ${i + 1}`, seed: t.entrants[i] && i < t.seeds ? i + 1 : undefined, empty: !t.entrants[i] }));
}

export default function AdminTournamentDetail() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: t } = useTournament(id);
  const setStatus = useSetTournamentStatus();
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setLocal] = useState<Tournament['status'] | null>(null);

  if (!t) return <Screen title="Giải đấu" back><T color={c.inkMuted}>Đang tải…</T></Screen>;
  const cur = status ?? t.status;
  const s = slots(t);
  const size = 2 ** Math.ceil(Math.log2(Math.max(2, s.length)));
  const order = seedOrder(size);
  const groups = Array.from({ length: t.groupCount }, (_, g) => s.filter((_, i) => {
    const row = Math.floor(i / t.groupCount);
    return (row % 2 === 0 ? i % t.groupCount : t.groupCount - 1 - (i % t.groupCount)) === g;
  }));

  const Name = ({ x }: { x?: (typeof s)[number] }) => (
    <T size={13} color={!x || x.empty ? c.inkMuted : c.ink} numberOfLines={1} style={{ flex: 1 }}>
      {x?.seed ? `[${x.seed}] ` : ''}{x ? x.name : 'Miễn đấu'}
    </T>
  );

  return (
    <Screen title={t.name} sub={`${t.entry} · ${FORMAT[t.format]}`} back>
      {notice && <Banner text={notice} />}
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <SportBadge sport={t.sport} size={44} />
          <View style={{ flex: 1, gap: 4 }}>
            <Badge label={cur === 'open' ? 'Đang nhận đăng ký' : 'Nháp'} tone={cur === 'open' ? 'success' : 'neutral'} />
            <T size={13} color={c.inkMuted}>{t.dates}</T>
          </View>
        </View>
        {[
          ['Hạn đăng ký', t.regDeadline],
          ['Sân & giờ', t.courts],
          ['Lệ phí', t.fee ? `${vnd(t.fee)} / ${t.entry === 'Đơn' ? 'VĐV' : t.entry === 'Đôi' ? 'cặp' : 'đội'}` : 'Miễn phí'],
          ['Giải thưởng', t.prize],
          ['Đã đăng ký', `${t.entrants.length}/${t.maxEntrants}`],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <T size={14} color={c.inkMuted}>{k}</T>
            <T size={14} w={600} style={{ flex: 1, textAlign: 'right' }}>{v}</T>
          </View>
        ))}
        <Btn
          label={cur === 'open' ? 'Tạm đóng đăng ký' : 'Mở đăng ký'}
          kind={cur === 'open' ? 'secondary' : 'primary'}
          onPress={() => {
            const next = cur === 'open' ? 'draft' : 'open';
            setStatus.mutate({ id: t.id, status: next }, { onSuccess: () => { setLocal(next); setNotice(next === 'open' ? 'Đã mở đăng ký.' : 'Đã tạm đóng đăng ký.'); } });
          }}
        />
      </Card>

      {t.format === 'knockout' && (
        <Card style={{ gap: 8 }}>
          <Label>Vòng 1 · {size / 2} trận</Label>
          {Array.from({ length: size / 2 }, (_, i) => {
            const a = s[order[2 * i] - 1];
            const b = s[order[2 * i + 1] - 1];
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: c.lineSoft }}>
                <Num size={14} w={600} color={c.inkMuted} style={{ width: 28 }}>T{i + 1}</Num>
                <Name x={a} />
                <T size={12} color={c.inkMuted}>vs</T>
                <Name x={b} />
              </View>
            );
          })}
        </Card>
      )}

      {t.format === 'groups' &&
        groups.map((g, gi) => (
          <Card key={gi} style={{ gap: 6 }}>
            <Label>Bảng {'ABCDEFGH'[gi]} · {(g.length * (g.length - 1)) / 2} trận</Label>
            {g.map((x, i) => <Name key={i} x={x} />)}
          </Card>
        ))}

      {t.format === 'roundrobin' && (
        <Card>
          <T>{t.maxEntrants} suất · mỗi suất đấu {t.maxEntrants - 1} trận · tổng {(t.maxEntrants * (t.maxEntrants - 1)) / 2} trận.</T>
        </Card>
      )}
      <T size={12} color={c.inkMuted}>[k] là hạt giống; “Suất k” là suất còn trống chờ đăng ký.</T>
    </Screen>
  );
}
