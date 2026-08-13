import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { legacyAuthClient } from './legacyAuthClient';
import type { AuthState } from './authTypes';
import { loginAgainstTarget } from './targetAuthClient';

type AuthContextValue = AuthState & {
  login: (username: string, password: string, authProvider?: string, domain?: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const initialState: AuthState = { status: 'anonymous', user: null, challenge: null, error: null, permissions: {} };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialState);
  const login = async (username: string, password: string, authProvider = 'local', domain = '') => {
    setState({ ...initialState, status: 'authenticating' });
    try {
      if ((import.meta.env.VITE_AUTH_MODE ?? 'legacy') === 'target-dev') {
        const target = await loginAgainstTarget(username, password, authProvider, domain);
        setState({ status: 'authenticated', user: target.outcome.user, challenge: null, error: null, permissions: target.permissions });
        return;
      }
      const result = await legacyAuthClient.login(username, password, authProvider, domain);
      if (result.kind === 'authenticated') {
        const permissions = await legacyAuthClient.permissions();
        setState({ status: 'authenticated', user: result.user, challenge: null, error: null, permissions });
      } else if (result.kind === 'otp_required') setState({ ...initialState, status: 'otp_required', user: result.user ? { login: result.user.login ?? '' } : null, challenge: result });
      else setState({ ...initialState, status: 'error', error: 'Tài khoản cần hoàn tất thiết lập 2FA.' });
    } catch (error) { setState({ ...initialState, status: 'error', error: error instanceof Error ? error.message : 'Đăng nhập thất bại.' }); }
  };
  const verifyOtp = async (code: string) => {
    if ((import.meta.env.VITE_AUTH_MODE ?? 'legacy') === 'target-dev') { setState((current) => ({ ...current, error: 'Target-dev login chưa hỗ trợ OTP; hãy dùng legacy mode để test OTP/TOTP.' })); return; }
    if (!state.challenge) return;
    try {
      const result = await legacyAuthClient.verifyOtp(state.challenge.otpToken, code);
      const permissions = await legacyAuthClient.permissions();
      setState({ status: 'authenticated', user: result.user, challenge: null, error: null, permissions });
    } catch (error) { setState((current) => ({ ...current, status: 'otp_required', error: error instanceof Error ? error.message : 'Mã xác thực không hợp lệ.' })); }
  };
  const logout = async () => { await legacyAuthClient.logout(); setState(initialState); };
  const value = useMemo(() => ({ ...state, login, verifyOtp, logout }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
