import { useEffect, useMemo, useState } from 'react';
import { hh, vnd } from '../lib/format';
import { useBookings } from '../store/bookings';
import { useCourts } from '../store/courts';
import { Icon } from './Icon';

/**
 * Khu "Thông báo" của chủ sân.
 * App hội viên không thu hộ tiền: khách báo đã chuyển khoản → tạo đơn `awaitingConfirm`.
 * Chủ sân xem thông báo và xác nhận "đã nhận được tiền" thì đơn mới chuyển sang Đã đặt.
 */
export function NotificationCenter() {
  const { bookings, updateBooking, removeBooking } = useBookings();
  const { courts } = useCourts();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const requests = useMemo(() => bookings.filter((b) => b.awaitingConfirm), [bookings]);
  const count = requests.length;
  const courtName = (id: string) => courts.find((c) => c.id === id)?.name ?? id;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const confirm = (id: string, name: string, amount?: number) => {
    updateBooking(id, {
      state: 'booked',
      awaitingConfirm: false,
      sub: amount ? `Đã nhận ${vnd(amount)} · app` : 'Đã nhận tiền · app',
    });
    setDone(`Đã xác nhận nhận tiền của ${name}.`);
  };

  const reject = (id: string, name: string) => {
    removeBooking(id);
    setDone(`Đã từ chối & huỷ đơn của ${name}. Khung giờ được mở lại.`);
  };

  return (
    <>
      <button
        type="button"
        className={'nav notif-trigger' + (open ? ' active' : '')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setOpen((v) => !v); setDone(null); }}
      >
        <span className="notif-ic">
          <Icon name="bell" />
          {count > 0 && <span className="notif-badge" aria-hidden="true">{count}</span>}
        </span>
        Thông báo
        {count > 0 && <span className="notif-count-txt">{count} chờ xác nhận</span>}
      </button>

      {open && (
        <>
          <div className="notif-backdrop" onMouseDown={() => setOpen(false)} />
          <aside className="notif-panel" role="dialog" aria-label="Thông báo xác nhận thanh toán" onMouseDown={(e) => e.stopPropagation()}>
            <header className="notif-head">
              <div>
                <span className="lbl">Thông báo</span>
                <h2 className="notif-title">Xác nhận đã nhận tiền</h2>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Đóng" onClick={() => setOpen(false)}>
                <Icon name="chevronRight" />
              </button>
            </header>

            {done && (
              <div className="toast" role="status" style={{ margin: '0 16px' }}>
                <Icon name="check" />
                <span>{done}</span>
              </div>
            )}

            <p className="notif-note">
              Khách chuyển khoản thẳng cho cơ sở qua app. Chỉ xác nhận khi bạn <b>đã thực sự nhận được tiền</b>; đơn sẽ chuyển sang <b>Đã đặt</b>.
            </p>

            {count === 0 ? (
              <div className="notif-empty">
                <Icon name="check" size={28} />
                <p>Không có yêu cầu nào đang chờ xác nhận.</p>
              </div>
            ) : (
              <ul className="notif-list">
                {requests.map((b) => (
                  <li key={b.id} className="notif-card">
                    <div className="notif-card-top">
                      <span className="notif-dot" aria-hidden="true"><Icon name="qr" size={18} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b className="notif-name">{b.label}</b>
                        <span className="notif-meta">{courtName(b.courtId)} · {hh(b.start)}–{hh(b.start + b.span)}</span>
                      </div>
                    </div>
                    <div className="notif-amt">
                      <span className="muted">Khách báo đã trả {b.payMethod ? `· ${b.payMethod}` : ''}</span>
                      <span className="num">{b.payAmount ? vnd(b.payAmount) : '—'}</span>
                    </div>
                    <div className="notif-actions">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => confirm(b.id, b.label, b.payAmount)}>
                        <Icon name="check" size={15} /> Đã nhận tiền
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm notif-reject" onClick={() => reject(b.id, b.label)}>
                        Từ chối
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </>
      )}
    </>
  );
}
