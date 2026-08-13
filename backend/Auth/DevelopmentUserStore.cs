namespace FiinGroupApp.Api.Auth;

/// <summary>
/// Development-only store. Credentials come from environment/configuration and are never committed.
/// It is rejected outside the Development environment.
/// </summary>
public sealed class DevelopmentUserStore(IConfiguration configuration, IPasswordHasher passwordHasher, bool allowed) : IUserStore
{
    private readonly string? configuredUsername = allowed ? configuration["DevelopmentAuth:Username"] : null;
    private readonly string? configuredPassword = allowed ? configuration["DevelopmentAuth:Password"] : null;
    private readonly string configuredDisplayName = configuration["DevelopmentAuth:DisplayName"] ?? "Development User";
    private readonly string? passwordHash = allowed && !string.IsNullOrEmpty(configuration["DevelopmentAuth:Password"])
        ? passwordHasher.Hash(configuration["DevelopmentAuth:Password"]!)
        : null;

    public Task<UserProfile?> FindByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(configuredUsername) || !string.Equals(username, configuredUsername, StringComparison.OrdinalIgnoreCase)) return Task.FromResult<UserProfile?>(null);
        var id = Guid.NewGuid();
        return Task.FromResult<UserProfile?>(new UserProfile(id, configuredUsername, configuredDisplayName, null, ["DEVELOPMENT"]));
    }

    public Task<bool> VerifyPasswordAsync(UserProfile user, string password, CancellationToken cancellationToken)
        => Task.FromResult(passwordHash is not null && passwordHasher.Verify(password, passwordHash));

    public Task<PermissionSet> GetPermissionsAsync(UserProfile user, CancellationToken cancellationToken)
    {
        var flags = new PermissionFlags(true, true, true, true, true, true, true, true, true, true);
        return Task.FromResult(new PermissionSet(new Dictionary<string, PermissionFlags> { ["__development__"] = flags, ["dashboard"] = flags }, new HashSet<string> { "__development__:ALL" }));
    }
}
