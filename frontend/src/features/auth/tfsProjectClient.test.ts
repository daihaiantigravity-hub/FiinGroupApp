import { describe, expect, it, vi } from 'vitest';
import { getTfsProjects, removeTfsWorkItem } from './tfsProjectClient';

describe('TFS project client errors', () => {
  it('preserves TFS error detail and error id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'TFS_PROJECTS_UNAVAILABLE', message: 'TFS unavailable', detail: 'connectionData request timed out', errorId: 'tfs-17' },
    }), { status: 503 })));

    await expect(getTfsProjects()).rejects.toThrow('TFS unavailable — connectionData request timed out [TFS_PROJECTS_UNAVAILABLE] (errorId: tfs-17)');
  });

  it('soft-removes a work item with its revision guard', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: { id: 280, revision: 8, state: 'Removed' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);

    await expect(removeTfsWorkItem({ collection: 'FiinGroup', id: 'project-1', name: 'Project', description: null, state: null, url: null }, 280, 7)).resolves.toMatchObject({ id: 280, state: 'Removed' });
    expect(fetchImpl).toHaveBeenCalledWith('/api/v2/tfs/projects/project-1/work-items/280?collection=FiinGroup&revision=7', expect.objectContaining({ method: 'DELETE', credentials: 'include' }));
  });
});
