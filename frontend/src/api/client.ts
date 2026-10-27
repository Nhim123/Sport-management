// HTTP client dùng chung. Khi chưa có backend, USE_MOCK = true để app vẫn chạy bằng dữ liệu mẫu.
import axios from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** Mặc định dùng mock cho tới khi backend sẵn sàng. Đặt EXPO_PUBLIC_USE_MOCK=false để gọi API thật. */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';

export const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** Giả lập độ trễ mạng cho nhánh mock, để UI loading/skeleton hoạt động như thật. */
export function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
