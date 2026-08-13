import type { AuthUser, LoginOutcome, OtpMethod, PermissionMap } from './authTypes';

type LegacyResponse = Record<string, unknown>;
type AuthClientOptions = { baseUrl?: string; fetchImpl?: typeof fetch };
const defaultBaseUrl = import.meta.env.VITE_LEGACY_API_BASE_URL ?? '/api';

export type LegacyDashboardStats = {
  employees: { total: number; new_this_month: number };
  projects: { active: number; total: number; new: number };
  revenue: { total: number; display: string; ytd_label: string };
  pending: { count: number };
};

export type LegacyWikiItem = {
  id: number;
  category: string | null;
  product: string | null;
  business_area: string | null;
  client: string | null;
  title: string | null;
  root_cause: string | null;
  diagnosis: string | null;
  solution: string | null;
  keyword: string | null;
  level: string | null;
  status: number | null;
  created_by: string | null;
};

export type LegacyAnnouncementItem = {
  id: number;
  category: string | null;
  priority: number | null;
  title: string | null;
  content_type: string | null;
  is_public: boolean | number | null;
  publish_date: string | null;
  expire_date: string | null;
  created_by: string | null;
  status: number | null;
  is_pinned: boolean | number | null;
};

function mapDashboardStats(value: unknown): LegacyDashboardStats {
  const root = (value ?? {}) as Record<string, unknown>;
  const employees = (root.employees ?? {}) as Record<string, unknown>;
  const projects = (root.projects ?? {}) as Record<string, unknown>;
  const revenue = (root.revenue ?? {}) as Record<string, unknown>;
  const pending = (root.pending ?? {}) as Record<string, unknown>;
  const numberOrZero = (candidate: unknown) => typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : Number(candidate) || 0;
  return {
    employees: { total: numberOrZero(employees.total), new_this_month: numberOrZero(employees.new_this_month) },
    projects: { active: numberOrZero(projects.active), total: numberOrZero(projects.total), new: numberOrZero(projects.new) },
    revenue: { total: numberOrZero(revenue.total), display: String(revenue.display ?? '0'), ytd_label: String(revenue.ytd_label ?? '') },
    pending: { count: numberOrZero(pending.count) },
  };
}

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

export function createLegacyAuthClient(options: AuthClientOptions = {}) {
  const baseUrl = options.baseUrl ?? defaultBaseUrl;
  const fetchImpl = options.fetchImpl ?? fetch;
  let accessToken: string | null = null;

  async function request<T extends LegacyResponse>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    const response = await fetchImpl(`${baseUrl}${path}`, { ...init, headers, credentials: 'include' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(payload.message ?? payload.error ?? `Request failed: ${response.status}`));
    return payload as T;
  }

  return {
    async login(username: string, password: string, authProvider = 'local', domain = ''): Promise<LoginOutcome> {
      const payload = await request<LegacyResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, authProvider, domain }) });
      if (payload.requireTOTP === true) return { kind: 'otp_required', otpToken: String(payload.otpToken ?? ''), method: String(payload.method ?? 'totp') as OtpMethod, maskedEmail: typeof payload.maskedEmail === 'string' ? payload.maskedEmail : undefined, user: mapUser(payload.user) };
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
    async permissions(): Promise<PermissionMap> { const payload = await request<LegacyResponse>('/auth/my-permissions'); return (payload.data ?? {}) as PermissionMap; },
    async dashboardStats(): Promise<LegacyDashboardStats> {
      const payload = await request<LegacyResponse>('/dashboard/stats');
      return mapDashboardStats(payload.data);
    },
    async wikiList(filters: Record<string, string> = {}): Promise<LegacyWikiItem[]> {
      const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value)));
      const payload = await request<LegacyResponse>('/mt_wikis?' + query.toString());
      return Array.isArray(payload.data) ? payload.data as LegacyWikiItem[] : [];
    },
    async announcementList(filters: Record<string, string> = {}): Promise<LegacyAnnouncementItem[]> {
      const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value)));
      const payload = await request<LegacyResponse>('/mt_announcements?' + query.toString());
      return Array.isArray(payload.data) ? payload.data as LegacyAnnouncementItem[] : [];
    },
    async logout(): Promise<void> { try { await request('/auth/logout', { method: 'POST' }); } finally { accessToken = null; } },
  };
}

export const legacyAuthClient = createLegacyAuthClient();
