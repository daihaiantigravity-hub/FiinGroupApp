import { describe, expect, it, vi } from 'vitest';
import { getProjectManagementTasks } from './projectManagementClient';

describe('project management client', () => {
  it('encodes the numeric project id and reads the target envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementTasks(42)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/42/tasks', { credentials: 'include' });
  });

  it('keeps the backend error code in the client error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'PROJECT_MANAGEMENT_STORE_DISABLED', message: 'disabled' } }), { status: 503 })));

    await expect(getProjectManagementTasks(42)).rejects.toThrow('disabled [PROJECT_MANAGEMENT_STORE_DISABLED]');
  });
});
