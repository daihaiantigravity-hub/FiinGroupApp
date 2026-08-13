using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace FiinGroupApp.Api.Auth;

public sealed class TargetSessionOptions
{
    public string CookieName { get; init; } = "fiingroupapp_session";
    public int LifetimeHours { get; init; } = 8;
    public bool SecureCookie { get; init; }
}

public interface ITargetSessionStore
{
    string Create(AuthenticatedUser authenticatedUser, TfsSessionCredential? tfsCredential = null);
    AuthenticatedUser? Get(string sessionId);
    TfsSessionCredential? GetTfsCredential(string sessionId);
    void Remove(string sessionId);
}

public sealed class InMemoryTargetSessionStore(TargetSessionOptions options) : ITargetSessionStore
{
    private readonly ConcurrentDictionary<string, SessionEntry> sessions = new(StringComparer.Ordinal);

    public string Create(AuthenticatedUser authenticatedUser, TfsSessionCredential? tfsCredential = null)
    {
        var sessionId = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
        sessions[sessionId] = new SessionEntry(authenticatedUser, tfsCredential, DateTimeOffset.UtcNow.AddHours(Math.Clamp(options.LifetimeHours, 1, 24)));
        return sessionId;
    }

    public TfsSessionCredential? GetTfsCredential(string sessionId)
    {
        if (!sessions.TryGetValue(sessionId, out var entry)) return null;
        if (entry.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            sessions.TryRemove(sessionId, out _);
            return null;
        }
        return entry.TfsCredential;
    }

    public AuthenticatedUser? Get(string sessionId)
    {
        if (!sessions.TryGetValue(sessionId, out var entry)) return null;
        if (entry.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            sessions.TryRemove(sessionId, out _);
            return null;
        }
        return entry.User;
    }

    public void Remove(string sessionId) => sessions.TryRemove(sessionId, out _);

    private sealed record SessionEntry(AuthenticatedUser User, TfsSessionCredential? TfsCredential, DateTimeOffset ExpiresAt);
}
