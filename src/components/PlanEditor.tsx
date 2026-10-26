import { useId, useState } from 'react';
import { MEMBERS } from '../data/mock';
import { vnd } from '../lib/format';
import {
  ACCESS,
  COURT_DISCOUNT_OPTIONS,
  CUSTOM_MONTHS,
  EXTRAS,
  FREEZE_OPTIONS,
  PT_OPTIONS,
  TEMPLATES,
  autoName,
  priceBreakdown,
  templateOf,
  type Access,
  type Extra,
  type Plan,
  type PlanShape,
  type TemplateId,
} from '../lib/plans';
import { usePlans } from '../store/plans';
import { Icon } from './Icon';

export type EditorMode = 'catalog' | 'custom';

interface Props {
  mode: EditorMode;
  /** Sửa gói có sẵn */
  plan?: Plan;
  /** Tạo gói mới lấy cấu hình từ gói này (vd. làm gói riêng từ gói trong danh mục) */
  seed?: Plan;
  onDone: (message: string, id: string) => void;
  onCancel: () => void;
}

const shapeOf = (p: Plan): PlanShape => ({
  templateId: p.templateId,
  access: p.access,
  months: p.months,
  ptSessions: p.ptSessions,
  offPeak: p.offPeak,
  extras: p.extras,
  freezeDays: p.freezeDays,
  courtDiscount: p.courtDiscount,
});

