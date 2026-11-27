import { useId, useState } from 'react';
import { ROLES, STATUS, type Module, type Role, type Staff } from '../lib/staff';
import { useStaff } from '../store/staff';

interface Props {
  staff?: Staff;
  onDone: (message: string, id: string) => void;
  onCancel: () => void;
}

const COMMISSIONS = [0, 0.01, 0.02, 0.03, 0.05, 0.1];
const money = (v: number) => (v ? v.toLocaleString('vi-VN') : '');
const parseMoney = (s: string) => Number(s.replace(/\D/g, '').slice(0, 10)) || 0;

export function StaffEditor({ staff, onDone, onCancel }: Props) {
  const uid = useId();
  const { addStaff, updateStaff } = useStaff();
  const [name, setName] = useState(staff?.name ?? '');
  const [phone, setPhone] = useState(staff?.phone ?? '');
  const [email, setEmail] = useState(staff?.email ?? '');
  const [role, setRole] = useState<Role>(staff?.role ?? 'reception');
  const [type, setType] = useState<Staff['type']>(staff?.type ?? 'full');
  const [status, setStatus] = useState<Staff['status']>(staff?.status ?? 'active');
  const [startDate, setStartDate] = useState(staff?.startDate ?? '2026-10-19');
  const [baseSalary, setBaseSalary] = useState(staff?.baseSalary ?? 7500000);
  const [hourlyRate, setHourlyRate] = useState(staff?.hourlyRate ?? 30000);
  const [ptRate, setPtRate] = useState(staff?.ptRate ?? 0);
  const [commission, setCommission] = useState(staff?.commission ?? 0);
  const [perms, setPerms] = useState<Module[]>(staff?.perms ?? ROLES.reception.perms);
  const [note, setNote] = useState(staff?.note ?? '');
  const [touched, setTouched] = useState(false);

  const teaches = role === 'pt' || role === 'coach';
  const errors: Record<string, string> = {};
  if (!name.trim()) errors.name = 'Nhập họ tên.';
  if (phone.replace(/\D/g, '').length < 9) errors.phone = 'Nhập số điện thoại hợp lệ.';
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Email chưa đúng định dạng.';
  if (type === 'full' && !baseSalary) errors.pay = 'Nhập lương cứng.';
  if (type === 'part' && !hourlyRate) errors.pay = 'Nhập lương theo giờ.';
  const show = (k: string) => (touched && errors[k] ? <span className="field-err" role="alert">{errors[k]}</span> : null);

  const changeRole = (r: Role) => {
    setRole(r);
    setPerms(ROLES[r].perms);
    if (r !== 'pt' && r !== 'coach') setPtRate(0);
    else if (!ptRate) setPtRate(r === 'pt' ? 150000 : 120000);
  };

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    const data: Omit<Staff, 'id' | 'code'> = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      role,
      type,
      status,
      startDate,
      baseSalary: type === 'full' ? baseSalary : 0,
      hourlyRate: type === 'part' ? hourlyRate : 0,
      ptRate: teaches ? ptRate : 0,
      commission,
      perms,
      note: note.trim() || undefined,
      week: staff?.week ?? ['off', 'off', 'off', 'off', 'off', 'off', 'off'],
      stats: staff?.stats ?? { monthShifts: 0 },
    };
    if (staff) {
      updateStaff(staff.id, data);
      onDone(`Đã lưu thông tin ${data.name}.`, staff.id);
    } else {
      const created = addStaff(data);
      onDone(`Đã thêm ${created.name} (${created.code}). Xếp ca cho nhân viên ở tab Lịch ca.`, created.id);
    }
  };

  return (
    <div className="ce">
      <div className="ce-head">
        <div>
          <span className="lbl">{staff ? staff.code : 'Nhân viên mới'}</span>
          <h2 className="ce-title">{staff ? 'Sửa thông tin' : 'Thêm nhân viên'}</h2>
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel}>Huỷ</button>
      </div>

      <section className="ce-sec" aria-labelledby={uid + 'i'}>
        <h3 id={uid + 'i'} className="ce-h3">Thông tin cá nhân</h3>
        <label className="field">
          Họ tên
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Nguyễn Văn An" aria-invalid={touched && !!errors.name} autoFocus={!staff} />
          {show('name')}
        </label>
        <div className="ce-row2">
          <label className="field">
            Số điện thoại
            <input className="inp" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" aria-invalid={touched && !!errors.phone} />
            {show('phone')}
          </label>
          <label className="field">
            Ngày vào làm
            <input className="inp" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
        </div>
        <label className="field">
          Email (tùy chọn)
          <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@arena.vn" aria-invalid={touched && !!errors.email} />
          {show('email')}
        </label>
      </section>

      <section className="ce-sec" aria-labelledby={uid + 'r'}>
        <h3 id={uid + 'r'} className="ce-h3">Công việc</h3>
        <label className="field">
          Vai trò
          <select className="inp" value={role} onChange={(e) => changeRole(e.target.value as Role)}>
            {(Object.keys(ROLES) as Role[]).map((r) => (
              <option key={r} value={r}>{ROLES[r].label}</option>
            ))}
          </select>
        </label>
        <div className="field">
          <span id={uid + 't'}>Hình thức</span>
          <div className="seg" role="radiogroup" aria-labelledby={uid + 't'}>
            {([['full', 'Toàn thời gian'], ['part', 'Bán thời gian']] as [Staff['type'], string][]).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={type === v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <span id={uid + 's'}>Trạng thái</span>
          <div className="seg seg-wrap" role="radiogroup" aria-labelledby={uid + 's'}>
            {(Object.keys(STATUS) as Staff['status'][]).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={status === v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{STATUS[v].label}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="ce-sec" aria-labelledby={uid + 'p'}>
        <h3 id={uid + 'p'} className="ce-h3">Lương &amp; hoa hồng</h3>
        <div className="ce-row2">
          {type === 'full' ? (
            <label className="field">
              Lương cứng / tháng (₫)
              <input className="inp" inputMode="numeric" value={money(baseSalary)} onChange={(e) => setBaseSalary(parseMoney(e.target.value))} aria-invalid={touched && !!errors.pay} />
            </label>
          ) : (
            <label className="field">
              Lương / giờ (₫)
              <input className="inp" inputMode="numeric" value={money(hourlyRate)} onChange={(e) => setHourlyRate(parseMoney(e.target.value))} aria-invalid={touched && !!errors.pay} />
            </label>
          )}
          <label className="field">
            Hoa hồng bán gói
            <select className="inp" value={commission} onChange={(e) => setCommission(Number(e.target.value))}>
              {COMMISSIONS.map((c) => (
                <option key={c} value={c}>{c ? `${c * 100}% doanh thu` : 'Không'}</option>
              ))}
            </select>
          </label>
          {teaches && (
            <label className="field">
              Tiền mỗi buổi PT (₫)
              <input className="inp" inputMode="numeric" value={money(ptRate)} onChange={(e) => setPtRate(parseMoney(e.target.value))} />
            </label>
          )}
        </div>
        {show('pay')}
      </section>

      <label className="field">
        Ghi chú
        <textarea className="inp tc-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: nghỉ phép 15–20/10, chứng chỉ PT quốc tế…" />
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" type="button" style={{ flex: '1 1 160px' }} onClick={save}>{staff ? 'Lưu thay đổi' : 'Thêm nhân viên'}</button>
        <button className="btn btn-secondary" type="button" style={{ flex: '1 1 100px' }} onClick={onCancel}>Huỷ</button>
      </div>
    </div>
  );
}
