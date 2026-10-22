import { useCallback, useState } from 'react';
import { CLOSE_HOUR, OPEN_HOUR } from '../data/mock';

/** Tùy chọn hiển thị lịch đặt sân của người đang dùng (lưu trên trình duyệt này) */
export interface ScheduleView {
  /** Giờ mở cửa trên lịch */
  from: number;
  /** Giờ đóng cửa (không gồm) – cũng là giờ muộn nhất được đặt tới */
  to: number;
  showPrice: boolean;
  dense: boolean;
}

export const DEFAULT_VIEW: ScheduleView = { from: OPEN_HOUR, to: CLOSE_HOUR, showPrice: true, dense: false };
export const VIEW_MIN_HOUR = 5;
export const VIEW_MAX_HOUR = 24;

const KEY = 'arena-schedule-view';

function load(): ScheduleView {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<ScheduleView> | null;
    if (v && typeof v.from === 'number' && typeof v.to === 'number' && v.from >= VIEW_MIN_HOUR && v.to <= VIEW_MAX_HOUR && v.to - v.from >= 2) {
      return { ...DEFAULT_VIEW, ...v };
    }
  } catch {
    /* không đọc được – dùng mặc định */
  }
  return DEFAULT_VIEW;
}

export function useScheduleView(): [ScheduleView, (patch: Partial<ScheduleView>) => void] {
  const [view, setView] = useState<ScheduleView>(load);
  const update = useCallback((patch: Partial<ScheduleView>) => {
    setView((cur) => {
      const next = { ...cur, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* không lưu được – vẫn áp dụng trong lần mở này */
      }
      return next;
    });
  }, []);
  return [view, update];
}
