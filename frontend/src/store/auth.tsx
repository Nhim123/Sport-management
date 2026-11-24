import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import * as api from '../api/auth.api';
import type { ClubSignup, StaffMember } from '../types/admin';

interface AuthStore {
  user: StaffMember | null;
  /** Bản test: mở app là vào thẳng, không cần đăng nhập */
  autoLogin: boolean;
  login: (identifier: string, password: string) => Promise<StaffMember>;
  /** Đăng ký câu lạc bộ mới (người đại diện + câu lạc bộ) rồi đăng nhập luôn */
  register: (signup: ClubSignup, password: string) => Promise<StaffMember>;
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

  const register = useCallback(async (signup: ClubSignup, password: string) => {
    const staff = await api.registerClub(signup, password);
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
