namespace FiinGroupApp.Api.Auth;

public sealed class AuthService(IUserStore userStore) : IAuthService
{
    public async Task<AuthenticatedUser?> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim();
        if (username.Length == 0 || request.Password.Length == 0) return null;
        var user = await userStore.FindByUsernameAsync(username, cancellationToken);
        if (user is null || !await userStore.VerifyPasswordAsync(user, request.Password, cancellationToken)) return null;
        return new AuthenticatedUser(user, await userStore.GetPermissionsAsync(user, cancellationToken));
    }
}
