import { describe, expect, it, vi } from 'vitest';
import { createLegacyAuthClient } from './legacyAuthClient';

function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }

describe('legacyAuthClient contract', () => {
  it('maps authenticated login and sends bearer token to permissions', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(response({ token: 'jwt-1', user: { id: 7, login: 'alice', fullName: 'Alice' } })).mockResolvedValueOnce(response({ data: { dashboard: { canAccess: true } } }));
    const client = createLegacyAuthClient({ baseUrl: '/api', fetchImpl });
    await expect(client.login('alice', 'secret')).resolves.toMatchObject({ kind: 'authenticated', token: 'jwt-1', user: { login: 'alice' } });
    await expect(client.permissions()).resolves.toEqual({ dashboard: { canAccess: true } });
    expect(new Headers(fetchImpl.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer jwt-1');
  });

  it('maps OTP and setup-required outcomes', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(response({ requireTOTP: true, otpToken: 'pending-1', method: 'email_otp', maskedEmail: 'a***@example.com' })).mockResolvedValueOnce(response({ requireSetup: true, setupToken: 'setup-1' }));
    const client = createLegacyAuthClient({ fetchImpl });
    await expect(client.login('alice', 'secret')).resolves.toMatchObject({ kind: 'otp_required', otpToken: 'pending-1', method: 'email_otp' });
    await expect(client.login('alice', 'secret')).resolves.toMatchObject({ kind: 'setup_required', setupToken: 'setup-1' });
  });

  it('returns safe errors and clears the token on logout', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(response({ token: 'jwt-2', user: { login: 'alice' } })).mockResolvedValueOnce(response({ message: 'Invalid credentials' }, 401)).mockResolvedValueOnce(response({ success: true })).mockResolvedValueOnce(response({ data: {} }));
    const client = createLegacyAuthClient({ fetchImpl });
    await client.login('alice', 'secret');
    await expect(client.permissions()).rejects.toThrow('Invalid credentials');
    await client.logout();
    await client.permissions();
    expect(new Headers(fetchImpl.mock.calls[3][1]?.headers).get('Authorization')).toBeNull();
  });
});
