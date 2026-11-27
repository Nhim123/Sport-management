import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import MemberLayout from './components/MemberLayout';
import Bookings from './pages/admin/Bookings';
import CourtStatus from './pages/admin/CourtStatus';
import Dashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import PlanCreate from './pages/admin/PlanCreate';
import Plans from './pages/admin/Plans';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import StaffPage from './pages/admin/Staff';
import TournamentCreate from './pages/admin/TournamentCreate';
import TournamentDetail from './pages/admin/TournamentDetail';
import Tournaments from './pages/admin/Tournaments';
import MemberBooking from './pages/member/Booking';
import MemberCheckout from './pages/member/Checkout';
import MemberHome from './pages/member/Home';
import Placeholder from './pages/Placeholder';
import { BookingProvider } from './store/bookings';
import { CourtsProvider } from './store/courts';
import { PlanProvider } from './store/plans';
import { StaffProvider } from './store/staff';
import { TournamentProvider } from './store/tournaments';

export default function App() {
  return (
    <CourtsProvider>
    <BookingProvider>
    <TournamentProvider>
    <PlanProvider>
    <StaffProvider>
      <Routes>
        {/* Quản trị – lễ tân & chủ cơ sở */}
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="lich-dat-san" element={<Bookings />} />
          <Route path="trang-thai-san" element={<CourtStatus />} />
          <Route path="hoi-vien" element={<Members />} />
          <Route path="giai-dau" element={<Tournaments />} />
          <Route path="giai-dau/tao-moi" element={<TournamentCreate />} />
          <Route path="giai-dau/:id" element={<TournamentDetail />} />
          <Route path="goi-tap" element={<Plans />} />
          <Route path="goi-tap/tao-moi" element={<PlanCreate />} />
          <Route path="nhan-vien" element={<StaffPage />} />
          <Route path="bao-cao" element={<Reports />} />
          <Route path="cai-dat" element={<Settings />} />
        </Route>

        {/* App hội viên (di động) */}
        <Route path="app" element={<MemberLayout />}>
          <Route index element={<MemberHome />} />
          <Route path="dat-san" element={<MemberBooking />} />
          <Route path="thanh-toan" element={<MemberCheckout />} />
          <Route path="*" element={<Placeholder title="Sắp ra mắt" back="/app" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StaffProvider>
    </PlanProvider>
    </TournamentProvider>
    </BookingProvider>
    </CourtsProvider>
  );
}
