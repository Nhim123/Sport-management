import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart } from '../../components/BarChart';
import { Icon } from '../../components/Icon';
import { PlanCard } from '../../components/PlanCard';
import { PlanEditor, type EditorMode } from '../../components/PlanEditor';
import { vnd, vndShort } from '../../lib/format';
import {
  CURRENT_MONTH,
  MONTH_LABELS,
  benefitTags,
  revenueThisMonth,
  salesThisMonth,
  templateOf,
  type Plan,
} from '../../lib/plans';
import { usePlans } from '../../store/plans';
import type { PlanCreatedState } from './PlanCreate';

type Tab = 'catalog' | 'custom' | 'paused';

const pct = (x: number) => (x * 100).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + '%';

export default function Plans() {
  const { plans, updatePlan } = usePlans();
  // Quay về từ màn "Tạo gói theo mẫu": chọn sẵn gói vừa tạo và báo thành công
  const created = useLocation().state as PlanCreatedState | null;
  const [tab, setTab] = useState<Tab>('catalog');
  const [selId, setSelId] = useState<string | null>(created?.planId ?? 'p-gym-12');
  const [editor, setEditor] = useState<{ mode: EditorMode; plan?: Plan; seed?: Plan } | null>(null);
  const [notice, setNotice] = useState<string | null>(created?.notice ?? null);
  // Pop-up chọn cách tạo gói: theo mẫu hay tự điều chỉnh
  const [chooser, setChooser] = useState(false);
  // Xem trước & in mẫu thẻ cho một gói
  const [cardPlan, setCardPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!chooser && !editor && !cardPlan) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (chooser) setChooser(false);
      else if (editor) setEditor(null);
      else setCardPlan(null);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [chooser, editor, cardPlan]);

  const lists: Record<Tab, Plan[]> = {
    catalog: plans.filter((p) => p.status === 'active' && (!p.custom || p.listed)),
    custom: plans.filter((p) => p.custom),
    paused: plans.filter((p) => p.status === 'paused'),
  };
  const rows = lists[tab];
  const selected = plans.find((p) => p.id === selId) ?? null;

  const kpi = useMemo(() => {
    const live = plans.filter((p) => p.status === 'active');
    const withRenewal = live.filter((p) => p.stats && p.stats.renewal !== null);
    const activeSum = withRenewal.reduce((s, p) => s + p.stats!.active, 0);
    return {
      active: live.reduce((s, p) => s + (p.stats?.active ?? 0), 0),
      sold: live.reduce((s, p) => s + salesThisMonth(p), 0),
      revenue: live.reduce((s, p) => s + revenueThisMonth(p), 0),
      renewal: activeSum ? withRenewal.reduce((s, p) => s + p.stats!.renewal! * p.stats!.active, 0) / activeSum : 0,
      expiring: live.reduce((s, p) => s + (p.stats?.expiring ?? 0), 0),
      catalog: lists.catalog.length,
      custom: lists.custom.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  const open = (mode: EditorMode, plan?: Plan, seed?: Plan) => {
    setEditor({ mode, plan, seed });
    setNotice(null);
  };

  return (
    <>
      <header className="page-head">
        <div className="grow">
          <h1 className="page-title">Gói tập</h1>
          <p className="page-sub">{kpi.catalog} gói đang bán · {kpi.custom} gói riêng theo yêu cầu</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={() => open('custom')}>
          <Icon name="person" /> Gói theo yêu cầu
        </button>
        <button className="btn btn-primary" type="button" onClick={() => setChooser(true)}>
          <Icon name="plus" /> Tạo gói
        </button>
      </header>

      <section aria-label={`Chỉ số gói tập ${CURRENT_MONTH}`} className="kpis">
        <div className="card kpi hl">
          <span className="lbl">Hội viên đang dùng gói</span>
          <span className="kpi-value">{kpi.active.toLocaleString('vi-VN')}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{kpi.expiring} người hết hạn trong 14 ngày</span>
        </div>
        <div className="card kpi">
          <span className="lbl">Gói bán {CURRENT_MONTH}</span>
          <span className="kpi-value">{kpi.sold}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>trên {kpi.catalog + kpi.custom} gói</span>
        </div>
        <div className="card kpi">
          <span className="lbl">Doanh thu gói {CURRENT_MONTH}</span>
          <span className="kpi-value">{vnd(kpi.revenue)}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>từ gói bán mới &amp; gia hạn</span>
        </div>
        <div className="card kpi">
          <span className="lbl">Tỉ lệ gia hạn</span>
          <span className="kpi-value">{pct(kpi.renewal)}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>trung bình theo số hội viên</span>
        </div>
      </section>

      {notice && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{notice}</span>
        </div>
      )}

      <div className="split">
        <div className="wide" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div role="tablist" aria-label="Nhóm gói" className="tabs">
            {([
              ['catalog', 'Danh mục đang bán'],
              ['custom', 'Theo yêu cầu'],
              ['paused', 'Ngừng bán'],
            ] as [Tab, string][]).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={'tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>
                {label} {lists[id].length}
              </button>
            ))}
          </div>

          <section className="card" style={{ overflowX: 'auto' }}>
            {rows.length === 0 ? (
              <p className="muted" style={{ padding: 24, textAlign: 'center' }}>
                {tab === 'custom' ? 'Chưa có gói riêng nào – bấm “Gói theo yêu cầu” để tạo.' : 'Không có gói nào ở mục này.'}
              </p>
            ) : (
              <table className="table plan-table">
                <thead>
                  <tr>
                    <th>Gói</th>
                    <th style={{ textAlign: 'right' }}>Giá</th>
                    <th style={{ textAlign: 'right' }}>Đang dùng</th>
                    <th style={{ textAlign: 'right' }}>Bán T10</th>
                    <th style={{ textAlign: 'right' }}>Doanh thu T10</th>
                    <th style={{ textAlign: 'right' }}>Gia hạn</th>
                    <th className="col-last">6 tháng</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const on = p.id === selId;
                    const tpl = templateOf(p.templateId);
                    return (
                      <tr key={p.id} className={on ? 'sel' : ''} onClick={() => { setSelId(p.id); setEditor(null); }}>
                        <td>
                          <button
                            type="button"
                            className="row-btn"
                            aria-pressed={on}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelId(p.id);
                              setEditor(null);
                            }}
                          >
                            <span className="plan-ic" aria-hidden="true"><Icon name={tpl.icon} /></span>
                            <span style={{ minWidth: 0 }}>
                              <span style={{ display: 'block', fontWeight: 600 }}>{p.name}</span>
                              <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)' }}>
                                {p.custom ? `Riêng: ${p.custom.customer}` : p.freeform ? 'Gói tự do' : tpl.name} · {p.months} tháng
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="num r">{vnd(p.price)}</td>
                        <td className="num r">{p.stats?.active ?? 0}</td>
                        <td className="num r">{salesThisMonth(p)}</td>
                        <td className="num r">{vnd(revenueThisMonth(p))}</td>
                        <td className="num r">{p.stats?.renewal != null ? pct(p.stats.renewal) : '—'}</td>
                        <td className="col-last"><Spark values={p.stats?.sales ?? []} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <aside className="card side" aria-label="Chi tiết gói tập" style={{ flex: '1 1 360px', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selected ? (
            <PlanDetail
              plan={selected}
              totalRevenue={kpi.revenue}
              onEdit={() => open(selected.custom ? 'custom' : selected.freeform ? 'free' : 'catalog', selected)}
              onCustomize={() => open('custom', undefined, selected)}
              onCard={() => setCardPlan(selected)}
              onToggle={() => {
                const next = selected.status === 'active' ? 'paused' : 'active';
                updatePlan(selected.id, { status: next });
                setNotice(next === 'paused' ? `Đã ngừng bán ${selected.name}. Hội viên đang dùng không bị ảnh hưởng.` : `Đã mở bán lại ${selected.name}.`);
              }}
            />
          ) : (
            <p className="muted">Chọn một gói để xem thống kê.</p>
          )}
        </aside>
      </div>

      {editor && (
        <div className="modal-backdrop" onMouseDown={() => setEditor(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Tạo / sửa gói tập"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <PlanEditor
              key={(editor.plan?.id ?? editor.seed?.id ?? 'new') + editor.mode}
              mode={editor.mode}
              plan={editor.plan}
              seed={editor.seed}
              onCancel={() => setEditor(null)}
              onDone={(msg, id) => {
                setEditor(null);
                setNotice(msg);
                setSelId(id);
                const saved = plans.find((p) => p.id === id);
                setTab(editor.mode === 'custom' ? 'custom' : saved?.status === 'paused' ? 'paused' : 'catalog');
              }}
            />
          </div>
        </div>
      )}

      {cardPlan && (
        <div className="modal-backdrop" onMouseDown={() => setCardPlan(null)}>
          <div className="modal-card pcard-modal" role="dialog" aria-modal="true" aria-label="Mẫu thẻ gói" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ce-head">
              <div>
                <span className="lbl">Mẫu thẻ phát cho khách</span>
                <h2 className="ce-title">Thẻ gói · {cardPlan.name}</h2>
              </div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => setCardPlan(null)}>Đóng</button>
            </div>
            <div id="print-card" className="pcard-stage">
              <PlanCard plan={cardPlan} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="button" onClick={() => window.print()}><Icon name="card" size={15} /> In thẻ</button>
              <button className="btn btn-secondary" type="button" onClick={() => setCardPlan(null)}>Đóng</button>
            </div>
            <p className="muted" style={{ fontSize: 12 }}>Mẫu dùng chung cho mọi gói, tự điền tên gói và quyền lợi. Chủ thẻ và mã thẻ ghi tay hoặc in khi bán.</p>
          </div>
        </div>
      )}

      {chooser && (
        <div className="modal-backdrop" onMouseDown={() => setChooser(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Chọn cách tạo gói"
            style={{ maxWidth: 520 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="ce-head">
              <div>
                <span className="lbl">Tạo gói mới</span>
                <h2 className="ce-title">Chọn cách tạo</h2>
              </div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => setChooser(false)}>Huỷ</button>
            </div>
            <div className="plan-choose">
              <button
                type="button"
                className="choose-card"
                onClick={() => { setChooser(false); open('catalog'); }}
              >
                <span className="plan-ic lg" aria-hidden="true"><Icon name="tag" size={22} /></span>
                <b>Theo mẫu</b>
                <span className="muted">Chọn một khuôn mẫu chuẩn, thời hạn và quyền lợi theo mẫu. Nhanh và đúng chuẩn danh mục.</span>
              </button>
              <button
                type="button"
                className="choose-card"
                onClick={() => { setChooser(false); open('free'); }}
              >
                <span className="plan-ic lg" aria-hidden="true"><Icon name="plus" size={22} /></span>
                <b>Tự điều chỉnh</b>
                <span className="muted">Dựng gói tự do, không ràng buộc khuôn mẫu. Tự chọn thời hạn, quyền lợi và giá.</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  if (!values.some((v) => v > 0)) return <span className="muted" style={{ fontSize: 12 }}>Chưa có</span>;
  return (
    <span className="spark" role="img" aria-label={`Số gói bán ${MONTH_LABELS.join(', ')}: ${values.join(', ')}`}>
      {values.map((v, i) => (
        <span key={i} style={{ height: `${Math.max(6, (v / max) * 100)}%`, opacity: i === values.length - 1 ? 1 : 0.55 }} />
      ))}
    </span>
  );
}

function PlanDetail({
  plan,
  totalRevenue,
  onEdit,
  onCustomize,
  onCard,
  onToggle,
}: {
  plan: Plan;
  totalRevenue: number;
  onEdit: () => void;
  onCustomize: () => void;
  onCard: () => void;
  onToggle: () => void;
}) {
  const tpl = templateOf(plan.templateId);
  const s = plan.stats;
  const hasSales = !!s && s.sales.some((v) => v > 0);
  const share = totalRevenue ? revenueThisMonth(plan) / totalRevenue : 0;
  const isPT = plan.templateId === 'pt';

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="plan-ic lg" aria-hidden="true"><Icon name={tpl.icon} size={24} /></span>
        <div style={{ minWidth: 0 }}>
          <span className="lbl">{plan.custom ? 'Gói riêng theo yêu cầu' : plan.freeform ? 'Gói tự do · không theo mẫu' : tpl.name}</span>
          <h2 style={{ font: '700 28px/32px var(--font-display)', overflowWrap: 'anywhere' }}>{plan.name}</h2>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span className="num" style={{ fontSize: 30, fontWeight: 600 }}>{vnd(plan.price)}</span>
        <span className="muted" style={{ fontSize: 13 }}>
          {plan.months} tháng · ≈ {vnd(Math.round(plan.price / plan.months / 1000) * 1000)}/tháng
        </span>
        {plan.status === 'paused' && <span className="badge b-neutral">Ngừng bán</span>}
        {plan.custom && plan.listed && <span className="badge b-info">Có trong danh mục</span>}
      </div>
      <div className="plan-tags">
        {benefitTags(plan).map((t) => (
          <span key={t} className="badge plain b-neutral">{t}</span>
        ))}
      </div>

      {plan.custom && (
        <div className="plan-custom">
          <b>{plan.custom.customer}</b>
          <span className="muted" style={{ fontSize: 13 }}>{[plan.custom.memberCode, plan.custom.phone].filter(Boolean).join(' · ')}</span>
          {plan.custom.note && <span style={{ fontSize: 13 }}>“{plan.custom.note}”</span>}
        </div>
      )}

      <div className="plan-stats">
        <Stat label="Đang dùng" value={String(s?.active ?? 0)} />
        <Stat label="Tỉ lệ gia hạn" value={s?.renewal != null ? pct(s.renewal) : '—'} />
        <Stat label={isPT ? 'Buổi PT / tuần' : 'Check-in / tuần'} value={s?.checkins ? s.checkins.toLocaleString('vi-VN') : '—'} />
        <Stat label="Hết hạn ≤ 14 ngày" value={String(s?.expiring ?? 0)} warn={(s?.expiring ?? 0) > 0} />
      </div>

      <div>
        <div className="line" style={{ marginBottom: 8 }}>
          <span className="lbl">Gói bán 6 tháng</span>
          {hasSales && <span className="muted" style={{ fontSize: 13 }}>{pct(share)} doanh thu gói {CURRENT_MONTH}</span>}
        </div>
        {hasSales ? (
          <BarChart
            ariaLabel={`Số gói ${plan.name} bán ra 6 tháng`}
            series={[{ label: 'Gói bán', color: 'var(--brand)' }]}
            data={MONTH_LABELS.map((m, i) => ({ label: m, full: `${m}/2026 · doanh thu ${vndShort(s!.sales[i] * plan.price)}`, values: [s!.sales[i]] }))}
            format={(n) => `${n} gói`}
            axisFormat={(n) => String(Math.round(n))}
            height={140}
          />
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>{plan.custom ? 'Gói riêng – không tính số bán theo tháng.' : 'Chưa có dữ liệu bán – gói mới tạo.'}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" type="button" style={{ flex: '1 1 120px' }} onClick={onEdit}>Sửa gói</button>
        <button className="btn btn-secondary" type="button" style={{ flex: '1 1 120px' }} onClick={onCard}><Icon name="card" size={15} /> Mẫu thẻ</button>
        {!plan.custom && (
          <button className="btn btn-secondary" type="button" style={{ flex: '1 1 120px' }} onClick={onCustomize}>Tạo gói riêng từ gói này</button>
        )}
        <button className="btn btn-ghost btn-sm" type="button" onClick={onToggle}>
          {plan.status === 'active' ? 'Ngừng bán' : 'Mở bán lại'}
        </button>
      </div>
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="plan-stat">
      <span className="num" style={warn ? { color: 'var(--warning)' } : undefined}>{value}</span>
      <span>{label}</span>
    </div>
  );
}
