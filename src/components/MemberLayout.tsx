import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/app', label: 'Trang chủ', icon: 'home', end: true },
  { to: '/app/dat-san', label: 'Đặt sân', icon: 'calendar' },
  { to: '/app/lop-hoc', label: 'Lớp học', icon: 'dumbbell' },
  { to: '/app/tai-khoan', label: 'Tài khoản', icon: 'person' },
];

/** Các màn có thanh hành động riêng ở đáy thì ẩn tab bar (giống thiết kế) */
const NO_TABBAR = ['/app/dat-san', '/app/thanh-toan'];

export default function MemberLayout() {
  const { pathname } = useLocation();
  const showTabs = !NO_TABBAR.includes(pathname);
  return (
    <div className="m-shell">
      <Outlet />
      {showTabs && (
        <nav className="tabbar" aria-label="Thanh điều hướng">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => 'tabi' + (isActive ? ' active' : '')}>
              <Icon name={t.icon} className="ic-lg" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
