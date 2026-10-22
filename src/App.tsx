import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import MemberLayout from './components/MemberLayout';
import Bookings from './pages/admin/Bookings';
import CourtStatus from './pages/admin/CourtStatus';
import Dashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import Reports from './pages/admin/Reports';
import MemberBooking from './pages/member/Booking';
import MemberCheckout from './pages/member/Checkout';
import MemberHome from './pages/member/Home';
import Placeholder from './pages/Placeholder';
import { BookingProvider } from './store/bookings';
import { CourtsProvider } from './store/courts';

export default function App() {
  return (
    <CourtsProvider>
    <BookingProvider>
      <Routes>
        {/* Quản trị – lễ tân & chủ cơ sở */}
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="lich-dat-san" element={<Bookings />} />
          <Route path="trang-thai-san" element={<CourtStatus />} />
          <Route path="hoi-vien" element={<Members />} />
          <Route path="lop-hoc" element={<Placeholder title="Lớp học & PT" />} />
          <Route path="goi-tap" element={<Placeholder title="Gói tập" />} />
          <Route path="thanh-toan" element={<Placeholder title="Thanh toán" />} />
          <Route path="bao-cao" element={<Reports />} />
          <Route path="cai-dat" element={<Placeholder title="Cài đặt" />} />
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
    </BookingProvider>
    </CourtsProvider>
  );
}
