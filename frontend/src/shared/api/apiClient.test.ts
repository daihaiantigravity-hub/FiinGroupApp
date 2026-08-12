import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './apiClient';

describe('apiClient', () => {
  it('uses the configured base URL and credentials', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = createApiClient({ baseUrl: 'http://legacy.test/api', fetchImpl });

    await expect(client.get<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith('http://legacy.test/api/health', { credentials: 'include' });
  });
});
