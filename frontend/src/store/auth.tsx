import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import * as api from '../api/auth.api';
import type { StaffMember } from '../types/admin';

interface AuthStore {
  user: StaffMember | null;
  /** Bản test: mở app là vào thẳng, không cần đăng nhập */
  autoLogin: boolean;
  login: (identifier: string, password: string) => Promise<StaffMember>;
  /** Tạo tài khoản bằng mã nhân viên rồi đăng nhập luôn */
  register: (code: string, phone: string, password: string) => Promise<StaffMember>;
  logout: () => void;
}

const Ctx = createContext<AuthStore | null>(null);

/** Phiên đăng nhập giữ trong bộ nhớ – mở lại app thì đăng nhập lại */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Bản test: phiên có sẵn ngay từ đầu → vào thẳng chế độ quản lý (đăng xuất vẫn được để thử màn đăng nhập)
  const [user, setUser] = useState<StaffMember | null>(api.testSession);

  const login = useCallback(async (identifier: string, password: string) => {
    const staff = await api.login(identifier, password);
    setUser(staff);
    return staff;
  }, []);

  const register = useCallback(async (code: string, phone: string, password: string) => {
    const staff = await api.register(code, phone, password);
    setUser(staff);
    return staff;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, autoLogin: api.AUTO_LOGIN, login, register, logout }), [user, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
