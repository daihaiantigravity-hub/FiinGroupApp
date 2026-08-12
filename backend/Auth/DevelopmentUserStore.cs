namespace FiinGroupApp.Api.Auth;

/// <summary>
/// Development-only store. It deliberately contains no seeded credentials.
/// Replace with the new database-backed implementation before enabling login.
/// </summary>
public sealed class DevelopmentUserStore : IUserStore
{
    public Task<UserProfile?> FindByUsernameAsync(string username, CancellationToken cancellationToken) => Task.FromResult<UserProfile?>(null);
    public Task<bool> VerifyPasswordAsync(UserProfile user, string password, CancellationToken cancellationToken) => Task.FromResult(false);
    public Task<PermissionSet> GetPermissionsAsync(UserProfile user, CancellationToken cancellationToken) => Task.FromResult(new PermissionSet(new Dictionary<string, PermissionFlags>(), new HashSet<string>()));
}
