import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { SportBadge, sportLabel } from '../../components/SportIcon';
import { ENTRY_LABEL, TODAY_ISO, entrantNoun, fmtDate, fmtRange, formatLabel, type Tournament } from '../../lib/tournament';
import { useTournaments } from '../../store/tournaments';

type Tab = 'all' | 'open' | 'draft';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'open', label: 'Đang nhận đăng ký' },
  { id: 'draft', label: 'Nháp' },
];

export function statusBadge(t: Tournament) {
  if (t.status === 'draft') return <span className="badge b-neutral">Nháp</span>;
  if (t.regDeadline < TODAY_ISO) return <span className="badge b-warning">Hết hạn đăng ký</span>;
  return <span className="badge b-success">Đang nhận đăng ký</span>;
}

export default function Tournaments() {
  const { tournaments } = useTournaments();
  const [tab, setTab] = useState<Tab>('all');
  const count = (s: Tab) => (s === 'all' ? tournaments.length : tournaments.filter((t) => t.status === s).length);
  const shown = tournaments.filter((t) => tab === 'all' || t.status === tab);

  return (
    <>
      <header className="page-head">
        <div className="grow">
          <h1 className="page-title">Giải đấu</h1>
          <p className="page-sub">{tournaments.length} giải · {count('open')} đang nhận đăng ký</p>
        </div>
        <Link className="btn btn-primary" to="/giai-dau/tao-moi">
          <Icon name="plus" /> Tạo giải đấu
        </Link>
      </header>

      <div role="tablist" aria-label="Lọc giải đấu" className="tabs">
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={'tab' + (tab === x.id ? ' on' : '')} onClick={() => setTab(x.id)}>
            {x.label} {count(x.id)}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card tn-empty">
          <Icon name="trophy" size={32} />
          <p>{tab === 'all' ? 'Chưa có giải đấu nào.' : 'Không có giải nào ở mục này.'}</p>
          <Link className="btn btn-primary" to="/giai-dau/tao-moi">
            <Icon name="plus" /> Tạo giải đấu đầu tiên
          </Link>
        </div>
      ) : (
        <div className="tn-grid">
          {shown.map((t) => {
            const noun = entrantNoun(t.entryType);
            const pct = Math.min(100, (t.entrants.length / t.maxEntrants) * 100);
            return (
              <Link key={t.id} to={`/giai-dau/${t.id}`} className="card tn-card">
                <div className="tn-card-head">
                  <SportBadge sport={t.sport} size={44} />
                  {statusBadge(t)}
                </div>
                <b className="tn-card-name">{t.name}</b>
                <span className="muted tn-card-sub">
                  {sportLabel(t.sport)} · {ENTRY_LABEL[t.entryType]} · {formatLabel(t.format)}
                </span>
                <span className="tn-card-date">{fmtRange(t)}</span>
                <div className="tn-card-reg">
                  <div className="line" style={{ fontSize: 13 }}>
                    <span>
                      <b className="num" style={{ fontSize: 18 }}>{t.entrants.length}</b>/{t.maxEntrants} {noun}
                    </span>
                    <span className="muted">Hạn {fmtDate(t.regDeadline)}</span>
                  </div>
                  <div className="meter" role="img" aria-label={`Đã đăng ký ${t.entrants.length} trên ${t.maxEntrants}`}>
                    <div style={{ width: `${pct}%`, background: 'var(--brand)' }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
