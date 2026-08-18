import { describe, expect, it, vi } from 'vitest';
import { getTfsProjects } from './tfsProjectClient';

describe('TFS project client errors', () => {
  it('preserves TFS error detail and error id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'TFS_PROJECTS_UNAVAILABLE', message: 'TFS unavailable', detail: 'connectionData request timed out', errorId: 'tfs-17' },
    }), { status: 503 })));

    await expect(getTfsProjects()).rejects.toThrow('TFS unavailable — connectionData request timed out [TFS_PROJECTS_UNAVAILABLE] (errorId: tfs-17)');
  });
});
