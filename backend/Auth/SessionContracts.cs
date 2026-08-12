namespace FiinGroupApp.Api.Auth;

public sealed record AuthSession(Guid SessionId, string AccessToken, DateTimeOffset AccessTokenExpiresAt, DateTimeOffset RefreshTokenExpiresAt);
public sealed record LoginResult(AuthenticatedUser Authentication, AuthSession Session);

public interface ISessionStore
{
    Task<AuthSession> CreateAsync(UserProfile user, string? ipAddress, string? userAgent, CancellationToken cancellationToken);
    Task<bool> IsActiveAsync(Guid sessionId, CancellationToken cancellationToken);
    Task RevokeAsync(Guid sessionId, CancellationToken cancellationToken);
}

public sealed record TwoFactorChallenge(Guid ChallengeId, Guid UserId, OtpMethod Method, DateTimeOffset ExpiresAt, int AttemptsRemaining);
public enum OtpMethod { Totp, EmailOtp }

public interface ITwoFactorService
{
    Task<TwoFactorChallenge> CreateChallengeAsync(UserProfile user, OtpMethod method, CancellationToken cancellationToken);
    Task<bool> VerifyChallengeAsync(Guid challengeId, string code, CancellationToken cancellationToken);
}
