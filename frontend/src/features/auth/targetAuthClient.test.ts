import { describe, expect, it, vi } from 'vitest';
import { loginAgainstTarget, restoreTargetSession, targetDashboardStats } from './targetAuthClient';

describe('target auth client errors', () => {
  it('preserves login detail, code and error id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'TFS_FORBIDDEN', message: 'permission required', detail: 'map the TFS identity to a target role', errorId: 'auth-42' },
    }), { status: 403 })));

    await expect(loginAgainstTarget('user', 'secret', 'tfs', 'DOMAIN')).rejects.toThrow('permission required — map the TFS identity to a target role [TFS_FORBIDDEN] (errorId: auth-42)');
  });

  it('uses nested session errors instead of a generic message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'SESSION_INVALID', message: 'session invalid', detail: 'restart and sign in again' },
    }), { status: 503 })));

    await expect(restoreTargetSession()).rejects.toThrow('session invalid — restart and sign in again [SESSION_INVALID]');
  });

  it('preserves dashboard error detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'DASHBOARD_FORBIDDEN', message: 'dashboard permission required', detail: 'permission is not assigned' },
    }), { status: 403 })));

    await expect(targetDashboardStats()).rejects.toThrow('dashboard permission required — permission is not assigned [DASHBOARD_FORBIDDEN]');
  });
});
