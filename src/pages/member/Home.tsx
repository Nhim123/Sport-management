import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { CURRENT_MEMBER_CODE, MEMBERS } from '../../data/mock';

export default function MemberHome() {
  const me = MEMBERS.find((m) => m.code === CURRENT_MEMBER_CODE)!;
  const firstName = me.name.split(' ').slice(-2).join(' ');

  return (
    <div className="m-body">
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Chào buổi tối,</div>
          <div style={{ fontSize: 22, lineHeight: '28px', fontWeight: 700 }}>{firstName}</div>
        </div>
        <button type="button" className="icon-round" aria-label="Thông báo, 2 mới">
          <Icon name="bell" className="ic-lg" />
          <span className="dot" aria-hidden="true" />
        </button>
      </header>

      <section aria-label="Thẻ hội viên" className="pass">
        <svg className="pass-court" aria-hidden="true" viewBox="0 0 200 140">
          <rect x="10" y="10" width="180" height="120" fill="none" stroke="var(--pass-line)" strokeWidth="2" />
          <line x1="100" y1="10" x2="100" y2="130" stroke="var(--pass-line)" strokeWidth="2" />
          <circle cx="100" cy="70" r="24" fill="none" stroke="var(--pass-line)" strokeWidth="2" />
        </svg>
        <div style={{ position: 'relative' }}>
          <div className="lbl" style={{ color: 'var(--pass-muted)' }}>{me.plan}</div>
          <div className="num" style={{ fontSize: 44, lineHeight: '48px', fontWeight: 700, marginTop: 6 }}>
            138 <span style={{ fontSize: 20, fontWeight: 600 }}>ngày còn lại</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--pass-muted)' }}>Hạn đến 05/03/2027 · PT còn {me.pt?.left} buổi</div>
        </div>
        <div className="pass-track" role="img" aria-label={`Đã dùng ${me.usedPct}% thời hạn gói`}>
          <div style={{ width: `${me.usedPct}%` }} />
        </div>
        <button type="button" className="pass-cta">
          <Icon name="qr" className="ic-lg" />
          Mã QR check-in
        </button>
      </section>

      <nav aria-label="Lối tắt" className="qa-grid">
        <Link className="qa" to="/app/dat-san"><span><Icon name="calendar" className="ic-lg" /></span>Đặt sân</Link>
        <Link className="qa" to="/app/lop-hoc"><span className="clay"><Icon name="dumbbell" className="ic-lg" /></span>Lớp học</Link>
        <Link className="qa" to="/app/lich-pt"><span className="clay"><Icon name="coach" className="ic-lg" /></span>Lịch PT</Link>
        <Link className="qa" to="/app/gia-han"><span><Icon name="renew" className="ic-lg" /></span>Gia hạn</Link>
      </nav>

      <section>
        <div className="line" style={{ alignItems: 'baseline', marginBottom: 10 }}>
          <h2 className="m-h2">Lịch của tôi</h2>
          <Link to="/app/lich" style={{ fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Xem tất cả</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="m-card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="date-chip" style={{ background: 'var(--brand-tint)', color: 'var(--brand-ink)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, lineHeight: '14px' }}>HÔM NAY</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, lineHeight: '24px' }}>19:00</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>Cầu lông 2 · 1 giờ</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Mã ĐS-7731 · đã thanh toán</div>
            </div>
            <span className="badge plain b-volt" style={{ height: 22, fontSize: 11 }}>Sắp tới</span>
          </div>
          <div className="m-card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="date-chip" style={{ background: 'var(--clay-tint)', color: 'var(--clay-ink)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, lineHeight: '14px' }}>T3 20/10</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, lineHeight: '24px' }}>06:30</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>PT với HLV Khoa</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Buổi 18/24 · Thân dưới</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="m-h2" style={{ marginBottom: 10 }}>Lớp học tối nay</h2>
        <div className="h-scroll">
          <div className="m-card" style={{ flex: 'none', width: 160 }}>
            <div className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--clay)' }}>19:30</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>HIIT 45 phút</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>HLV Khoa · còn 5 chỗ</div>
          </div>
          <div className="m-card" style={{ flex: 'none', width: 160 }}>
            <div className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--clay)' }}>19:00</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>Vinyasa Flow</div>
            <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>Hết chỗ · danh sách chờ</div>
          </div>
          <div className="m-card" style={{ flex: 'none', width: 160 }}>
            <div className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--clay)' }}>17:30</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>Hatha Yoga</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>HLV Mai · còn 6 chỗ</div>
          </div>
        </div>
      </section>
    </div>
  );
}
