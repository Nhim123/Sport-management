import {
  entrantNoun,
  entrantSlots,
  groupsOf,
  knockoutRounds,
  qualifierSlots,
  type BracketRound,
  type Slot,
  type TournamentDraft,
} from '../lib/tournament';

/** Xem trước cách thi đấu theo thể thức: nhánh loại trực tiếp, bảng đấu hoặc bảng vòng tròn */
export function TournamentPreview({ t }: { t: TournamentDraft }) {
  const slots = entrantSlots(t);
  const noun = entrantNoun(t.entryType);
  if (t.maxEntrants < 2) return <p className="muted">Cần ít nhất 2 {noun} để xếp lịch.</p>;

  if (t.format === 'knockout') {
    return (
      <>
        <BracketTree rounds={knockoutRounds(slots)} />
        {t.thirdPlace && t.maxEntrants >= 4 && <p className="muted bk-note">Thêm 1 trận tranh hạng ba giữa hai {noun} thua bán kết.</p>}
      </>
    );
  }

  if (t.format === 'groups') {
    const groups = groupsOf(slots, t.groupCount);
    const groupMatches = groups.reduce((s, g) => s + (g.slots.length * (g.slots.length - 1)) / 2, 0);
    return (
      <>
        <div className="bk-groups">
          {groups.map((g) => (
            <div key={g.name} className="bk-group">
              <div className="bk-group-head">
                <b>{g.name}</b>
                <span className="muted">
                  {g.slots.length} {noun} · {(g.slots.length * (g.slots.length - 1)) / 2} trận
                </span>
              </div>
              <ol>
                {g.slots.map((s, i) => (
                  <li key={i} className={s.pending ? 'pending' : ''}>
                    <SlotLabel s={s} />
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <h4 className="lbl" style={{ margin: '16px 0 8px' }}>Vòng loại trực tiếp · {t.groupCount * t.advancePerGroup} {noun} đi tiếp</h4>
        <BracketTree rounds={knockoutRounds(qualifierSlots(t), groupMatches + 1)} />
        {t.thirdPlace && t.groupCount * t.advancePerGroup >= 4 && <p className="muted bk-note">Thêm 1 trận tranh hạng ba.</p>}
      </>
    );
  }

  // Vòng tròn
  const n = slots.length;
  const perEntrant = n - 1;
  if (n > 10) {
    return (
      <p className="muted">
        {n} {noun}, mỗi {noun} thi đấu {perEntrant} trận, tổng {(n * perEntrant) / 2} trận. Bảng đối đầu hiển thị khi giải có tối đa 10 {noun}.
      </p>
    );
  }
  let no = 0;
  const num: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) num[i][j] = num[j][i] = ++no;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="rr-table">
        <caption className="sr-only">Bảng đối đầu vòng tròn – số trong ô là số thứ tự trận</caption>
        <thead>
          <tr>
            <th scope="col">{noun}</th>
            {slots.map((_, j) => (
              <th key={j} scope="col">{j + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((s, i) => (
            <tr key={i}>
              <th scope="row" className={s.pending ? 'pending' : ''}>
                <span className="rr-idx">{i + 1}</span>
                <SlotLabel s={s} />
              </th>
              {slots.map((_, j) => (
                <td key={j} className={i === j ? 'self' : ''}>{i === j ? '' : `T${num[i][j]}`}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlotLabel({ s }: { s: Slot }) {
  return (
    <>
      {s.seed && (
        <span className="bk-seed" title={`Hạt giống ${s.seed}`}>
          {s.seed}
        </span>
      )}
      <span className="bk-name">{s.label}</span>
    </>
  );
}

function BracketTree({ rounds }: { rounds: BracketRound[] }) {
  return (
    <div className="bk" role="group" aria-label="Sơ đồ nhánh đấu loại trực tiếp">
      {rounds.map((r) => (
        <section key={r.name} className="bk-round" aria-label={r.name}>
          <div className="lbl bk-round-name">{r.name}</div>
          <div className="bk-matches">
            {r.matches.map((m, i) => (
              <div key={i} className="bk-match-wrap">
                <div className={'bk-match' + (m.no === undefined ? ' bye' : '')}>
                  <span className="bk-no">{m.no !== undefined ? `Trận ${m.no}` : 'Vào thẳng vòng sau'}</span>
                  {[m.a, m.b].map((s, k) => (
                    <div key={k} className={'bk-slot' + (s.pending ? ' pending' : '') + (s.bye ? ' bye' : '')}>
                      <SlotLabel s={s} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
