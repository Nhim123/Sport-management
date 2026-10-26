import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { TournamentPreview } from '../../components/Bracket';
import { Icon } from '../../components/Icon';
import { SportBadge, sportLabel } from '../../components/SportIcon';
import { vnd } from '../../lib/format';
import {
  ENTRY_LABEL,
  capacity,
  daysInclusive,
  entrantNoun,
  fmtDate,
  fmtHours,
  fmtRange,
  formatLabel,
  matchCount,
} from '../../lib/tournament';
import { useCourts } from '../../store/courts';
import { useTournaments } from '../../store/tournaments';
import { statusBadge } from './Tournaments';

export default function TournamentDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { tournaments, updateTournament, removeTournament } = useTournaments();
  const { courts } = useCourts();
  const [confirmDel, setConfirmDel] = useState(false);
  const [notice, setNotice] = useState<string | null>(() => {
    const created = (location.state as { created?: string } | null)?.created;
    return created === 'open' ? 'Đã tạo giải và mở đăng ký.' : created === 'draft' ? 'Đã lưu giải ở dạng nháp.' : null;
  });

  const t = tournaments.find((x) => x.id === id);
  if (!t) {
    return (
      <div className="card tn-empty">
        <p>Không tìm thấy giải đấu này.</p>
        <Link className="btn btn-secondary" to="/giai-dau">Về danh sách giải</Link>
      </div>
    );
  }

  const noun = entrantNoun(t.entryType);
  const matches = matchCount(t);
  const cap = capacity(t);
  const courtNames = t.courtIds.map((cid) => courts.find((c) => c.id === cid)?.name ?? cid);

  return (
    <>
      <header className="page-head" style={{ alignItems: 'flex-start' }}>
        <div className="grow" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <SportBadge sport={t.sport} size={56} />
          <div style={{ minWidth: 0 }}>
            <Link to="/giai-dau" className="back-link">
              <Icon name="chevronLeft" size={16} /> Giải đấu
            </Link>
            <h1 className="page-title">{t.name}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
              {statusBadge(t)}
              <span className="muted" style={{ fontSize: 14 }}>
                {sportLabel(t.sport)} · {ENTRY_LABEL[t.entryType]} · {formatLabel(t.format)}
              </span>
            </div>
          </div>
        </div>
        {t.status === 'draft' ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              updateTournament(t.id, { status: 'open' });
              setNotice('Đã mở đăng ký.');
            }}
          >
            Mở đăng ký
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              updateTournament(t.id, { status: 'draft' });
              setNotice('Đã tạm đóng đăng ký, giải chuyển về nháp.');
            }}
          >
            Tạm đóng đăng ký
          </button>
        )}
      </header>

      {notice && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{notice}</span>
        </div>
      )}

      <div className="split">
        <section className="card wide" style={{ padding: '20px 24px 24px' }}>
          <div className="card-head" style={{ marginBottom: 4 }}>
            <h2 className="card-title">Sơ đồ thi đấu</h2>
            <span className="muted" style={{ fontSize: 13 }}>{matches} trận</span>
          </div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Xem trước theo danh sách hiện tại; suất trống hiện là “Suất k”.</p>
          <TournamentPreview t={t} />
        </section>

        <aside className="card side" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <dl className="tc-dl">
            <dt>Thời gian</dt>
            <dd>{fmtRange(t)} · {daysInclusive(t.startDate, t.endDate)} ngày</dd>
            <dt>Hạn đăng ký</dt>
            <dd>{fmtDate(t.regDeadline)}</dd>
            <dt>Sân</dt>
            <dd>{courtNames.join(', ') || '—'}</dd>
            <dt>Khung giờ</dt>
            <dd>{fmtHours(t.dailyFrom, t.dailyTo)} · {t.matchMinutes} phút/trận</dd>
            <dt>Sức chứa</dt>
            <dd style={cap.total < matches ? { color: 'var(--warning)', fontWeight: 600 } : undefined}>
              {cap.total} lượt trận / cần {matches}
            </dd>
            <dt>Lệ phí</dt>
            <dd>{t.fee ? `${vnd(t.fee)} / ${noun}` : 'Miễn phí'}</dd>
            <dt>Giải thưởng</dt>
            <dd>{t.prize || '—'}</dd>
          </dl>
          {t.description && <p style={{ fontSize: 14 }}>{t.description}</p>}

          <div>
            <div className="line" style={{ marginBottom: 8 }}>
              <span className="lbl">Đã đăng ký</span>
              <span className="num" style={{ fontSize: 18 }}>{t.entrants.length}/{t.maxEntrants}</span>
            </div>
            {t.entrants.length === 0 ? (
              <p className="muted" style={{ fontSize: 14 }}>Chưa có {noun} nào đăng ký.</p>
            ) : (
              <ol className="tc-entrants compact">
                {t.entrants.map((e, i) => (
                  <li key={e.id}>
                    <span className="rr-idx">{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{e.name}</span>
                    {t.format !== 'roundrobin' && i < t.seeds && <span className="badge plain b-volt">HG {i + 1}</span>}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            {confirmDel ? (
              <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <span>Xoá hẳn “{t.name}”? Không hoàn tác được.</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-danger btn-sm"
                    type="button"
                    onClick={() => {
                      removeTournament(t.id);
                      navigate('/giai-dau');
                    }}
                  >
                    Xoá giải
                  </button>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => setConfirmDel(false)}>Giữ lại</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm ce-del" type="button" onClick={() => setConfirmDel(true)}>
                <Icon name="trash" size={16} /> Xoá giải đấu
              </button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
