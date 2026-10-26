import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TournamentPreview } from '../../components/Bracket';
import { Icon } from '../../components/Icon';
import { SportBadge, sportLabel } from '../../components/SportIcon';
import { MEMBERS, SPORTS, type Sport } from '../../data/mock';
import { hh, vnd } from '../../lib/format';
import {
  ENTRY_LABEL,
  FORMATS,
  TODAY_ISO,
  capacity,
  daysInclusive,
  defaultMatchMinutes,
  entrantNoun,
  entryOptions,
  fmtDate,
  fmtHours,
  fmtRange,
  formatLabel,
  groupSizes,
  knockoutRoundCount,
  matchCount,
  newId,
  type Format,
  type TournamentDraft,
} from '../../lib/tournament';
import { useCourts } from '../../store/courts';
import { useTournaments } from '../../store/tournaments';

const STEPS = ['Thông tin chung', 'Thể thức', 'Sân & lịch', 'Người tham gia', 'Xem lại'];
const SIZES = [4, 6, 8, 12, 16, 24, 32, 48, 64];
const GROUP_OPTIONS = [2, 3, 4, 6, 8];
const MINUTES = [30, 45, 60, 90];

type Errors = Record<string, string>;

const validGroupCounts = (n: number) => GROUP_OPTIONS.filter((g) => n / g >= 3);

function validate(step: number, d: TournamentDraft): Errors {
  const e: Errors = {};
  const noun = entrantNoun(d.entryType);
  if (step === 0) {
    if (!d.name.trim()) e.name = 'Nhập tên giải.';
    if (!d.startDate) e.startDate = 'Chọn ngày bắt đầu.';
    else if (d.startDate <= TODAY_ISO) e.startDate = 'Ngày bắt đầu phải sau hôm nay (18/10/2026).';
    if (!d.endDate) e.endDate = 'Chọn ngày kết thúc.';
    else if (d.startDate && d.endDate < d.startDate) e.endDate = 'Ngày kết thúc không được trước ngày bắt đầu.';
    if (!d.regDeadline) e.regDeadline = 'Chọn hạn đăng ký.';
    else if (d.regDeadline < TODAY_ISO) e.regDeadline = 'Hạn đăng ký đã qua.';
    else if (d.startDate && d.regDeadline >= d.startDate) e.regDeadline = 'Hạn đăng ký phải trước ngày bắt đầu.';
  }
  if (step === 1 && d.format === 'groups') {
    if (d.maxEntrants / d.groupCount < 3) e.groupCount = `Mỗi bảng cần ít nhất 3 ${noun} – giảm số bảng hoặc tăng quy mô.`;
    else if (d.groupCount * d.advancePerGroup < 2) e.groupCount = 'Cần ít nhất 2 suất đi tiếp vào vòng loại trực tiếp.';
  }
  if (step === 2) {
    if (!d.courtIds.length) e.courts = 'Chọn ít nhất 1 sân thi đấu.';
    if (d.dailyTo <= d.dailyFrom) e.hours = 'Giờ kết thúc phải sau giờ bắt đầu.';
  }
  if (step === 3 && d.entrants.length > d.maxEntrants) {
    e.entrants = `Danh sách có ${d.entrants.length} ${noun}, vượt quy mô ${d.maxEntrants}. Bỏ bớt hoặc tăng quy mô ở bước Thể thức.`;
  }
  return e;
}

