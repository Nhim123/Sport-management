// Màn "Tạo gói theo mẫu": chọn khuôn khổ chuẩn → thời hạn & quyền lợi → giá & tên, xem trước gói ở cột bên phải.
// Gói tạo ở đây vào thẳng "Danh mục đang bán" và luôn theo khuôn khổ (thời hạn, quyền lợi bắt buộc).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { vnd } from '../../lib/format';
import {
  ACCESS,
  COURT_DISCOUNT_OPTIONS,
  EXTRAS,
  FREEZE_OPTIONS,
  PT_OPTIONS,
  TEMPLATES,
  autoName,
  benefitTags,
  priceBreakdown,
  templateOf,
  type Access,
  type Extra,
  type PlanShape,
  type TemplateId,
} from '../../lib/plans';
import { usePlans } from '../../store/plans';

/** Trạng thái truyền về màn Gói tập sau khi tạo xong */
export interface PlanCreatedState {
  notice: string;
  planId: string;
}

const monthsRange = (m: number[]) => (m.length > 1 ? `${m[0]}–${m[m.length - 1]} tháng` : `${m[0]} tháng`);

export default function PlanCreate() {
  const navigate = useNavigate();
  const { plans, addPlan } = usePlans();
  const [shape, setShape] = useState<PlanShape>(templateOf('gym').defaults);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);

  const tpl = templateOf(shape.templateId);
  const ptOpts = tpl.pt ?? PT_OPTIONS;
  /** Đổi cấu hình; mặc định quay về giá đề xuất (trừ các tuỳ chọn không ảnh hưởng giá) */
  const set = (p: Partial<PlanShape>, keepPrice = false) => {
    setShape((s) => ({ ...s, ...p }));
    if (!keepPrice) setPrice(null);
  };

  const finalName = nameEdited ? name : autoName(shape);
  const trimmed = finalName.trim();
  const bd = priceBreakdown(shape);
  const finalPrice = price ?? bd.suggested;
  const diff = bd.suggested ? (finalPrice - bd.suggested) / bd.suggested : 0;
  const perMonth = Math.round(finalPrice / shape.months / 1000) * 1000;

  const errors: Record<string, string> = {};
  if (!trimmed) errors.name = 'Nhập tên gói.';
  else if (plans.some((p) => !p.custom && p.name.toLowerCase() === trimmed.toLowerCase()))
    errors.name = 'Danh mục đã có gói trùng tên – đổi tên hoặc chỉnh thời hạn / quyền lợi.';
  if (!finalPrice) errors.price = 'Nhập giá bán.';
  if (!shape.access.length && !shape.ptSessions) errors.benefits = 'Gói cần ít nhất một quyền lợi hoặc buổi PT.';
  const err = (k: string) =>
    touched && errors[k] ? (
      <span className="field-err" role="alert">
        {errors[k]}
      </span>
    ) : null;

  const chooseTemplate = (id: TemplateId) => {
    setShape(templateOf(id).defaults);
    setPrice(null);
  };
  const toggleAccess = (a: Access, on: boolean) => set({ access: on ? [...shape.access, a] : shape.access.filter((x) => x !== a) });
  const toggleExtra = (e: Extra, on: boolean) => set({ extras: on ? [...shape.extras, e] : shape.extras.filter((x) => x !== e) });

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    const created = addPlan({ ...shape, name: trimmed, price: finalPrice, status: 'active' });
    navigate('/goi-tap', { state: { notice: `Đã thêm ${created.name} vào danh mục.`, planId: created.id } satisfies PlanCreatedState });
  };

  return (
    <>
      <header className="page-head">
        <div className="grow">
          <Link to="/goi-tap" className="back-link">
            <Icon name="chevronLeft" size={16} /> Gói tập
          </Link>
          <h1 className="page-title">Tạo gói theo mẫu</h1>
          <p className="page-sub">Chọn một khuôn khổ chuẩn, chỉnh thời hạn và quyền lợi, rồi chốt giá. Gói mới vào thẳng danh mục đang bán.</p>
        </div>
      </header>

      <div className="split">
        <div className="card wide tc-body">
          <section className="pc-sec" aria-labelledby="pc-tpl">
            <div>
              <span className="lbl">Bước 1</span>
              <h2 id="pc-tpl" className="card-title">Chọn mẫu gói</h2>
            </div>
            <div className="pc-tpls" role="radiogroup" aria-labelledby="pc-tpl">
              {TEMPLATES.map((t) => {
                const from = priceBreakdown({ ...t.defaults, months: t.months[0] }).suggested;
                return (
                  <label key={t.id} className="pc-tpl">
                    <input className="sr-only" type="radio" name="pc-tpl" aria-label={t.name} checked={shape.templateId === t.id} onChange={() => chooseTemplate(t.id)} />
                    <span className="pc-tpl-head">
                      <span className="plan-ic" aria-hidden="true">
                        <Icon name={t.icon} />
                      </span>
                      <b>{t.name}</b>
                      <span className="pc-tpl-check" aria-hidden="true">
                        <Icon name="check" size={14} />
                      </span>
                    </span>
                    <span className="pc-tpl-desc">{t.desc}</span>
                    <span className="pc-tpl-meta">
                      {monthsRange(t.months)} · từ <b className="num">{vnd(from)}</b>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="pc-sec" aria-labelledby="pc-term">
            <div>
              <span className="lbl">Bước 2</span>
              <h2 id="pc-term" className="card-title">Thời hạn &amp; quyền lợi</h2>
            </div>

            <div className="field">
              <span id="pc-months">Thời hạn sử dụng</span>
              <div className="pc-months" role="radiogroup" aria-labelledby="pc-months">
                {tpl.months.map((m) => {
                  const on = shape.months === m;
                  return (
                    <button key={m} type="button" role="radio" aria-checked={on} className={'pc-month' + (on ? ' on' : '')} onClick={() => set({ months: m })}>
                      <b>{m} tháng</b>
                      <span className="num">{vnd(priceBreakdown({ ...shape, months: m }).suggested)}</span>
                    </button>
                  );
                })}
              </div>
              <span className="field-hint">Gói càng dài càng được giảm: 3 tháng −5%, 6 tháng −10%, 12 tháng −15%.</span>
            </div>

            <div className="pc-cols">
              <fieldset className="pe-checks">
                <legend className="field">Quyền lợi</legend>
                {(Object.keys(ACCESS) as Access[]).map((a) => {
                  const required = tpl.required.includes(a);
                  return (
                    <label key={a} className="check">
                      <input type="checkbox" checked={shape.access.includes(a)} disabled={required} onChange={(e) => toggleAccess(a, e.target.checked)} />
                      {ACCESS[a].label}
                      <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{required ? 'Bắt buộc theo mẫu' : `${vnd(ACCESS[a].monthly)}/th`}</span>
                    </label>
                  );
                })}
                {(Object.keys(EXTRAS) as Extra[]).map((e) => (
                  <label key={e} className="check">
                    <input type="checkbox" checked={shape.extras.includes(e)} onChange={(ev) => toggleExtra(e, ev.target.checked)} />
                    {EXTRAS[e].label}
                    <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{vnd(EXTRAS[e].monthly)}/th</span>
                  </label>
                ))}
                <label className="check">
                  <input type="checkbox" checked={shape.offPeak} disabled={shape.templateId === 'offpeak'} onChange={(e) => set({ offPeak: e.target.checked })} />
                  Chỉ giờ thấp điểm (9:00–16:00)
                  <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{shape.templateId === 'offpeak' ? 'Bắt buộc theo mẫu' : '−25%'}</span>
                </label>
                {err('benefits')}
              </fieldset>

              <div className="pc-selects">
                <label className="field">
                  Buổi PT
                  <select className="inp" value={shape.ptSessions} onChange={(e) => set({ ptSessions: Number(e.target.value) })}>
                    {ptOpts.map((n) => (
                      <option key={n} value={n}>
                        {n ? `${n} buổi` : 'Không'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Bảo lưu tối đa
                  <select className="inp" value={shape.freezeDays} onChange={(e) => set({ freezeDays: Number(e.target.value) }, true)}>
                    {FREEZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n ? `${n} ngày` : 'Không'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Giảm khi đặt sân
                  <select className="inp" value={shape.courtDiscount} onChange={(e) => set({ courtDiscount: Number(e.target.value) }, true)}>
                    {COURT_DISCOUNT_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n ? `${n}%` : 'Không'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="pc-sec" aria-labelledby="pc-price">
            <div>
              <span className="lbl">Bước 3</span>
              <h2 id="pc-price" className="card-title">Giá &amp; tên gói</h2>
            </div>
            <div className="tc-grid">
              <label className="field">
                Giá bán (₫)
                <input
                  className="inp"
                  inputMode="numeric"
                  value={finalPrice ? finalPrice.toLocaleString('vi-VN') : ''}
                  onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, '').slice(0, 10)) || 0)}
                  aria-invalid={touched && !!errors.price}
                />
                {price !== null && price !== bd.suggested && bd.suggested > 0 ? (
                  <span className="field-hint">
                    {diff < 0 ? 'Thấp' : 'Cao'} hơn đề xuất {Math.abs(diff * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% ·{' '}
                    <button type="button" className="link-btn" onClick={() => setPrice(null)}>
                      Dùng giá đề xuất
                    </button>
                  </span>
                ) : (
                  <span className="field-hint">Đang dùng giá đề xuất – sửa nếu muốn làm giá khuyến mãi.</span>
                )}
                {err('price')}
              </label>
              <label className="field">
                Tên gói
                <input className="inp" value={finalName} onChange={(e) => { setName(e.target.value); setNameEdited(true); }} aria-invalid={touched && !!errors.name} />
                {nameEdited ? (
                  <span className="field-hint">
                    <button type="button" className="link-btn" onClick={() => { setNameEdited(false); setName(''); }}>
                      Đặt lại tên tự động
                    </button>
                  </span>
                ) : (
                  <span className="field-hint">Tên tự đặt theo mẫu và thời hạn.</span>
                )}
                {err('name')}
              </label>
            </div>
          </section>

          <div className="tc-nav">
            <button className="btn btn-primary" type="button" onClick={save}>
              <Icon name="plus" /> Thêm vào danh mục
            </button>
            <Link className="btn btn-secondary" to="/goi-tap">
              Huỷ
            </Link>
          </div>
        </div>

        <aside className="card side tc-summary" aria-label="Xem trước gói">
          <span className="lbl">Xem trước</span>
          <div className="tc-sum-head">
            <span className="plan-ic lg" aria-hidden="true">
              <Icon name={tpl.icon} size={24} />
            </span>
            <div style={{ minWidth: 0 }}>
              <span className="lbl">{tpl.name}</span>
              <span className="tc-sum-name">{trimmed || 'Chưa đặt tên'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span className="num" style={{ fontSize: 30, fontWeight: 600 }}>{vnd(finalPrice)}</span>
            <span className="muted" style={{ fontSize: 13 }}>
              {shape.months} tháng · ≈ {vnd(perMonth)}/tháng
            </span>
          </div>
          <div className="plan-tags">
            {benefitTags(shape).map((t) => (
              <span key={t} className="badge plain b-neutral">{t}</span>
            ))}
          </div>
          <ul className="pe-lines" aria-label="Cách tính giá đề xuất">
            {bd.lines.map((l) => (
              <li key={l.label}>
                <span>{l.label}</span>
                <span className="num" style={{ color: l.amount < 0 ? 'var(--brand)' : undefined }}>{vnd(l.amount)}</span>
              </li>
            ))}
            <li className="pe-total">
              <span>Giá đề xuất</span>
              <span className="num">{vnd(bd.suggested)}</span>
            </li>
          </ul>
          <button className="btn btn-primary" type="button" onClick={save}>
            Thêm vào danh mục
          </button>
          <p className="muted" style={{ fontSize: 12 }}>Gói hiện ngay ở tab “Danh mục đang bán”. Có thể sửa giá hoặc ngừng bán bất cứ lúc nào.</p>
        </aside>
      </div>
    </>
  );
}
