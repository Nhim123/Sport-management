import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MEMBERS, type Member, type MemberGroup } from '../../data/mock';
import { digits, vnd } from '../../lib/format';

type TabId = 'all' | MemberGroup;
const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang hoạt động' },
  { id: 'expiring', label: 'Sắp hết hạn' },
  { id: 'expired', label: 'Hết hạn' },
  { id: 'paused', label: 'Bảo lưu' },
];
const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function Members() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'all') as TabId;
  const selCode = params.get('m') ?? MEMBERS[0].code;
  const [q, setQ] = useState('');

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => {
    const c: Record<TabId, number> = { all: MEMBERS.length, active: 0, expiring: 0, expired: 0, paused: 0 };
    MEMBERS.forEach((m) => c[m.group]++);
    return c;
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const sd = digits(s);
    return MEMBERS.filter((m) => tab === 'all' || m.group === tab).filter(
      (m) => !s || m.name.toLowerCase().includes(s) || m.code.toLowerCase().includes(s) || (sd.length > 2 && digits(m.phone).includes(sd)),
    );
  }, [q, tab]);

  const selected = MEMBERS.find((m) => m.code === selCode) ?? MEMBERS[0];

  return (
    <div className="split" style={{ gap: 24 }}>
      <div className="wide" style={{ flex: '999 1 600px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <header className="page-head">
          <div className="grow">
            <h1 className="page-title">Hội viên</h1>
            <p className="page-sub">
              {counts.all.toLocaleString('vi-VN')} hội viên · {(counts.active + counts.expiring).toLocaleString('vi-VN')} đang hoạt động
            </p>
          </div>
          <input
            type="search"
            className="inp search"
            style={{ flex: '0 1 280px', minWidth: 0 }}
            aria-label="Tìm hội viên"
            placeholder="Tên, SĐT hoặc mã hội viên"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-secondary" type="button">Xuất Excel</button>
          <button className="btn btn-primary" type="button">+ Thêm hội viên</button>
        </header>

        <div role="tablist" aria-label="Lọc trạng thái" className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'tab' + (tab === t.id ? ' on' : '')}
              role="tab"
              aria-selected={tab === t.id}
              type="button"
              onClick={() => update({ tab: t.id })}
            >
              {t.label} {counts[t.id]}
            </button>
          ))}
        </div>

        <section className="card" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Hội viên</th>
                <th>Gói tập</th>
                <th>Hạn dùng</th>
                <th className="col-last">Check-in gần nhất</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Công nợ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.code} className={m.code === selected.code ? 'sel' : ''} onClick={() => update({ m: m.code })}>
                  <td>
                    <button type="button" className="row-btn" aria-pressed={m.code === selected.code} onClick={(e) => { e.stopPropagation(); update({ m: m.code }); }}>
                      <span className={'avatar' + (m.inside ? ' in' : '')} style={{ width: 36, height: 36, fontSize: 12 }} aria-hidden="true">{m.ini}</span>
                      <span>
                        <span style={{ display: 'block', fontWeight: 600 }}>{m.name}</span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)' }}>{m.code} · {m.phone}</span>
                      </span>
                    </button>
                  </td>
                  <td className="wrap">{m.plan}</td>
                  <td className="num" style={{ fontSize: 16 }}>{m.exp}</td>
                  <td className="muted wrap col-last">{m.last}</td>
                  <td><span className={'badge b-' + m.tone}>{m.status}</span></td>
                  <td className="num" style={{ textAlign: 'right', fontSize: 16, color: m.debt ? 'var(--danger)' : 'var(--ink-muted)' }}>
                    {m.debt ? vnd(m.debt) : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 32, cursor: 'default' }}>
                    Không tìm thấy hội viên phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', fontSize: 13, color: 'var(--ink-muted)' }}>
            <span>Hiển thị {rows.length ? `1–${rows.length}` : '0'} / {counts[tab]}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" type="button" disabled>Trước</button>
              <button className="btn btn-secondary btn-sm" type="button" disabled>Sau</button>
            </div>
          </div>
        </section>
      </div>

      <MemberProfile m={selected} />
    </div>
  );
}

function MemberProfile({ m }: { m: Member }) {
  const visits = m.checkins28.reduce((a, b) => a + b, 0);
  return (
    <aside className="card side" aria-label="Hồ sơ hội viên" style={{ flex: '1 1 340px', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          className="avatar"
          aria-hidden="true"
          style={{ width: 64, height: 64, fontSize: 20, boxShadow: m.inside ? '0 0 0 3px var(--surface-raised), 0 0 0 6px var(--volt)' : 'none' }}
        >
          {m.ini}
        </span>
        <div>
          <h2 style={{ fontSize: 20, lineHeight: '28px' }}>{m.name}</h2>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{m.code} · {m.phone}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className={'badge b-' + m.tone}>{m.status}</span>
            {m.hasPT && <span className="badge b-class">Có PT</span>}
            {m.inside && <span className="badge b-volt">Đang ở phòng tập</span>}
          </div>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="line" style={{ alignItems: 'baseline', gap: 8 }}>
          <b>{m.plan}</b>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{m.period}</span>
        </div>
        <div role="img" aria-label={`Đã dùng ${m.usedPct}% thời hạn gói`} className="meter" style={{ height: 8, background: 'var(--line)' }}>
          <div style={{ width: `${m.usedPct}%`, background: m.usedPct >= 90 ? 'var(--warning)' : 'var(--brand)' }} />
        </div>
        <div className="line" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
          <span>Còn <b className="num" style={{ fontSize: 18, color: 'var(--ink)' }}>{m.remain}</b></span>
          {m.pt && (
            <span>PT còn <b className="num" style={{ fontSize: 18, color: 'var(--clay)' }}>{m.pt.left}</b>/{m.pt.total} buổi</span>
          )}
        </div>
      </div>

      <div>
        <div className="line" style={{ alignItems: 'baseline', marginBottom: 10 }}>
          <span className="lbl">Check-in 4 tuần qua</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}><b style={{ color: 'var(--ink)' }}>{visits}</b> lần</span>
        </div>
        <div role="img" aria-label={`Lịch check-in 28 ngày, ${visits} ngày có tập`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
          {m.checkins28.map((v, i) => (
            <span
              key={i}
              style={{
                height: 22,
                borderRadius: 4,
                background: i === 27 && m.inside ? 'var(--volt)' : v ? 'var(--brand)' : 'var(--surface-sunken)',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginTop: 4, fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center' }}>
          {DOW.map((d) => <span key={d}>{d}</span>)}
        </div>
      </div>

      <div>
        <span className="lbl">Lịch sử thanh toán</span>
        {m.payments.map((p) => (
          <div key={p.what + p.when} className="line" style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)', fontSize: 14 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.what}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{p.when} · {p.method}</div>
            </div>
            <span className="num" style={{ fontSize: 18 }}>{vnd(p.amount)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-volt" type="button" style={{ flex: '1 1 100px' }}>Check-in</button>
        <button className="btn btn-primary" type="button" style={{ flex: '1 1 100px' }}>Gia hạn</button>
        <button className="btn btn-secondary" type="button" style={{ flex: '1 1 100px' }}>Bảo lưu</button>
      </div>
    </aside>
  );
}
