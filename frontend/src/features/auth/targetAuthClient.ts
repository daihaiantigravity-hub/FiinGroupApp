import type { AuthUser, LoginOutcome, PermissionMap } from './authTypes';

type TargetResponse = { user?: Record<string, unknown>; permissions?: { forms?: PermissionMap } } & Record<string, unknown>;

function mapUser(value: unknown): AuthUser {
  const user = (value ?? {}) as Record<string, unknown>;
  return { id: typeof user.id === 'string' || typeof user.id === 'number' ? user.id : undefined, login: String(user.username ?? user.login ?? ''), fullName: typeof user.displayName === 'string' ? user.displayName : undefined, roles: Array.isArray(user.roles) ? user.roles.map(String) : [] };
}

export async function loginAgainstTarget(username: string, password: string, authProvider = 'local', domain = ''): Promise<{ outcome: Extract<LoginOutcome, { kind: 'authenticated' }>; permissions: PermissionMap }> {
  const response = await fetch('/api/v2/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ username, password, authProvider, domain }) });
  const payload = await response.json().catch(() => ({})) as TargetResponse;
  if (!response.ok) {
    const nestedError = payload.error as Record<string, unknown> | undefined;
    const code = typeof nestedError?.code === 'string' ? ` [${nestedError.code}]` : '';
    const message = typeof nestedError?.message === 'string' ? nestedError.message : payload.message ?? payload.error;
    throw new Error(`${String(message ?? `Target login failed: ${response.status}`)}${code}`);
  }
  const permissions = payload.permissions?.forms ?? {};
  return { outcome: { kind: 'authenticated', token: '', user: mapUser(payload.user) }, permissions };
}
