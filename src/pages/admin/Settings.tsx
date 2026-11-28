// Màn "Cài đặt": bố cục 2 cột — menu mục bên trái, nội dung bên phải.
// Gồm thông tin cơ sở, tài khoản quản trị (mỗi cơ sở 1 tài khoản), giờ hoạt động,
// chính sách giá & ưu đãi, thông báo. Lưu trên trình duyệt (chưa có backend).
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { DEFAULT_SLOTS, toHour, type PlaySlot } from '../../lib/playSlots';
import { DEFAULT_MODES, type BookingModes } from '../../lib/bookingModes';

const KEY = 'arena-settings';

interface Settings {
  orgName: string;
  branch: string;
  address: string;
  hotline: string;
  email: string;
  adminEmail: string;
  adminName: string;
  openTime: string;
  closeTime: string;
  offpeakFrom: string;
  offpeakTo: string;
  nExpiring: boolean;
  nShiftGap: boolean;
  nDailyRevenue: boolean;
  nPlanFull: boolean;
  slots: PlaySlot[];
  booking: BookingModes;
}

const DEFAULTS: Settings = {
  orgName: 'Arena Sport Center',
  branch: 'Chi nhánh Quận 7',
  address: '123 Nguyễn Thị Thập, P. Tân Phú, Quận 7, TP.HCM',
  hotline: '1900 1234',
  email: 'lienhe@arena.vn',
  adminEmail: 'admin@arena.vn',
  adminName: 'Phạm Quang Huy',
  openTime: '06:00',
  closeTime: '23:00',
  offpeakFrom: '09:00',
  offpeakTo: '16:00',
  nExpiring: true,
  nShiftGap: true,
  nDailyRevenue: true,
  nPlanFull: false,
  slots: DEFAULT_SLOTS,
  booking: DEFAULT_MODES,
};

type SectionId = 'org' | 'account' | 'hours' | 'slots' | 'modes' | 'notify';
const SECTIONS: { id: SectionId; label: string; icon: IconName; desc: string }[] = [
  { id: 'org', label: 'Thông tin cơ sở', icon: 'idcard', desc: 'Tên, địa chỉ và liên hệ hiển thị cho hội viên.' },
  { id: 'account', label: 'Tài khoản quản trị', icon: 'lock', desc: 'Mỗi cơ sở chỉ có một tài khoản quản trị. Nhân viên không có tài khoản đăng nhập riêng.' },
  { id: 'hours', label: 'Giờ hoạt động', icon: 'timer', desc: 'Giờ mở cửa và khung giờ thấp điểm dùng để tính ưu đãi gói.' },
  { id: 'slots', label: 'Khung giờ chơi', icon: 'calendar', desc: 'Các khung giờ để xem nhanh trạng thái sân (vd. Chiều, Tối, Khuya).' },
  { id: 'modes', label: 'Chế độ đặt sân', icon: 'card', desc: 'Giá dùng chung cho vé lượt và pickup. Bật/tắt theo từng sân ở màn Lịch đặt sân.' },
  { id: 'notify', label: 'Thông báo', icon: 'bell', desc: 'Chọn những cảnh báo gửi tới quản trị.' },
];

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Settings>;
      if (v && typeof v === 'object') return { ...DEFAULTS, ...v };
    }
  } catch {
    /* dữ liệu hỏng – dùng mặc định */
  }
  return DEFAULTS;
}

