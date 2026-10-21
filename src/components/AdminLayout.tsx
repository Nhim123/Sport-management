import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { CURRENT_STAFF } from '../data/mock';
import { currentTheme, setTheme, type Theme } from '../lib/theme';
import { Icon, type IconName } from './Icon';

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Tổng quan', icon: 'home', end: true },
  { to: '/lich-dat-san', label: 'Lịch đặt sân', icon: 'calendar' },
  { to: '/trang-thai-san', label: 'Trạng thái sân', icon: 'activity' },
  { to: '/hoi-vien', label: 'Hội viên', icon: 'users' },
  { to: '/lop-hoc', label: 'Lớp học & PT', icon: 'dumbbell' },
  { to: '/goi-tap', label: 'Gói tập', icon: 'tag' },
  { to: '/thanh-toan', label: 'Thanh toán', icon: 'card' },
  { to: '/bao-cao', label: 'Báo cáo', icon: 'chart' },
  { to: '/cai-dat', label: 'Cài đặt', icon: 'settings' },
];

export function ThemeToggle() {
  const [theme, setT] = useState<Theme>(currentTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="theme-btn"
      aria-label={next === 'dark' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
      onClick={() => {
        setTheme(next);
        setT(next);
      }}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

export default function AdminLayout() {
  return (
    <div className="admin">
      <nav className="sidebar" aria-label="Điều hướng chính">
        <Link to="/" className="brand" aria-label="Arena – Tổng quan">
          <span className="brand-word">ARENA</span>
          <span className="brand-dot" aria-hidden="true" />
        </Link>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'nav' + (isActive ? ' active' : '')}>
            <Icon name={n.icon} />
            {n.label}
          </NavLink>
        ))}
        <div className="sidebar-foot">
          <span className="avatar who" style={{ width: 36, height: 36 }} aria-hidden="true">
            {CURRENT_STAFF.ini}
          </span>
          <div className="who">
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px' }}>{CURRENT_STAFF.name}</div>
            <div style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-muted)' }}>{CURRENT_STAFF.role}</div>
          </div>
          <ThemeToggle />
        </div>
      </nav>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
