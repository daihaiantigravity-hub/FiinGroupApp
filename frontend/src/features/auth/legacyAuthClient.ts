import type { AuthUser, LoginOutcome, OtpMethod, PermissionMap } from './authTypes';

type LegacyResponse = Record<string, unknown>;

const legacyBaseUrl = import.meta.env.VITE_LEGACY_API_BASE_URL ?? '/api';
let accessToken: string | null = null;

function mapUser(value: unknown): AuthUser {
  const raw = (value ?? {}) as LegacyResponse;
  const user = (raw.user ?? raw) as LegacyResponse;
  return {
    id: typeof user.id === 'number' ? user.id : undefined,
    login: String(user.login ?? ''),
    fullName: typeof user.fullName === 'string' ? user.fullName : undefined,
    roles: Array.isArray(user.roles) ? user.roles.map(String) : [],
    positionsName: typeof user.positions_name === 'string' ? user.positions_name : undefined,
    avatarUrl: typeof user.avatar_base64 === 'string' ? user.avatar_base64 : undefined,
  };
}

async function request<T extends LegacyResponse>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${legacyBaseUrl}${path}`, { ...init, headers, credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload.message ?? payload.error ?? `Request failed: ${response.status}`));
  return payload as T;
}

export const legacyAuthClient = {
  async login(username: string, password: string): Promise<LoginOutcome> {
    const payload = await request<LegacyResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    if (payload.requireTOTP === true) {
      return {
        kind: 'otp_required',
        otpToken: String(payload.otpToken ?? ''),
        method: String(payload.method ?? 'totp') as OtpMethod,
        maskedEmail: typeof payload.maskedEmail === 'string' ? payload.maskedEmail : undefined,
        user: mapUser(payload.user),
      };
    }
    if (payload.requireSetup === true) return { kind: 'setup_required', setupToken: String(payload.setupToken ?? ''), user: mapUser(payload.user) };
    accessToken = String(payload.token ?? '');
    return { kind: 'authenticated', token: accessToken, user: mapUser(payload.user) };
  },

  async verifyOtp(otpToken: string, code: string): Promise<{ token: string; user: AuthUser }> {
    const payload = await request<LegacyResponse>('/auth/verify-totp', { method: 'POST', body: JSON.stringify({ otpToken, totpCode: code }) });
    accessToken = String(payload.token ?? '');
    return { token: accessToken, user: mapUser(payload.user) };
  },

  async me(): Promise<AuthUser> { return mapUser(await request('/auth/me')); },
  async permissions(): Promise<PermissionMap> {
    const payload = await request<LegacyResponse>('/auth/my-permissions');
    return (payload.data ?? {}) as PermissionMap;
  },

  async logout(): Promise<void> {
    try { await request('/auth/logout', { method: 'POST' }); } finally { accessToken = null; }
  },
};
