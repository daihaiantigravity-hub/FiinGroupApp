namespace FiinGroupApp.Api.Auth;

public sealed record LoginRequest(string Username, string Password, string AuthProvider = "local", string? Domain = null);
public sealed record UserProfile(Guid Id, string Username, string DisplayName, string? Email, IReadOnlyCollection<string> Roles);
public sealed record PermissionSet(IReadOnlyDictionary<string, PermissionFlags> Forms, IReadOnlySet<string> Actions);
public sealed record PermissionFlags(bool CanAccess, bool CanView, bool CanAdd, bool CanEdit, bool CanDelete, bool CanImport, bool CanExport, bool CanApprove, bool CanPay, bool CanComplete);
public sealed record AuthenticatedUser(UserProfile User, PermissionSet Permissions);

public interface IUserStore
{
    Task<UserProfile?> FindByUsernameAsync(string username, CancellationToken cancellationToken);
    Task<bool> VerifyPasswordAsync(UserProfile user, string password, CancellationToken cancellationToken);
    Task<PermissionSet> GetPermissionsAsync(UserProfile user, CancellationToken cancellationToken);
}

public interface IAuthService
{
    Task<AuthenticatedUser?> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken);
}
