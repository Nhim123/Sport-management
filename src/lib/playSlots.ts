// Khung giờ chơi: dùng chung cho màn Cài đặt (thiết lập) và Trạng thái sân (xem theo khung).
// Lưu cùng khóa cài đặt 'arena-settings' để chỉ có một nguồn dữ liệu.

export interface PlaySlot {
  id: string;
  name: string;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
}

export const DEFAULT_SLOTS: PlaySlot[] = [
  { id: 'chieu', name: 'Chiều', from: '15:00', to: '18:00' },
  { id: 'toi', name: 'Tối', from: '18:00', to: '21:00' },
  { id: 'khuya', name: 'Khuya', from: '21:00', to: '23:00' },
];

/** "HH:MM" → giờ thập phân (vd. "17:30" → 17.5) */
export const toHour = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
};

/** Đọc khung giờ từ cài đặt; chưa thiết lập thì dùng mặc định. */
export function loadPlaySlots(): PlaySlot[] {
  try {
    const raw = localStorage.getItem('arena-settings');
    if (raw) {
      const v = JSON.parse(raw) as { slots?: unknown };
      if (Array.isArray(v.slots) && v.slots.length && v.slots.every((s) => s && typeof s.id === 'string' && typeof s.from === 'string' && typeof s.to === 'string')) {
        return v.slots as PlaySlot[];
      }
    }
  } catch {
    /* dữ liệu hỏng – dùng mặc định */
  }
  return DEFAULT_SLOTS;
}
