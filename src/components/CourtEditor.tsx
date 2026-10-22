import { useId, useState, type FormEvent } from 'react';
import { SPORTS, type Court, type Sport } from '../data/mock';
import { hh, vnd } from '../lib/format';
import { VIEW_MAX_HOUR, VIEW_MIN_HOUR, type ScheduleView } from '../lib/scheduleView';
import { useCourts } from '../store/courts';
import { Icon } from './Icon';
import { SportBadge, sportLabel } from './SportIcon';

interface Props {
  editId: string | null;
  setEditId: (id: string | null) => void;
  view: ScheduleView;
  setView: (patch: Partial<ScheduleView>) => void;
  /** Số lượt đặt hôm nay của một sân – sân có lượt thì không cho xoá */
  bookingCount: (courtId: string) => number;
  onDone: () => void;
}

export function CourtEditor({ editId, setEditId, view, setView, bookingCount, onDone }: Props) {
  const { courts, isCustomized, addCourt, updateCourt, removeCourt, moveCourt, resetCourts } = useCourts();
  const [adding, setAdding] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const densityId = useId();

  const namesExcept = (id: string | null) => courts.filter((c) => c.id !== id).map((c) => c.name.trim().toLowerCase());

  return (
    <div className="ce">
      <div className="ce-head">
        <div>
          <span className="lbl">Tùy chỉnh sân</span>
          <h2 className="ce-title">Sân &amp; lịch hiển thị</h2>
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={onDone}>Xong</button>
      </div>

      {msg && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{msg}</span>
        </div>
      )}

      <section className="ce-sec" aria-labelledby="ce-view">
        <h3 id="ce-view" className="ce-h3">Hiển thị trên lịch</h3>
        <div className="ce-row2">
          <label className="field">
            Mở cửa
            <select className="inp" value={view.from} onChange={(e) => setView({ from: Number(e.target.value) })}>
              {range(VIEW_MIN_HOUR, view.to - 2).map((h) => (
                <option key={h} value={h}>{hh(h)}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Đóng cửa
            <select className="inp" value={view.to} onChange={(e) => setView({ to: Number(e.target.value) })}>
              {range(view.from + 2, VIEW_MAX_HOUR).map((h) => (
                <option key={h} value={h}>{h === 24 ? '24:00' : hh(h)}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={view.showPrice} onChange={(e) => setView({ showPrice: e.target.checked })} /> Hiện giá thuê dưới tên sân
        </label>
        <div className="field">
          <span id={densityId}>Mật độ lịch</span>
          <div className="seg" role="radiogroup" aria-labelledby={densityId}>
            {[
              { v: false, label: 'Thoáng' },
              { v: true, label: 'Gọn' },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={view.dense === o.v}
                className={view.dense === o.v ? 'on' : ''}
                onClick={() => setView({ dense: o.v })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ce-sec" aria-labelledby="ce-courts">
        <h3 id="ce-courts" className="ce-h3">Danh sách sân ({courts.length})</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: -6 }}>Bấm vào sân để sửa. Thứ tự ở đây là thứ tự hàng trên lịch.</p>
        <ul className="ce-list">
          {courts.map((c, i) => {
            const open = editId === c.id;
            return (
              <li key={c.id} className={'ce-item' + (open ? ' open' : '') + (c.hidden ? ' is-hidden' : '')}>
                <div className="ce-item-row">
                  <SportBadge sport={c.sport} size={32} />
                  <button
                    type="button"
                    className="ce-item-main"
                    aria-expanded={open}
                    aria-label={`Sửa ${c.name}, ${sportLabel(c.sport)}, ${vnd(c.price)} mỗi giờ${c.hidden ? ', đang ẩn' : ''}${c.locked ? ', tạm ngừng' : ''}`}
                    onClick={() => { setAdding(false); setEditId(open ? null : c.id); }}
                  >
                    <span className="ce-item-name">{c.name}</span>
                    <span className="ce-item-sub">{sportLabel(c.sport)} · {vnd(c.price)}/giờ</span>
                    {(c.hidden || c.locked) && (
                      <span className="ce-flags">
                        {c.hidden && <span className="badge plain b-neutral">Đang ẩn</span>}
                        {c.locked && <span className="badge plain b-warning">Tạm ngừng</span>}
                      </span>
                    )}
                  </button>
                  <div className="ce-move">
                    <button className="icon-btn" type="button" aria-label={`Đưa ${c.name} lên trên`} disabled={i === 0} onClick={() => moveCourt(c.id, -1)}>
                      <Icon name="arrowUp" size={16} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Đưa ${c.name} xuống dưới`} disabled={i === courts.length - 1} onClick={() => moveCourt(c.id, 1)}>
                      <Icon name="arrowDown" size={16} />
                    </button>
                  </div>
                </div>
                {open && (
                  <CourtForm
                    key={c.id}
                    initial={c}
                    takenNames={namesExcept(c.id)}
                    bookings={bookingCount(c.id)}
                    onCancel={() => setEditId(null)}
                    onSave={(v) => {
                      updateCourt(c.id, v);
                      setEditId(null);
                      setMsg(`Đã lưu ${v.name}.`);
                    }}
                    onDelete={() => {
                      removeCourt(c.id);
                      setEditId(null);
                      setMsg(`Đã xoá ${c.name}.`);
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {adding ? (
          <div className="ce-item open">
            <div className="ce-item-row">
              <span className="ce-item-name" style={{ padding: '6px 2px' }}>Sân mới</span>
            </div>
            <CourtForm
              initial={{ name: '', kind: '', mobileKind: '', sport: 'cl', price: 150000 }}
              takenNames={namesExcept(null)}
              bookings={0}
              onCancel={() => setAdding(false)}
              onSave={(v) => {
                const created = addCourt(v);
                setAdding(false);
                setMsg(`Đã thêm ${created.name} vào cuối danh sách.`);
              }}
            />
          </div>
        ) : (
          <button className="btn btn-secondary btn-block" type="button" onClick={() => { setAdding(true); setEditId(null); }}>
            <Icon name="plus" /> Thêm sân
          </button>
        )}
      </section>

      <div className="ce-foot">
        {isCustomized ? (
          confirmReset ? (
            <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span>Khôi phục 6 sân mặc định? Sân đã thêm và mọi chỉnh sửa sẽ mất.</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger btn-sm" type="button" onClick={() => { resetCourts(); setEditId(null); setConfirmReset(false); setMsg('Đã khôi phục danh sách sân mặc định.'); }}>
                  Khôi phục
                </button>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => setConfirmReset(false)}>Huỷ</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" type="button" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => setConfirmReset(true)}>
              Khôi phục danh sách mặc định
            </button>
          )
        ) : (
          <span className="muted">Đang dùng danh sách sân mặc định.</span>
        )}
        <span className="muted">Cấu hình được lưu trên trình duyệt này.</span>
      </div>
    </div>
  );
}

type CourtDraft = Omit<Court, 'id'>;

function CourtForm({
  initial,
  takenNames,
  bookings,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: CourtDraft;
  takenNames: string[];
  bookings: number;
  onSave: (v: CourtDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const uid = useId();
  const [name, setName] = useState(initial.name);
  const [sport, setSport] = useState<Sport>(initial.sport);
  const [kind, setKind] = useState(initial.kind);
  const [price, setPrice] = useState(initial.price ? String(initial.price) : '');
  const [hidden, setHidden] = useState(!!initial.hidden);
  const [locked, setLocked] = useState(!!initial.locked);
  const [touched, setTouched] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const priceNum = Number(price.replace(/\D/g, ''));
  const nameErr = !name.trim() ? 'Nhập tên sân.' : takenNames.includes(name.trim().toLowerCase()) ? 'Đã có sân trùng tên.' : null;
  const priceErr = !priceNum ? 'Nhập giá thuê mỗi giờ.' : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameErr || priceErr) return;
    const k = kind.trim();
    onSave({
      name: name.trim(),
      sport,
      kind: k,
      mobileKind: k === initial.kind ? initial.mobileKind || k : k,
      price: priceNum,
      hidden: hidden || undefined,
      locked: locked || undefined,
    });
  };

  return (
    <form className="ce-form" onSubmit={submit} noValidate>
      <label className="field">
        Tên sân
        <input
          className="inp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Cầu lông 3"
          aria-invalid={touched && !!nameErr}
          aria-describedby={touched && nameErr ? uid + 'n' : undefined}
          autoFocus={!initial.name}
        />
        {touched && nameErr && <span id={uid + 'n'} className="field-err">{nameErr}</span>}
      </label>

      <fieldset className="sport-opts">
        <legend className="field" style={{ marginBottom: 6 }}>Môn thể thao</legend>
        {SPORTS.map((s) => (
          <label key={s.id} className="sport-opt">
            <input className="sr-only" type="radio" name={uid + 'sport'} value={s.id} aria-label={s.label} checked={sport === s.id} onChange={() => setSport(s.id)} />
            <SportBadge sport={s.id} size={28} />
            {s.short}
          </label>
        ))}
      </fieldset>

      <label className="field">
        Mặt sân / mô tả
        <input className="inp" value={kind} onChange={(e) => setKind(e.target.value)} placeholder="VD: Thảm PVC, trong nhà" />
      </label>

      <label className="field">
        Giá thuê mỗi giờ (₫)
        <input
          className="inp"
          inputMode="numeric"
          value={price ? Number(price.replace(/\D/g, '') || 0).toLocaleString('vi-VN') : ''}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder="150.000"
          aria-invalid={touched && !!priceErr}
          aria-describedby={touched && priceErr ? uid + 'p' : undefined}
        />
        {touched && priceErr && <span id={uid + 'p'} className="field-err">{priceErr}</span>}
      </label>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label className="check">
          <input type="checkbox" checked={!hidden} onChange={(e) => setHidden(!e.target.checked)} /> Hiện trên lịch &amp; app hội viên
        </label>
        <label className="check">
          <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} /> Tạm ngừng nhận đặt (bảo trì)
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" type="submit" style={{ flex: '1 1 100px' }}>{onDelete ? 'Lưu' : 'Thêm sân'}</button>
        <button className="btn btn-secondary" type="button" style={{ flex: '1 1 100px' }} onClick={onCancel}>Huỷ</button>
      </div>

      {onDelete &&
        (bookings > 0 ? (
          <p className="muted" style={{ fontSize: 12 }}>
            Sân đang có {bookings} lượt đặt hôm nay nên chưa xoá được – hãy ẩn hoặc tạm ngừng sân thay vì xoá.
          </p>
        ) : confirmDel ? (
          <div role="alert" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
            <span style={{ flex: '1 1 100%' }}>Xoá hẳn {initial.name}? Không hoàn tác được.</span>
            <button className="btn btn-danger btn-sm" type="button" onClick={onDelete}>Xoá sân</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setConfirmDel(false)}>Giữ lại</button>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm ce-del" type="button" onClick={() => setConfirmDel(true)}>
            <Icon name="trash" size={16} /> Xoá sân
          </button>
        ))}
    </form>
  );
}

function range(a: number, b: number) {
  return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
}
