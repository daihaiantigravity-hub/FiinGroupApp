import type { ActionPermissionMap, AuthUser, LoginOutcome, PermissionMap } from './authTypes';
import type { LegacyDashboardStats } from './legacyAuthClient';

type TargetResponse = { user?: Record<string, unknown>; permissions?: { forms?: PermissionMap; actions?: unknown } } & Record<string, unknown>;

function mapUser(value: unknown): AuthUser {
  const user = (value ?? {}) as Record<string, unknown>;
  return { id: typeof user.id === 'string' || typeof user.id === 'number' ? user.id : undefined, login: String(user.username ?? user.login ?? ''), fullName: typeof user.displayName === 'string' ? user.displayName : undefined, roles: Array.isArray(user.roles) ? user.roles.map(String) : [] };
}

function mapActions(value: unknown): ActionPermissionMap {
  if (Array.isArray(value)) return Object.fromEntries(value.map((action) => [String(action), true]));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, allowed]) => allowed === true).map(([action]) => [action, true]));
  return {};
}

export async function loginAgainstTarget(username: string, password: string, authProvider = 'local', domain = ''): Promise<{ outcome: Extract<LoginOutcome, { kind: 'authenticated' }>; permissions: PermissionMap; actionPermissions: ActionPermissionMap }> {
  const response = await fetch('/api/v2/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ username, password, authProvider, domain }) });
  const payload = await response.json().catch(() => ({})) as TargetResponse;
  if (!response.ok) {
    const nestedError = payload.error as Record<string, unknown> | undefined;
    const code = typeof nestedError?.code === 'string' ? ` [${nestedError.code}]` : '';
    const message = typeof nestedError?.message === 'string' ? nestedError.message : payload.message ?? payload.error;
    throw new Error(`${String(message ?? `Target login failed: ${response.status}`)}${code}`);
  }
  const permissions = payload.permissions?.forms ?? {};
  return { outcome: { kind: 'authenticated', token: '', user: mapUser(payload.user) }, permissions, actionPermissions: mapActions(payload.permissions?.actions) };
}

export async function restoreTargetSession(): Promise<{ user: AuthUser; permissions: PermissionMap; actionPermissions: ActionPermissionMap } | null> {
  const response = await fetch('/api/v2/auth/session', { credentials: 'include' });
  if (response.status === 401) return null;
  const payload = await response.json().catch(() => ({})) as TargetResponse;
  if (!response.ok) throw new Error(String(payload.message ?? `Target session failed: ${response.status}`));
  return { user: mapUser(payload.user), permissions: payload.permissions?.forms ?? {}, actionPermissions: mapActions(payload.permissions?.actions) };
}

export async function logoutTarget(): Promise<void> {
  await fetch('/api/v2/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function targetDashboardStats(): Promise<LegacyDashboardStats> {
  const response = await fetch('/api/v2/dashboard/stats', { credentials: 'include' });
  const payload = await response.json().catch(() => ({})) as TargetResponse;
  if (!response.ok) {
    const nestedError = payload.error as Record<string, unknown> | undefined;
    throw new Error(String(nestedError?.message ?? payload.message ?? `Target dashboard failed: ${response.status}`));
  }
  return payload.data as LegacyDashboardStats;
}