export function PlanEditor({ mode, plan, seed, onDone, onCancel }: Props) {
  const uid = useId();
  const { addPlan, updatePlan } = usePlans();
  const from = plan ?? seed;
  const [shape, setShape] = useState<PlanShape>(from ? shapeOf(from) : templateOf('gym').defaults);
  const [name, setName] = useState(plan?.name ?? '');
  const [nameEdited, setNameEdited] = useState(!!plan);
  const [price, setPrice] = useState<number | null>(plan?.price ?? null);
  const [memberCode, setMemberCode] = useState(plan?.custom?.memberCode ?? '');
  const [newCustomer, setNewCustomer] = useState(plan?.custom && !plan.custom.memberCode ? plan.custom.customer : '');
  const [newPhone, setNewPhone] = useState(plan?.custom && !plan.custom.memberCode ? (plan.custom.phone ?? '') : '');
  const [note, setNote] = useState(plan?.custom?.note ?? '');
  const [listed, setListed] = useState(!!plan?.listed);
  const [touched, setTouched] = useState(false);

  // Gói trong danh mục phải theo khuôn khổ; gói theo yêu cầu được tùy biến tự do
  const strict = mode === 'catalog';
  const tpl = templateOf(shape.templateId);
  const monthsOpts = strict ? tpl.months : CUSTOM_MONTHS;
  const ptOpts = strict && tpl.pt ? tpl.pt : PT_OPTIONS;
  const set = (p: Partial<PlanShape>) => setShape((s) => ({ ...s, ...p }));

  const member = MEMBERS.find((m) => m.code === memberCode);
  const customerName = mode === 'custom' ? (member?.name ?? newCustomer.trim()) : '';
  const shortName = customerName.split(' ').slice(-2).join(' ');
  const generated = autoName(shape) + (mode === 'custom' && shortName ? ` (riêng ${shortName})` : '');
  const finalName = nameEdited ? name : generated;

  const bd = priceBreakdown(shape);
  const finalPrice = price ?? bd.suggested;
  const diff = bd.suggested ? (finalPrice - bd.suggested) / bd.suggested : 0;

  const errors: Record<string, string> = {};
  if (!finalName.trim()) errors.name = 'Nhập tên gói.';
  if (!finalPrice) errors.price = 'Nhập giá bán.';
  if (!shape.access.length && !shape.ptSessions) errors.benefits = 'Gói cần ít nhất một quyền lợi hoặc buổi PT.';
  if (mode === 'custom' && !customerName) errors.customer = 'Chọn hội viên hoặc nhập tên khách.';
  const show = (k: string) => (touched && errors[k] ? <span className="field-err" role="alert">{errors[k]}</span> : null);

  const chooseTemplate = (id: TemplateId) => {
    const d = templateOf(id).defaults;
    setShape(mode === 'custom' ? { ...d, months: shape.months } : d);
    setPrice(null);
  };
  const toggleAccess = (a: Access, on: boolean) => set({ access: on ? [...shape.access, a] : shape.access.filter((x) => x !== a) });
  const toggleExtra = (e: Extra, on: boolean) => set({ extras: on ? [...shape.extras, e] : shape.extras.filter((x) => x !== e) });

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    const data: Omit<Plan, 'id' | 'createdAt'> = {
      ...shape,
      name: finalName.trim(),
      price: finalPrice,
      status: plan?.status ?? 'active',
      // Gói riêng mới: chính khách đặt gói là người đang dùng
      stats: plan?.stats ?? (mode === 'custom' ? { sales: [0, 0, 0, 0, 0, 0], active: 1, renewal: null, checkins: 0, expiring: 0 } : undefined),
      custom:
        mode === 'custom'
          ? {
              customer: customerName,
              memberCode: member?.code,
              phone: member?.phone ?? (newPhone.trim() || undefined),
              note: note.trim() || undefined,
            }
          : undefined,
      listed: mode === 'custom' ? listed : undefined,
    };
    if (plan) {
      updatePlan(plan.id, data);
      onDone(`Đã lưu ${data.name}.`, plan.id);
    } else {
      const created = addPlan(data);
      onDone(mode === 'custom' ? `Đã tạo gói riêng cho ${customerName}.` : `Đã thêm ${created.name} vào danh mục.`, created.id);
    }
  };

  return (
    <div className="ce">
      <div className="ce-head">
        <div>
          <span className="lbl">{mode === 'custom' ? 'Gói theo yêu cầu khách' : 'Gói trong danh mục'}</span>
          <h2 className="ce-title">{plan ? 'Sửa gói tập' : mode === 'custom' ? 'Tạo gói riêng' : 'Tạo gói theo mẫu'}</h2>
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel}>Huỷ</button>
      </div>

      {mode === 'custom' && (
        <section className="ce-sec" aria-labelledby={uid + 'c'}>
          <h3 id={uid + 'c'} className="ce-h3">1 · Khách hàng</h3>
          <label className="field">
            Hội viên
            <select className="inp" value={memberCode} onChange={(e) => setMemberCode(e.target.value)} aria-invalid={touched && !!errors.customer}>
              <option value="">— Khách mới (nhập bên dưới) —</option>
              {MEMBERS.map((m) => (
                <option key={m.code} value={m.code}>{m.name} · {m.code}</option>
              ))}
            </select>
          </label>
          {!memberCode && (
            <div className="ce-row2">
              <label className="field">
                Tên khách
                <input className="inp" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} placeholder="Họ tên" />
              </label>
              <label className="field">
                Số điện thoại
                <input className="inp" type="tel" inputMode="numeric" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="09xx xxx xxx" />
              </label>
            </div>
          )}
          {show('customer')}
          <label className="field">
            Yêu cầu của khách
            <textarea className="inp tc-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: tập buổi sáng, cần PT giảm cân, muốn bảo lưu dài…" />
          </label>
        </section>
      )}

      <section className="ce-sec" aria-labelledby={uid + 't'}>
        <h3 id={uid + 't'} className="ce-h3">{mode === 'custom' ? '2 · Bắt đầu từ mẫu' : '1 · Khuôn khổ gói'}</h3>
        <div className="tpl-opts" role="radiogroup" aria-labelledby={uid + 't'}>
          {TEMPLATES.map((t) => (
            <label key={t.id} className="tpl-opt">
              <input className="sr-only" type="radio" name={uid + 'tpl'} aria-label={t.name} checked={shape.templateId === t.id} onChange={() => chooseTemplate(t.id)} />
              <span className="plan-ic" aria-hidden="true"><Icon name={t.icon} /></span>
              <b>{t.name}</b>
              <span className="muted">{t.desc}</span>
            </label>
          ))}
        </div>
        {!strict && <p className="muted" style={{ fontSize: 12 }}>Gói theo yêu cầu không bị giới hạn bởi khuôn khổ – chỉnh thoải mái bên dưới.</p>}
      </section>

      <section className="ce-sec" aria-labelledby={uid + 'b'}>
        <h3 id={uid + 'b'} className="ce-h3">{mode === 'custom' ? '3' : '2'} · Thời hạn &amp; quyền lợi</h3>
        <div className="field">
          <span id={uid + 'm'}>Thời hạn sử dụng</span>
          <div className="seg seg-wrap" role="radiogroup" aria-labelledby={uid + 'm'}>
            {monthsOpts.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={shape.months === m} className={shape.months === m ? 'on' : ''} onClick={() => { set({ months: m }); setPrice(null); }}>
                {m} th
              </button>
            ))}
          </div>
        </div>

        <fieldset className="pe-checks">
          <legend className="field">Quyền lợi</legend>
          {(Object.keys(ACCESS) as Access[]).map((a) => {
            const required = strict && tpl.required.includes(a);
            return (
              <label key={a} className="check">
                <input type="checkbox" checked={shape.access.includes(a)} disabled={required} onChange={(e) => { toggleAccess(a, e.target.checked); setPrice(null); }} />
                {ACCESS[a].label}
                <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{required ? 'Bắt buộc' : `${vnd(ACCESS[a].monthly)}/th`}</span>
              </label>
            );
          })}
          {(Object.keys(EXTRAS) as Extra[]).map((e) => (
            <label key={e} className="check">
              <input type="checkbox" checked={shape.extras.includes(e)} onChange={(ev) => { toggleExtra(e, ev.target.checked); setPrice(null); }} />
              {EXTRAS[e].label}
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{vnd(EXTRAS[e].monthly)}/th</span>
            </label>
          ))}
          <label className="check">
            <input type="checkbox" checked={shape.offPeak} disabled={strict && shape.templateId === 'offpeak'} onChange={(e) => { set({ offPeak: e.target.checked }); setPrice(null); }} />
            Chỉ giờ thấp điểm (9:00–16:00)
          </label>
        </fieldset>
        {show('benefits')}

        <div className="ce-row2">
          <label className="field">
            Buổi PT
            <select className="inp" value={shape.ptSessions} onChange={(e) => { set({ ptSessions: Number(e.target.value) }); setPrice(null); }}>
              {ptOpts.map((n) => (
                <option key={n} value={n}>{n ? `${n} buổi` : 'Không'}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Bảo lưu tối đa
            <select className="inp" value={shape.freezeDays} onChange={(e) => set({ freezeDays: Number(e.target.value) })}>
              {FREEZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n ? `${n} ngày` : 'Không'}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Giảm khi đặt sân
            <select className="inp" value={shape.courtDiscount} onChange={(e) => set({ courtDiscount: Number(e.target.value) })}>
              {COURT_DISCOUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n ? `${n}%` : 'Không'}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="ce-sec" aria-labelledby={uid + 'p'}>
        <h3 id={uid + 'p'} className="ce-h3">{mode === 'custom' ? '4' : '3'} · Giá &amp; tên gói</h3>
        <ul className="pe-lines">
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
        <label className="field">
          Giá bán (₫)
          <input
            className="inp"
            inputMode="numeric"
            value={finalPrice ? finalPrice.toLocaleString('vi-VN') : ''}
            onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, '').slice(0, 10)) || 0)}
            aria-invalid={touched && !!errors.price}
          />
          {price !== null && price !== bd.suggested && bd.suggested > 0 && (
            <span className="field-hint">
              {diff < 0 ? 'Thấp' : 'Cao'} hơn đề xuất {Math.abs(diff * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% ·{' '}
              <button type="button" className="link-btn" onClick={() => setPrice(null)}>Dùng giá đề xuất</button>
            </span>
          )}
          {show('price')}
        </label>
        <label className="field">
          Tên gói
          <input className="inp" value={finalName} onChange={(e) => { setName(e.target.value); setNameEdited(true); }} aria-invalid={touched && !!errors.name} />
          {nameEdited && (
            <span className="field-hint">
              <button type="button" className="link-btn" onClick={() => { setNameEdited(false); setName(''); }}>Đặt lại tên tự động</button>
            </span>
          )}
          {show('name')}
        </label>
        {mode === 'custom' && (
          <label className="check">
            <input type="checkbox" checked={listed} onChange={(e) => setListed(e.target.checked)} /> Thêm vào danh mục để bán cho khách khác
          </label>
        )}
      </section>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" type="button" style={{ flex: '1 1 160px' }} onClick={save}>
          {plan ? 'Lưu thay đổi' : mode === 'custom' ? 'Tạo gói cho khách' : 'Thêm vào danh mục'}
        </button>
        <button className="btn btn-secondary" type="button" style={{ flex: '1 1 100px' }} onClick={onCancel}>Huỷ</button>
      </div>
    </div>
  );
}