export default function Settings() {
  const [saved, setSaved] = useState<Settings>(load);
  const [form, setForm] = useState<Settings>(saved);
  const [notice, setNotice] = useState<string | null>(null);
  const [active, setActive] = useState<SectionId>('org');

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  const up = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm((f) => ({ ...f, [k]: v }));
  const updateSlot = (i: number, patch: Partial<PlaySlot>) => setForm((f) => ({ ...f, slots: f.slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const addSlot = () => setForm((f) => ({ ...f, slots: [...f.slots, { id: 'slot-' + Date.now(), name: 'Khung mới', from: '06:00', to: '09:00' }] }));
  const removeSlot = (i: number) => setForm((f) => ({ ...f, slots: f.slots.filter((_, idx) => idx !== i) }));
  const digits = (s: string) => Number(s.replace(/\D/g, '').slice(0, 9)) || 0;
  const bk = (patch: Partial<BookingModes>) => setForm((f) => ({ ...f, booking: { ...f.booking, ...patch } }));
  // Không cho khung giờ trùng nhau (và giờ kết thúc phải sau giờ bắt đầu)
  const slotIssues = useMemo(() => {
    const out: Record<number, string> = {};
    const r = form.slots.map((s) => ({ f: toHour(s.from), t: toHour(s.to) }));
    r.forEach((a, i) => {
      if (a.t <= a.f) out[i] = 'Giờ kết thúc phải sau giờ bắt đầu.';
    });
    for (let i = 0; i < r.length; i++)
      for (let j = i + 1; j < r.length; j++)
        if (r[i].f < r[j].t && r[j].f < r[i].t) {
          out[i] = out[i] ?? `Trùng giờ với khung "${form.slots[j].name}".`;
          out[j] = out[j] ?? `Trùng giờ với khung "${form.slots[i].name}".`;
        }
    return out;
  }, [form.slots]);
  const slotsOk = Object.keys(slotIssues).length === 0;

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const save = () => {
    if (!slotsOk) {
      setActive('slots');
      setNotice('Khung giờ bị trùng – sửa lại trước khi lưu.');
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(form));
    } catch {
      /* không lưu được – vẫn giữ trong phiên này */
    }
    setSaved(form);
    setNotice('Đã lưu cài đặt.');
  };
  const reset = () => {
    setForm(saved);
    setNotice(null);
  };

  const meta = SECTIONS.find((s) => s.id === active)!;

  return (
    <>
      <header className="page-head">
        <div className="grow">
          <h1 className="page-title">Cài đặt</h1>
          <p className="page-sub">Thông tin cơ sở, tài khoản quản trị và chính sách vận hành</p>
        </div>
        {!slotsOk && <span className="set-dirty set-err">Khung giờ trùng</span>}
        {dirty && <span className="set-dirty">Chưa lưu</span>}
        {dirty && (
          <button className="btn btn-secondary" type="button" onClick={reset}>Hoàn tác</button>
        )}
        <button className="btn btn-primary" type="button" onClick={save} disabled={!dirty || !slotsOk}>
          <Icon name="check" /> Lưu thay đổi
        </button>
      </header>

      {notice && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{notice}</span>
        </div>
      )}

      <div className="set-layout">
        <nav className="set-nav" aria-label="Nhóm cài đặt">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" className={'set-nav-btn' + (active === s.id ? ' on' : '')} aria-current={active === s.id} onClick={() => setActive(s.id)}>
              <Icon name={s.icon} size={18} />
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <section className="card set-card" aria-label={meta.label}>
          <div className="set-head">
            <span className="plan-ic" aria-hidden="true"><Icon name={meta.icon} /></span>
            <div>
              <h2 className="card-title">{meta.label}</h2>
              <p className="muted" style={{ fontSize: 13 }}>{meta.desc}</p>
            </div>
          </div>

          {active === 'org' && (
            <Body>
              <div className="tc-grid">
                <Field label="Tên cơ sở" value={form.orgName} onChange={(v) => up('orgName', v)} />
                <Field label="Chi nhánh" value={form.branch} onChange={(v) => up('branch', v)} />
              </div>
              <Field label="Địa chỉ" value={form.address} onChange={(v) => up('address', v)} />
              <div className="tc-grid">
                <Field label="Hotline" type="tel" value={form.hotline} onChange={(v) => up('hotline', v)} />
                <Field label="Email liên hệ" type="email" value={form.email} onChange={(v) => up('email', v)} />
              </div>
            </Body>
          )}

          {active === 'account' && (
            <Body>
              <div className="tc-grid">
                <Field label="Email đăng nhập" type="email" value={form.adminEmail} onChange={(v) => up('adminEmail', v)} />
                <Field label="Tên người quản trị" value={form.adminName} onChange={(v) => up('adminName', v)} />
              </div>
              <div className="set-inline">
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => setNotice('Đã gửi liên kết đặt lại mật khẩu tới email quản trị.')}>
                  <Icon name="renew" size={15} /> Đổi mật khẩu
                </button>
                <span className="muted" style={{ fontSize: 12 }}>Gửi liên kết đặt lại mật khẩu qua email quản trị.</span>
              </div>
            </Body>
          )}

          {active === 'hours' && (
            <Body>
              <div className="tc-grid">
                <label className="field">
                  Giờ mở cửa
                  <input className="inp" type="time" value={form.openTime} onChange={(e) => up('openTime', e.target.value)} />
                </label>
                <label className="field">
                  Giờ đóng cửa
                  <input className="inp" type="time" value={form.closeTime} onChange={(e) => up('closeTime', e.target.value)} />
                </label>
              </div>
              <div className="field">
                <span>Khung giờ thấp điểm</span>
                <div className="set-range">
                  <input className="inp" type="time" value={form.offpeakFrom} onChange={(e) => up('offpeakFrom', e.target.value)} aria-label="Giờ thấp điểm bắt đầu" />
                  <span className="muted">đến</span>
                  <input className="inp" type="time" value={form.offpeakTo} onChange={(e) => up('offpeakTo', e.target.value)} aria-label="Giờ thấp điểm kết thúc" />
                </div>
                <span className="field-hint">Gói "chỉ giờ thấp điểm" chỉ nhận tập trong khung này.</span>
              </div>
            </Body>
          )}

          {active === 'slots' && (
            <Body>
              <div className="slot-list">
                {form.slots.map((s, i) => (
                  <div key={s.id} className="slot-item">
                    <div className="slot-row">
                    <input className="inp" value={s.name} onChange={(e) => updateSlot(i, { name: e.target.value })} placeholder="Tên khung" aria-label="Tên khung giờ" />
                    <input className="inp" type="time" value={s.from} onChange={(e) => updateSlot(i, { from: e.target.value })} aria-label="Từ giờ" />
                    <span className="muted">đến</span>
                    <input className="inp" type="time" value={s.to} onChange={(e) => updateSlot(i, { to: e.target.value })} aria-label="Đến giờ" />
                    <button className="btn btn-ghost btn-icon" type="button" onClick={() => removeSlot(i)} disabled={form.slots.length <= 1} aria-label={`Xoá khung ${s.name}`}>
                      <Icon name="trash" size={16} />
                    </button>
                    </div>
                    {slotIssues[i] && <span className="field-err" role="alert">{slotIssues[i]}</span>}
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={addSlot}><Icon name="plus" size={15} /> Thêm khung giờ</button>
              <p className="muted" style={{ fontSize: 12 }}>Các khung này hiện ở màn Trạng thái sân để xem nhanh trạng thái sân theo từng khung giờ.</p>
            </Body>
          )}

          {active === 'modes' && (
            <Body>
              <div className="mode-fixed">
                <b>Đặt nguyên sân</b>
                <span className="muted">Luôn bật – đặt cả sân theo giờ với giá sân.</span>
              </div>
              <div className="mode-block">
                <div className="sw-txt" style={{ marginBottom: 4 }}>
                  <b>Vé lượt (xé vé)</b>
                  <span>Bán vé vào chơi theo lượt, tính theo số người.</span>
                </div>
                <div className="tc-grid mode-opts">
                  <label className="field">
                    Giá vé / người (₫)
                    <input className="inp" inputMode="numeric" value={form.booking.ticketPrice.toLocaleString('vi-VN')} onChange={(e) => bk({ ticketPrice: digits(e.target.value) })} aria-label="Giá vé mỗi người" />
                  </label>
                </div>
              </div>
              <div className="mode-block">
                <div className="sw-txt" style={{ marginBottom: 4 }}>
                  <b>Pickup (ghép trận)</b>
                  <span>Mở trận chung sân, người chơi lẻ đăng ký cho đủ sức chứa.</span>
                </div>
                <div className="tc-grid mode-opts">
                  <label className="field">
                    Sức chứa mặc định / trận (người)
                    <input className="inp" inputMode="numeric" value={form.booking.pickupCap} onChange={(e) => bk({ pickupCap: Math.max(2, Math.min(50, digits(e.target.value))) })} aria-label="Sức chứa mỗi trận" />
                  </label>
                  <label className="field">
                    Giá / người (₫)
                    <input className="inp" inputMode="numeric" value={form.booking.pickupPrice.toLocaleString('vi-VN')} onChange={(e) => bk({ pickupPrice: digits(e.target.value) })} aria-label="Giá mỗi người" />
                  </label>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 12 }}>
                Chọn sân nào cho phép vé lượt / pickup ngay tại màn <b>Lịch đặt sân → Tùy chỉnh sân</b>.
              </p>
            </Body>
          )}

          {active === 'notify' && (
            <Body>
              <div className="sw-list">
                <Switch label="Hội viên sắp hết hạn" hint="Nhắc 14 ngày trước khi gói hết hạn." on={form.nExpiring} onChange={(v) => up('nExpiring', v)} />
                <Switch label="Ca trực thiếu lễ tân" hint="Cảnh báo khi có ca trong tuần chưa xếp lễ tân." on={form.nShiftGap} onChange={(v) => up('nShiftGap', v)} />
                <Switch label="Chốt doanh thu cuối ngày" hint="Gửi tổng kết doanh thu lúc đóng cửa." on={form.nDailyRevenue} onChange={(v) => up('nDailyRevenue', v)} />
                <Switch label="Gói sắp hết chỗ" hint="Báo khi lớp hoặc gói giới hạn gần đầy." on={form.nPlanFull} onChange={(v) => up('nPlanFull', v)} />
              </div>
            </Body>
          )}
        </section>
      </div>
    </>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <div className="set-body">{children}</div>;
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="field">
      {label}
      <input className="inp" type={type} inputMode={type === 'tel' ? 'tel' : undefined} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Switch({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="sw-row">
      <span className="sw-txt">
        <b>{label}</b>
        <span>{hint}</span>
      </span>
      <span className="sw">
        <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
        <span className="track" aria-hidden="true" />
      </span>
    </label>
  );
}