export default function TournamentCreate() {
  const navigate = useNavigate();
  const { visible } = useCourts();
  const { createTournament } = useTournaments();
  const courtsOf = (s: Sport) => visible.filter((c) => c.sport === s);
  const bookableIds = (s: Sport) => courtsOf(s).filter((c) => !c.locked).map((c) => c.id);

  const [d, setD] = useState<TournamentDraft>(() => ({
    name: '',
    sport: 'cl',
    entryType: 'double',
    format: 'knockout',
    maxEntrants: 16,
    groupCount: 4,
    advancePerGroup: 2,
    thirdPlace: true,
    seeds: 4,
    startDate: '2026-11-21',
    endDate: '2026-11-22',
    regDeadline: '2026-11-14',
    courtIds: bookableIds('cl'),
    dailyFrom: 8,
    dailyTo: 20,
    matchMinutes: defaultMatchMinutes('cl'),
    fee: 200000,
    prize: '',
    description: '',
    entrants: [],
  }));
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [showErr, setShowErr] = useState(false);
  const [newName, setNewName] = useState('');

  const set = (p: Partial<TournamentDraft>) => setD((cur) => ({ ...cur, ...p }));
  const errors = validate(step, d);
  const err = (k: string) => (showErr ? errors[k] : undefined);

  const noun = entrantNoun(d.entryType);
  const matches = matchCount(d);
  const koRounds = knockoutRoundCount(d);
  const cap = capacity(d);
  const days = daysInclusive(d.startDate, d.endDate);
  const sportCourts = courtsOf(d.sport);
  const chosen = sportCourts.filter((c) => d.courtIds.includes(c.id));
  const minGames =
    d.format === 'roundrobin' ? d.maxEntrants - 1 : d.format === 'groups' ? Math.min(...groupSizes(d.maxEntrants, d.groupCount)) - 1 : 1;

  const go = (i: number) => {
    setStep(i);
    setShowErr(false);
    window.scrollTo({ top: 0 });
  };
  const next = () => {
    if (Object.keys(errors).length) {
      setShowErr(true);
      return;
    }
    setReached((r) => Math.max(r, step + 1));
    go(step + 1);
  };

  const changeSport = (s: Sport) => {
    const opts = entryOptions(s);
    set({
      sport: s,
      entryType: opts.includes(d.entryType) ? d.entryType : opts[opts.length - 1],
      courtIds: bookableIds(s),
      matchMinutes: defaultMatchMinutes(s),
    });
  };

  const changeSize = (n: number) => {
    const groupsOk = validGroupCounts(n);
    set({
      maxEntrants: n,
      groupCount: groupsOk.includes(d.groupCount) ? d.groupCount : (groupsOk[groupsOk.length - 1] ?? 2),
      seeds: Math.min(d.seeds, n / 2 >= 8 ? 8 : n / 2 >= 4 ? 4 : 2),
    });
  };

  const changeFormat = (f: Format) => {
    const groupsOk = validGroupCounts(d.maxEntrants);
    set({ format: f, groupCount: f === 'groups' && !groupsOk.includes(d.groupCount) ? (groupsOk[groupsOk.length - 1] ?? 2) : d.groupCount });
  };

  const addEntrant = (name: string) => {
    const v = name.trim();
    if (!v || d.entrants.length >= d.maxEntrants || d.entrants.some((e) => e.name.toLowerCase() === v.toLowerCase())) return;
    set({ entrants: [...d.entrants, { id: newId('e-'), name: v }] });
  };
  const moveEntrant = (i: number, dir: -1 | 1) => {
    const list = [...d.entrants];
    [list[i], list[i + dir]] = [list[i + dir], list[i]];
    set({ entrants: list });
  };

  const create = (status: 'draft' | 'open') => {
    for (let i = 0; i < 4; i++) {
      if (Object.keys(validate(i, d)).length) {
        go(i);
        setShowErr(true);
        return;
      }
    }
    const t = createTournament({ ...d, name: d.name.trim(), prize: d.prize.trim(), description: d.description.trim() }, status);
    navigate(`/giai-dau/${t.id}`, { state: { created: status } });
  };

  const fieldErr = (k: string) => {
    const m = err(k);
    return m ? <span className="field-err" role="alert">{m}</span> : null;
  };

  return (
    <>
      <header className="page-head">
        <div className="grow">
          <Link to="/giai-dau" className="back-link">
            <Icon name="chevronLeft" size={16} /> Giải đấu
          </Link>
          <h1 className="page-title">Tạo giải đấu</h1>
        </div>
      </header>

      <nav aria-label="Các bước tạo giải">
        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                className={'step' + (i === step ? ' on' : '') + (i < step || i <= reached ? ' done' : '')}
                aria-current={i === step ? 'step' : undefined}
                disabled={i > reached}
                onClick={() => go(i)}
              >
                <span className="step-no" aria-hidden="true">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
                <span>{s}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="split">
        <section className="card wide tc-body" aria-labelledby="tc-step">
          <div>
            <span className="lbl">Bước {step + 1}/{STEPS.length}</span>
            <h2 id="tc-step" className="card-title">{STEPS[step]}</h2>
          </div>

          {step === 0 && (
            <div className="tc-grid">
              <label className="field tc-full">
                Tên giải
                <input className="inp" value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="VD: Giải cầu lông Arena mùa xuân 2027" aria-invalid={!!err('name')} />
                {fieldErr('name')}
              </label>

              <fieldset className="tc-full sport-opts tc-sports">
                <legend className="field" style={{ marginBottom: 6 }}>Môn thi đấu</legend>
                {SPORTS.map((s) => {
                  const n = courtsOf(s.id).length;
                  return (
                    <label key={s.id} className="sport-opt">
                      <input className="sr-only" type="radio" name="tc-sport" aria-label={`${s.label}, ${n} sân`} checked={d.sport === s.id} onChange={() => changeSport(s.id)} />
                      <SportBadge sport={s.id} size={28} />
                      {s.short}
                      <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}>{n ? `${n} sân` : 'Chưa có sân'}</span>
                    </label>
                  );
                })}
              </fieldset>

              <div className="field tc-full">
                <span id="tc-entry">Nội dung thi đấu</span>
                <div className="seg" role="radiogroup" aria-labelledby="tc-entry">
                  {entryOptions(d.sport).map((o) => (
                    <button key={o} type="button" role="radio" aria-checked={d.entryType === o} className={d.entryType === o ? 'on' : ''} onClick={() => set({ entryType: o })}>
                      {ENTRY_LABEL[o]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                Ngày bắt đầu
                <input
                  className="inp"
                  type="date"
                  min="2026-10-19"
                  value={d.startDate}
                  onChange={(e) => set({ startDate: e.target.value, endDate: d.endDate && d.endDate < e.target.value ? e.target.value : d.endDate })}
                  aria-invalid={!!err('startDate')}
                />
                {fieldErr('startDate')}
              </label>
              <label className="field">
                Ngày kết thúc
                <input className="inp" type="date" min={d.startDate} value={d.endDate} onChange={(e) => set({ endDate: e.target.value })} aria-invalid={!!err('endDate')} />
                {fieldErr('endDate')}
              </label>
              <label className="field">
                Hạn đăng ký
                <input className="inp" type="date" min={TODAY_ISO} max={d.startDate} value={d.regDeadline} onChange={(e) => set({ regDeadline: e.target.value })} aria-invalid={!!err('regDeadline')} />
                {fieldErr('regDeadline')}
              </label>
              <label className="field">
                Lệ phí mỗi {noun} (₫)
                <input
                  className="inp"
                  inputMode="numeric"
                  value={d.fee ? d.fee.toLocaleString('vi-VN') : ''}
                  onChange={(e) => set({ fee: Number(e.target.value.replace(/\D/g, '').slice(0, 9)) || 0 })}
                  placeholder="0 = miễn phí"
                />
              </label>
              <label className="field tc-full">
                Giải thưởng
                <input className="inp" value={d.prize} onChange={(e) => set({ prize: e.target.value })} placeholder="VD: Cúp + 10.000.000₫ cho nhà vô địch" />
              </label>
              <label className="field tc-full">
                Mô tả / điều lệ ngắn
                <textarea className="inp tc-textarea" rows={3} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Đối tượng tham gia, luật thi đấu, trang phục…" />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="tc-stack">
              <fieldset className="fmt-opts">
                <legend className="field" style={{ marginBottom: 8 }}>Thể thức thi đấu</legend>
                {FORMATS.map((f) => (
                  <label key={f.id} className="fmt-opt">
                    <input className="sr-only" type="radio" name="tc-format" aria-label={f.label} checked={d.format === f.id} onChange={() => changeFormat(f.id)} />
                    <FormatGlyph f={f.id} />
                    <b>{f.label}</b>
                    <span className="muted">{f.desc}</span>
                  </label>
                ))}
              </fieldset>

              <div className="tc-grid">
                <label className="field">
                  Số {noun} tối đa
                  <select className="inp" value={d.maxEntrants} onChange={(e) => changeSize(Number(e.target.value))}>
                    {SIZES.map((n) => (
                      <option key={n} value={n}>{n} {noun}</option>
                    ))}
                  </select>
                </label>

                {d.format === 'groups' && (
                  <>
                    <label className="field">
                      Số bảng
                      <select className="inp" value={d.groupCount} onChange={(e) => set({ groupCount: Number(e.target.value) })} aria-invalid={!!err('groupCount')}>
                        {GROUP_OPTIONS.map((g) => (
                          <option key={g} value={g} disabled={d.maxEntrants / g < 3}>
                            {g} bảng ({groupSizes(d.maxEntrants, g).join('–')} {noun}/bảng)
                          </option>
                        ))}
                      </select>
                      {fieldErr('groupCount')}
                    </label>
                    <div className="field">
                      <span id="tc-adv">Đi tiếp mỗi bảng</span>
                      <div className="seg" role="radiogroup" aria-labelledby="tc-adv">
                        {[1, 2].map((n) => (
                          <button key={n} type="button" role="radio" aria-checked={d.advancePerGroup === n} className={d.advancePerGroup === n ? 'on' : ''} onClick={() => set({ advancePerGroup: n })}>
                            {n === 1 ? 'Nhất bảng' : 'Nhất & nhì'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {d.format !== 'roundrobin' && (
                  <label className="field">
                    Số hạt giống
                    <select className="inp" value={d.seeds} onChange={(e) => set({ seeds: Number(e.target.value) })}>
                      {[0, 2, 4, 8].filter((n) => n <= d.maxEntrants / 2).map((n) => (
                        <option key={n} value={n}>{n === 0 ? 'Không xếp hạt giống' : `${n} hạt giống`}</option>
                      ))}
                    </select>
                    <span className="field-hint">Hạt giống được xếp tách nhau, chỉ gặp nhau ở vòng cuối.</span>
                  </label>
                )}
              </div>

              {d.format !== 'roundrobin' && (
                <label className="check">
                  <input type="checkbox" checked={d.thirdPlace} onChange={(e) => set({ thirdPlace: e.target.checked })} /> Có trận tranh hạng ba
                </label>
              )}

              <div className="tc-facts">
                <Fact value={matches} label="trận đấu" />
                {koRounds > 0 && <Fact value={koRounds} label="vòng loại trực tiếp" />}
                <Fact value={minGames} label={`trận tối thiểu mỗi ${noun}`} />
                {d.format === 'groups' && <Fact value={d.groupCount * d.advancePerGroup} label={`${noun} đi tiếp`} />}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="tc-stack">
              <fieldset className="tc-courts">
                <legend className="field" style={{ marginBottom: 8 }}>Sân thi đấu · {sportLabel(d.sport)}</legend>
                {sportCourts.length === 0 && (
                  <p className="muted" style={{ fontSize: 14 }}>
                    Chưa có sân {sportLabel(d.sport).toLowerCase()} nào. Thêm sân trong <Link to="/lich-dat-san">Lịch đặt sân › Tùy chỉnh sân</Link> rồi quay lại.
                  </p>
                )}
                {sportCourts.map((c) => (
                  <label key={c.id} className={'court-opt-card' + (c.locked ? ' locked' : '')}>
                    <input
                      type="checkbox"
                      checked={d.courtIds.includes(c.id)}
                      disabled={c.locked}
                      onChange={(e) => set({ courtIds: e.target.checked ? [...d.courtIds, c.id] : d.courtIds.filter((x) => x !== c.id) })}
                    />
                    <SportBadge sport={c.sport} size={32} />
                    <span className="court-meta">
                      <span className="court-name">{c.name}</span>
                      <span className="court-sub">{c.locked ? 'Đang tạm ngừng' : `${c.kind} · ${vnd(c.price)}/giờ`}</span>
                    </span>
                  </label>
                ))}
                {fieldErr('courts')}
              </fieldset>

              <div className="tc-grid">
                <label className="field">
                  Bắt đầu thi đấu mỗi ngày
                  <select className="inp" value={d.dailyFrom} onChange={(e) => set({ dailyFrom: Number(e.target.value) })}>
                    {Array.from({ length: 18 }, (_, i) => 5 + i).map((h) => (
                      <option key={h} value={h}>{hh(h)}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Kết thúc mỗi ngày
                  <select className="inp" value={d.dailyTo} onChange={(e) => set({ dailyTo: Number(e.target.value) })} aria-invalid={!!err('hours')}>
                    {Array.from({ length: 18 }, (_, i) => 7 + i).map((h) => (
                      <option key={h} value={h}>{h === 24 ? '24:00' : hh(h)}</option>
                    ))}
                  </select>
                  {fieldErr('hours')}
                </label>
                <div className="field">
                  <span id="tc-min">Thời lượng mỗi trận</span>
                  <div className="seg" role="radiogroup" aria-labelledby="tc-min">
                    {MINUTES.map((m) => (
                      <button key={m} type="button" role="radio" aria-checked={d.matchMinutes === m} className={d.matchMinutes === m ? 'on' : ''} onClick={() => set({ matchMinutes: m })}>
                        {m}′
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <CapacityNote cap={cap} matches={matches} courts={chosen.length} />
            </div>
          )}

          {step === 3 && (
            <div className="tc-stack">
              <p className="muted" style={{ fontSize: 14 }}>
                Có thể để trống – {noun} đăng ký thêm sau khi mở giải.
                {d.format !== 'roundrobin' && d.seeds > 0 && ` ${d.seeds} ${noun} đầu danh sách là hạt giống; dùng mũi tên để sắp lại.`}
              </p>
              <form
                className="tc-add"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  addEntrant(newName);
                  setNewName('');
                }}
              >
                <label className="field" style={{ flex: '1 1 220px' }}>
                  Tên {noun}
                  <input
                    className="inp"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={d.entryType === 'double' ? 'VD: Minh Anh / Thu Hà' : d.entryType === 'team' ? 'VD: FC Văn Phòng' : 'VD: Nguyễn Minh Anh'}
                    disabled={d.entrants.length >= d.maxEntrants}
                  />
                </label>
                <button className="btn btn-secondary" type="submit" disabled={!newName.trim() || d.entrants.length >= d.maxEntrants}>
                  <Icon name="plus" /> Thêm
                </button>
                {d.entryType === 'single' && (
                  <label className="field" style={{ flex: '1 1 200px' }}>
                    Hoặc chọn hội viên
                    <select className="inp" value="" onChange={(e) => addEntrant(e.target.value)} disabled={d.entrants.length >= d.maxEntrants}>
                      <option value="">— Chọn hội viên —</option>
                      {MEMBERS.filter((m) => !d.entrants.some((x) => x.name === m.name)).map((m) => (
                        <option key={m.code} value={m.name}>{m.name} · {m.code}</option>
                      ))}
                    </select>
                  </label>
                )}
              </form>

              <div className="line">
                <span className="lbl">Danh sách ({d.entrants.length}/{d.maxEntrants})</span>
                {d.entrants.length > 0 && (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => set({ entrants: [] })}>Xoá hết</button>
                )}
              </div>
              {fieldErr('entrants')}
              {d.entrants.length === 0 ? (
                <p className="muted tc-empty">Chưa có {noun} nào.</p>
              ) : (
                <ol className="tc-entrants">
                  {d.entrants.map((e, i) => (
                    <li key={e.id}>
                      <span className="rr-idx">{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>{e.name}</span>
                      {d.format !== 'roundrobin' && i < d.seeds && <span className="badge plain b-volt">Hạt giống {i + 1}</span>}
                      <button className="icon-btn" type="button" aria-label={`Đưa ${e.name} lên`} disabled={i === 0} onClick={() => moveEntrant(i, -1)}>
                        <Icon name="arrowUp" size={16} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Đưa ${e.name} xuống`} disabled={i === d.entrants.length - 1} onClick={() => moveEntrant(i, 1)}>
                        <Icon name="arrowDown" size={16} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Xoá ${e.name}`} onClick={() => set({ entrants: d.entrants.filter((x) => x.id !== e.id) })}>
                        <Icon name="trash" size={16} />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="tc-stack">
              <div className="tc-review">
                <ReviewBlock title="Thông tin chung" onEdit={() => go(0)}>
                  <Row k="Tên giải" v={d.name.trim()} />
                  <Row k="Môn · nội dung" v={`${sportLabel(d.sport)} · ${ENTRY_LABEL[d.entryType]}`} />
                  <Row k="Thời gian" v={`${fmtRange(d)} (${days} ngày)`} />
                  <Row k="Hạn đăng ký" v={fmtDate(d.regDeadline)} />
                  <Row k="Lệ phí" v={d.fee ? `${vnd(d.fee)} / ${noun}` : 'Miễn phí'} />
                  <Row k="Giải thưởng" v={d.prize.trim() || '—'} />
                </ReviewBlock>
                <ReviewBlock title="Thể thức" onEdit={() => go(1)}>
                  <Row k="Thể thức" v={formatLabel(d.format)} />
                  <Row k="Quy mô" v={`${d.maxEntrants} ${noun}${d.format === 'groups' ? ` · ${d.groupCount} bảng, ${d.advancePerGroup === 1 ? 'nhất bảng' : 'nhất & nhì'} đi tiếp` : ''}`} />
                  {d.format !== 'roundrobin' && <Row k="Hạt giống" v={d.seeds ? `${d.seeds}` : 'Không'} />}
                  <Row k="Số trận" v={`${matches} trận${d.format !== 'roundrobin' && d.thirdPlace ? ' (có tranh hạng ba)' : ''}`} />
                </ReviewBlock>
                <ReviewBlock title="Sân & lịch" onEdit={() => go(2)}>
                  <Row k="Sân" v={chosen.map((c) => c.name).join(', ')} />
                  <Row k="Khung giờ" v={`${fmtHours(d.dailyFrom, d.dailyTo)} · ${d.matchMinutes} phút/trận`} />
                  <Row k="Sức chứa" v={`${cap.total} lượt trận / cần ${matches}`} warn={cap.total < matches} />
                </ReviewBlock>
                <ReviewBlock title="Người tham gia" onEdit={() => go(3)}>
                  <Row k="Đã có" v={`${d.entrants.length}/${d.maxEntrants} ${noun}`} />
                  <Row k="Còn trống" v={`${d.maxEntrants - d.entrants.length} suất`} />
                </ReviewBlock>
              </div>
              <div>
                <h3 className="ce-h3" style={{ marginBottom: 4 }}>Sơ đồ thi đấu (xem trước)</h3>
                <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Suất chưa có người hiện là “Suất k”; sơ đồ cập nhật khi có thêm {noun} đăng ký.</p>
                <TournamentPreview t={d} />
              </div>
            </div>
          )}

          <div className="tc-nav">
            {step > 0 && (
              <button className="btn btn-secondary" type="button" onClick={() => go(step - 1)}>
                <Icon name="chevronLeft" /> Quay lại
              </button>
            )}
            <span style={{ flex: 1 }} />
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" type="button" onClick={next}>
                Tiếp tục <Icon name="chevronRight" />
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" type="button" onClick={() => create('draft')}>Lưu nháp</button>
                <button className="btn btn-primary" type="button" onClick={() => create('open')}>Tạo giải &amp; mở đăng ký</button>
              </>
            )}
          </div>
        </section>

        <aside className="card side tc-summary" aria-label="Tóm tắt giải đấu">
          <div className="tc-sum-head">
            <SportBadge sport={d.sport} size={44} />
            <div style={{ minWidth: 0 }}>
              <span className="lbl">{sportLabel(d.sport)} · {ENTRY_LABEL[d.entryType]}</span>
              <b className="tc-sum-name">{d.name.trim() || 'Giải đấu mới'}</b>
            </div>
          </div>
          <dl className="tc-dl">
            <dt>Thời gian</dt>
            <dd>{fmtRange(d)}{days > 0 ? ` · ${days} ngày` : ''}</dd>
            <dt>Hạn đăng ký</dt>
            <dd>{fmtDate(d.regDeadline)}</dd>
            <dt>Thể thức</dt>
            <dd>{formatLabel(d.format)}{d.format === 'groups' ? ` · ${d.groupCount} bảng` : ''}</dd>
            <dt>Quy mô</dt>
            <dd>{d.maxEntrants} {noun} · {matches} trận</dd>
            <dt>Sân</dt>
            <dd>{chosen.length ? `${chosen.length} sân · ${fmtHours(d.dailyFrom, d.dailyTo)}` : '—'}</dd>
            <dt>Đã đăng ký</dt>
            <dd>{d.entrants.length}/{d.maxEntrants}</dd>
            <dt>Lệ phí</dt>
            <dd>{d.fee ? `${vnd(d.fee)} / ${noun}` : 'Miễn phí'}</dd>
            <dt>Thu tối đa</dt>
            <dd className="num" style={{ fontSize: 20, fontWeight: 600 }}>{vnd(d.fee * d.maxEntrants)}</dd>
          </dl>
        </aside>
      </div>
    </>
  );
}

function Fact({ value, label }: { value: number; label: string }) {
  return (
    <div className="tc-fact">
      <span className="num">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function CapacityNote({ cap, matches, courts }: { cap: ReturnType<typeof capacity>; matches: number; courts: number }) {
  if (!courts) return null;
  const enough = cap.total >= matches;
  return (
    <div className={'toast' + (enough ? '' : ' warn')} role="status">
      <Icon name={enough ? 'check' : 'timer'} />
      <span>
        {courts} sân × {cap.perCourt} trận/ngày × {cap.days} ngày = <b>{cap.total} lượt trận</b>; giải cần <b>{matches} trận</b>.{' '}
        {enough
          ? `Đủ sân, còn dư ${cap.total - matches} lượt.`
          : `Thiếu ${matches - cap.total} lượt – thêm sân, kéo dài khung giờ, rút ngắn thời lượng trận hoặc thêm ngày thi đấu.`}
      </span>
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="tc-review-block" aria-label={title}>
      <div className="line">
        <b>{title}</b>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onEdit} aria-label={`Sửa ${title}`}>Sửa</button>
      </div>
      <dl className="tc-dl">{children}</dl>
    </section>
  );
}

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <>
      <dt>{k}</dt>
      <dd style={warn ? { color: 'var(--warning)', fontWeight: 600 } : undefined}>{v}</dd>
    </>
  );
}

/** Hình minh hoạ nhỏ cho từng thể thức */
function FormatGlyph({ f }: { f: Format }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className="fmt-glyph" viewBox="0 0 64 40" aria-hidden="true">
      {f === 'knockout' && <path {...p} d="M4 6h14v10H4M4 24h14v10H4M18 11h8v18h-8M26 20h12M38 20h8M50 14h10v12H50z" />}
      {f === 'roundrobin' && (
        <>
          <circle cx="32" cy="20" r="15" {...p} />
          <path {...p} d="M32 5 45 27.5M32 5 19 27.5M19 27.5h26" />
          <circle cx="32" cy="5" r="3" fill="currentColor" />
          <circle cx="45" cy="27.5" r="3" fill="currentColor" />
          <circle cx="19" cy="27.5" r="3" fill="currentColor" />
        </>
      )}
      {f === 'groups' && <path {...p} d="M3 4h18v14H3zM3 22h18v14H3zM21 11h8v18h-8M29 20h10M42 13h18v14H42z" />}
    </svg>
  );
}
