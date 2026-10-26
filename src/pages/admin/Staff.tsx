import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { StaffEditor } from '../../components/StaffEditor';
import { vnd } from '../../lib/format';
import {
  EVENING_ALLOWANCE,
  MODULES,
  MONTH_LABEL,
  NOW_SHIFT,
  ROLES,
  SHIFTS,
  STATUS,
  TODAY_INDEX,
  WEEK_DAYS,
  WEEK_LABEL,
  WORK_SHIFTS,
  coverage,
  coverageGaps,
  initials,
  payroll,
  weekHours,
  weekShiftCount,
  type Role,
  type Shift,
  type Staff as StaffT,
} from '../../lib/staff';
import { useStaff } from '../../store/staff';

type Tab = 'list' | 'roster' | 'payroll';
const SHIFT_ORDER: Shift[] = ['S', 'C', 'T', 'off', 'P'];

const statValue = (s: StaffT, key: string) => {
  const v = s.stats[key as keyof StaffT['stats']];
  if (v === undefined) return '—';
  return key === 'salesRevenue' ? vnd(v) : v.toLocaleString('vi-VN');
};

export default function StaffPage() {
  const { staff, updateStaff, setShift } = useStaff();
  const [tab, setTab] = useState<Tab>('list');
  const [selId, setSelId] = useState<string | null>('s02');
  const [editor, setEditor] = useState<{ staff?: StaffT } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');

  const working = staff.filter((s) => s.status !== 'quit');
  const onShiftNow = working.filter((s) => s.status === 'active' && s.week[TODAY_INDEX] === NOW_SHIFT);
  const gaps = useMemo(() => coverageGaps(staff), [staff]);
  const payrollTotal = working.reduce((t, s) => t + payroll(s).total, 0);

  const rows = staff.filter((s) => {
    const k = q.trim().toLowerCase();
    return (role === 'all' || s.role === role) && (!k || s.name.toLowerCase().includes(k) || s.code.toLowerCase().includes(k) || s.phone.replace(/\D/g, '').includes(k.replace(/\D/g, '') || '#'));
  });
  const selected = staff.find((s) => s.id === selId) ?? null;

  const select = (id: string) => {
    setSelId(id);
    setEditor(null);
  };

  const exportCsv = () => {
    const head = ['Mã', 'Họ tên', 'Vai trò', 'Hình thức', 'Lương cơ bản', 'Tiền PT', 'Hoa hồng', 'Phụ cấp ca tối', 'Tổng'];
    const lines = working.map((s) => {
      const p = payroll(s);
      return [s.code, s.name, ROLES[s.role].label, s.type === 'full' ? 'Toàn thời gian' : 'Bán thời gian', p.base, p.pt, p.commission, p.allowance, p.total].join(';');
    });
    lines.push(['', 'Tổng', '', '', '', '', '', '', payrollTotal].join(';'));
    const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bang-luong_2026-10.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="page-head">
        <div className="grow">
          <h1 className="page-title">Nhân viên</h1>
          <p className="page-sub">{WEEK_LABEL} · Chi nhánh Quận 7</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => { setEditor({}); setNotice(null); }}>
          <Icon name="plus" /> Thêm nhân viên
        </button>
      </header>

      <section aria-label="Chỉ số nhân sự" className="kpis">
        <div className="card kpi hl">
          <span className="lbl">Đang làm</span>
          <span className="kpi-value">{staff.filter((s) => s.status === 'active').length}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{staff.filter((s) => s.status === 'leave').length} người nghỉ phép</span>
        </div>
        <div className="card kpi">
          <span className="lbl">Trong {SHIFTS[NOW_SHIFT].label.toLowerCase()} lúc này</span>
          <span className="kpi-value">{onShiftNow.length}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }} title={onShiftNow.map((s) => s.name).join(', ')}>
            {onShiftNow.map((s) => s.name.split(' ').slice(-1)[0]).join(', ') || 'Không ai'}
          </span>
        </div>
        <div className="card kpi">
          <span className="lbl">Giờ công tuần này</span>
          <span className="kpi-value">{working.reduce((h, s) => h + weekHours(s), 0)}</span>
          <span style={{ fontSize: 13, color: gaps.length ? 'var(--warning)' : 'var(--ink-muted)', fontWeight: gaps.length ? 600 : 400 }}>
            {gaps.length ? `${gaps.length} ca chưa có lễ tân` : 'Đủ lễ tân mọi ca'}
          </span>
        </div>
        <div className="card kpi">
          <span className="lbl">Quỹ lương tạm tính {MONTH_LABEL}</span>
          <span className="kpi-value">{vnd(payrollTotal)}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>chưa trừ bảo hiểm, thuế</span>
        </div>
      </section>

      {notice && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{notice}</span>
        </div>
      )}

      <div role="tablist" aria-label="Quản lý nhân viên" className="tabs">
        {([['list', 'Danh sách'], ['roster', 'Lịch ca tuần'], ['payroll', 'Bảng lương']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={'tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>
            {label}
            {id === 'roster' && gaps.length > 0 && <span className="tab-dot" aria-label={`${gaps.length} ca thiếu lễ tân`}>{gaps.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'roster' ? (
        <Roster staff={working} gaps={gaps} onChange={setShift} onSelect={(id) => { select(id); setTab('list'); }} />
      ) : tab === 'payroll' ? (
        <section className="card" style={{ overflowX: 'auto' }}>
          <div className="card-head" style={{ padding: '16px 16px 0' }}>
            <div>
              <h2 className="card-title">Bảng lương tạm tính {MONTH_LABEL}</h2>
              <p className="muted" style={{ fontSize: 13 }}>
                Chưa trừ bảo hiểm, thuế. Phụ cấp ca tối {vnd(EVENING_ALLOWANCE)}/ca, ước tính theo lịch tuần này × 4.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" type="button" onClick={exportCsv}>Xuất CSV</button>
          </div>
          <table className="table rp-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th style={{ textAlign: 'right' }}>Lương cơ bản</th>
                <th style={{ textAlign: 'right' }}>Tiền PT</th>
                <th style={{ textAlign: 'right' }}>Hoa hồng</th>
                <th style={{ textAlign: 'right' }}>Phụ cấp ca tối</th>
                <th style={{ textAlign: 'right' }}>Tổng</th>
              </tr>
            </thead>
            <tbody>
              {working.map((s) => {
                const p = payroll(s);
                return (
                  <tr key={s.id} onClick={() => { select(s.id); setTab('list'); }}>
                    <td>
                      <span style={{ display: 'block', fontWeight: 600 }}>{s.name}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)' }}>{ROLES[s.role].label} · {p.baseNote}</span>
                    </td>
                    <td className="num r">{vnd(p.base)}</td>
                    <td className="num r muted">{p.pt ? vnd(p.pt) : '—'}</td>
                    <td className="num r muted">{p.commission ? vnd(p.commission) : '—'}</td>
                    <td className="num r muted">{p.allowance ? vnd(p.allowance) : '—'}</td>
                    <td className="num r" style={{ fontWeight: 600 }}>{vnd(p.total)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 700 }}>Tổng {working.length} nhân viên</td>
                <td className="num r">{vnd(working.reduce((t, s) => t + payroll(s).base, 0))}</td>
                <td className="num r">{vnd(working.reduce((t, s) => t + payroll(s).pt, 0))}</td>
                <td className="num r">{vnd(working.reduce((t, s) => t + payroll(s).commission, 0))}</td>
                <td className="num r">{vnd(working.reduce((t, s) => t + payroll(s).allowance, 0))}</td>
                <td className="num r" style={{ fontWeight: 700 }}>{vnd(payrollTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ) : (
        <div className="split">
          <div className="wide" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <input type="search" className="inp search" style={{ flex: '1 1 220px', maxWidth: 300 }} aria-label="Tìm nhân viên" placeholder="Tên, mã hoặc SĐT" value={q} onChange={(e) => setQ(e.target.value)} />
              <div role="group" aria-label="Lọc vai trò" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(['all', ...Object.keys(ROLES)] as (Role | 'all')[]).map((r) => (
                  <button key={r} type="button" className={'chip' + (role === r ? ' on' : '')} aria-pressed={role === r} onClick={() => setRole(r)}>
                    {r === 'all' ? 'Tất cả' : ROLES[r].label}
                  </button>
                ))}
              </div>
            </div>
            <section className="card" style={{ overflowX: 'auto' }}>
              <table className="table staff-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Vai trò</th>
                    <th>Ca tuần này</th>
                    <th>Chỉ số {MONTH_LABEL}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const on = s.id === selId;
                    const key = ROLES[s.role].stats[0];
                    return (
                      <tr key={s.id} className={on ? 'sel' : ''} onClick={() => select(s.id)}>
                        <td>
                          <button type="button" className="row-btn" aria-pressed={on} onClick={(e) => { e.stopPropagation(); select(s.id); }}>
                            <span className={'avatar' + (s.status === 'active' && s.week[TODAY_INDEX] === NOW_SHIFT ? ' in' : '')} style={{ width: 36, height: 36, fontSize: 12 }} aria-hidden="true">{initials(s.name)}</span>
                            <span>
                              <span style={{ display: 'block', fontWeight: 600 }}>{s.name}</span>
                              <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)' }}>{s.code} · {s.phone}</span>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span className={'badge plain ' + ROLES[s.role].badge}>{ROLES[s.role].label}</span>
                          <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{s.type === 'full' ? 'Toàn thời gian' : 'Bán thời gian'}</span>
                          {s.status !== 'active' && <span className={'badge ' + STATUS[s.status].badge} style={{ marginTop: 4 }}>{STATUS[s.status].label}</span>}
                        </td>
                        <td>
                          <WeekStrip week={s.week} />
                          <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{weekShiftCount(s)} ca · {weekHours(s)} giờ</span>
                        </td>
                        <td>
                          {key ? (
                            <>
                              <span className="num" style={{ fontSize: 17 }}>{statValue(s, key[0])}</span>
                              <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)' }}>{key[1]}</span>
                            </>
                          ) : (
                            <>
                              <span className="num" style={{ fontSize: 17 }}>{s.stats.monthShifts}</span>
                              <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)' }}>ca đã làm</span>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 32, cursor: 'default' }}>Không tìm thấy nhân viên phù hợp.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>

          <aside className="card side" aria-label={editor ? 'Thêm / sửa nhân viên' : 'Hồ sơ nhân viên'} style={{ flex: '1 1 340px', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editor ? (
              <StaffEditor
                key={editor.staff?.id ?? 'new'}
                staff={editor.staff}
                onCancel={() => setEditor(null)}
                onDone={(msg, id) => {
                  setEditor(null);
                  setNotice(msg);
                  setSelId(id);
                  setRole('all');
                  setQ('');
                }}
              />
            ) : selected ? (
              <StaffDetail
                s={selected}
                onEdit={() => setEditor({ staff: selected })}
                onStatus={(status, msg) => {
                  updateStaff(selected.id, { status });
                  setNotice(msg);
                }}
              />
            ) : (
              <p className="muted">Chọn một nhân viên để xem hồ sơ.</p>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function WeekStrip({ week }: { week: Shift[] }) {
  return (
    <span className="week-strip" role="img" aria-label={week.map((x, i) => `${WEEK_DAYS[i].dow}: ${SHIFTS[x].short}`).join(', ')}>
      {week.map((x, i) => (
        <span key={i} className={'wk sh-' + x + (i === TODAY_INDEX ? ' today' : '')}>{x === 'off' ? '' : x === 'P' ? 'P' : x}</span>
      ))}
    </span>
  );
}

function Roster({
  staff,
  gaps,
  onChange,
  onSelect,
}: {
  staff: StaffT[];
  gaps: { day: number; shift: Shift }[];
  onChange: (id: string, day: number, shift: Shift) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card-head" style={{ flexWrap: 'wrap' }}>
        <h2 className="card-title">Lịch ca · {WEEK_LABEL}</h2>
        <div className="legend" style={{ marginTop: 0 }}>
          {WORK_SHIFTS.map((x) => (
            <span key={x} className={'badge plain sh-' + x}>{SHIFTS[x].short} {SHIFTS[x].time}</span>
          ))}
          <span className="badge plain sh-P">Phép</span>
        </div>
      </div>
      {gaps.length > 0 ? (
        <div className="toast warn" role="status">
          <Icon name="timer" />
          <span>
            {gaps.length} ca chưa có lễ tân: {gaps.map((g) => `${WEEK_DAYS[g.day].dow} ${SHIFTS[g.shift].short.toLowerCase()}`).join(', ')}. Đổi ca cho lễ tân trong bảng dưới.
          </span>
        </div>
      ) : (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>Mọi ca trong tuần đều có lễ tân trực.</span>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="roster">
          <caption className="sr-only">Lịch ca tuần; mỗi ô là một danh sách chọn ca</caption>
          <thead>
            <tr>
              <th scope="col">Nhân viên</th>
              {WEEK_DAYS.map((d, i) => (
                <th key={d.dow} scope="col" className={i === TODAY_INDEX ? 'today' : ''}>
                  {d.dow}
                  <span>{d.date}</span>
                </th>
              ))}
              <th scope="col">Giờ</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <th scope="row">
                  <button type="button" className="link-btn" style={{ textDecoration: 'none', color: 'var(--ink)' }} onClick={() => onSelect(s.id)}>{s.name}</button>
                  <span>{ROLES[s.role].label}</span>
                </th>
                {s.week.map((x, d) => (
                  <td key={d} className={d === TODAY_INDEX ? 'today' : ''}>
                    <select
                      className={'shift-sel sh-' + x}
                      value={x}
                      aria-label={`${s.name}, ${WEEK_DAYS[d].dow} ${WEEK_DAYS[d].date}`}
                      onChange={(e) => onChange(s.id, d, e.target.value as Shift)}
                    >
                      {SHIFT_ORDER.map((o) => (
                        <option key={o} value={o}>{SHIFTS[o].short}</option>
                      ))}
                    </select>
                  </td>
                ))}
                <td className="num" style={{ fontSize: 16, textAlign: 'right' }}>{weekHours(s)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">
                Lễ tân trong ca
                <span>Cần ≥ 1 mỗi ca</span>
              </th>
              {WEEK_DAYS.map((d, i) => (
                <td key={d.dow} className={i === TODAY_INDEX ? 'today' : ''}>
                  <div className="cov">
                    {coverage(staff, i).map((c) => (
                      <span key={c.shift} className={'cov-chip' + (c.reception ? '' : ' gap')} title={c.names.join(', ') || 'Không ai'}>
                        {SHIFTS[c.shift].short[0]} {c.reception}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function StaffDetail({ s, onEdit, onStatus }: { s: StaffT; onEdit: () => void; onStatus: (st: StaffT['status'], msg: string) => void }) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const p = payroll(s);
  const role = ROLES[s.role];
  const years = Math.max(0, 2026 - Number(s.startDate.slice(0, 4)));
  const [y, m, d] = s.startDate.split('-');

  return (
    <>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span className="avatar" aria-hidden="true" style={{ width: 56, height: 56, fontSize: 18 }}>{initials(s.name)}</span>
        <div style={{ minWidth: 0 }}>
          <span className="lbl">{s.code}</span>
          <h2 style={{ font: '700 28px/32px var(--font-display)' }}>{s.name}</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            <span className={'badge plain ' + role.badge}>{role.label}</span>
            <span className={'badge ' + STATUS[s.status].badge}>{STATUS[s.status].label}</span>
          </div>
        </div>
      </div>

      <dl className="tc-dl">
        <dt>Điện thoại</dt>
        <dd>{s.phone}</dd>
        {s.email && (
          <>
            <dt>Email</dt>
            <dd style={{ overflowWrap: 'anywhere' }}>{s.email}</dd>
          </>
        )}
        <dt>Hình thức</dt>
        <dd>{s.type === 'full' ? 'Toàn thời gian' : 'Bán thời gian'}</dd>
        <dt>Vào làm</dt>
        <dd>{d}/{m}/{y}{years ? ` · ${years} năm` : ''}</dd>
      </dl>
      {s.note && <p className="toast warn" style={{ fontSize: 13 }}>{s.note}</p>}

      <div>
        <span className="lbl">Tuần này · {weekShiftCount(s)} ca, {weekHours(s)} giờ</span>
        <div className="week-detail">
          {s.week.map((x, i) => (
            <div key={i} className={'wd sh-' + x + (i === TODAY_INDEX ? ' today' : '')}>
              <b>{WEEK_DAYS[i].dow}</b>
              <span>{SHIFTS[x].short}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="plan-stats">
        <div className="plan-stat">
          <span className="num">{s.stats.monthShifts}</span>
          <span>Ca đã làm {MONTH_LABEL}</span>
        </div>
        {role.stats.map(([k, label]) => (
          <div key={k} className="plan-stat">
            <span className="num" style={k === 'salesRevenue' ? { fontSize: 20 } : undefined}>{statValue(s, k)}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <ul className="pe-lines" aria-label="Lương tạm tính">
        <li><span>{p.baseNote}</span><span className="num">{vnd(p.base)}</span></li>
        {p.pt > 0 && <li><span>{s.stats.ptSessions} buổi PT × {vnd(s.ptRate)}</span><span className="num">{vnd(p.pt)}</span></li>}
        {p.commission > 0 && <li><span>Hoa hồng {s.commission * 100}% doanh thu gói</span><span className="num">{vnd(p.commission)}</span></li>}
        {p.allowance > 0 && <li><span>Phụ cấp ca tối (ước tính)</span><span className="num">{vnd(p.allowance)}</span></li>}
        <li className="pe-total"><span>Lương tạm tính {MONTH_LABEL}</span><span className="num">{vnd(p.total)}</span></li>
      </ul>

      <div>
        <span className="lbl">Quyền truy cập</span>
        <ul className="perm-list">
          {MODULES.map((mod) => {
            const ok = s.perms.includes(mod.id);
            return (
              <li key={mod.id} className={ok ? '' : 'no'}>
                <Icon name={ok ? 'check' : 'lock'} size={14} />
                {mod.label}
                <span className="sr-only">{ok ? ': được truy cập' : ': không có quyền'}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" type="button" style={{ flex: '1 1 120px' }} onClick={onEdit}>Sửa thông tin</button>
        {s.status === 'active' && (
          <button className="btn btn-secondary" type="button" style={{ flex: '1 1 120px' }} onClick={() => onStatus('leave', `${s.name} chuyển sang nghỉ phép.`)}>Cho nghỉ phép</button>
        )}
        {s.status !== 'active' && (
          <button className="btn btn-secondary" type="button" style={{ flex: '1 1 120px' }} onClick={() => onStatus('active', `${s.name} quay lại làm việc.`)}>Quay lại làm</button>
        )}
      </div>
      {s.status !== 'quit' &&
        (confirmQuit ? (
          <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <span>Cho {s.name} nghỉ việc? Nhân viên sẽ bị gỡ khỏi lịch ca và bảng lương, hồ sơ vẫn được giữ.</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger btn-sm" type="button" onClick={() => { onStatus('quit', `${s.name} đã được chuyển sang nghỉ việc.`); setConfirmQuit(false); }}>Xác nhận nghỉ việc</button>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => setConfirmQuit(false)}>Huỷ</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm ce-del" type="button" onClick={() => setConfirmQuit(true)}>Cho nghỉ việc</button>
        ))}
    </>
  );
}
