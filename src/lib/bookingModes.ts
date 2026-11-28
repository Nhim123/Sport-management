// Giá cho các chế độ đặt sân thay thế (vé lượt, pickup). Lưu cùng khóa 'arena-settings'.
// Việc BẬT/TẮT vé lượt & pickup là theo từng sân (Court.ticket / Court.pickup),
// cấu hình ngay tại màn Lịch đặt sân → Tùy chỉnh sân. Ở đây chỉ giữ giá & sức chứa dùng chung.
// - Vé lượt (xé vé): bán vé vào chơi theo lượt, tính theo số người.
// - Pickup (ghép trận): mở trận chung sân, người chơi lẻ đăng ký vào cho đủ sức chứa.

export interface BookingModes {
  ticketPrice: number; // giá vé / người
  pickupCap: number; // sức chứa mặc định / trận (người)
  pickupPrice: number; // giá / người
}

export const DEFAULT_MODES: BookingModes = {
  ticketPrice: 50000,
  pickupCap: 8,
  pickupPrice: 60000,
};

export function loadBookingModes(): BookingModes {
  try {
    const raw = localStorage.getItem('arena-settings');
    if (raw) {
      const v = JSON.parse(raw) as { booking?: Partial<BookingModes> };
      if (v.booking && typeof v.booking === 'object') return { ...DEFAULT_MODES, ...v.booking };
    }
  } catch {
    /* dữ liệu hỏng – dùng mặc định */
  }
  return DEFAULT_MODES;
}
