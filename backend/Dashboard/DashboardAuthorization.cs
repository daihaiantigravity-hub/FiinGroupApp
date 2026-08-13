using FiinGroupApp.Api.Auth;

namespace FiinGroupApp.Api.Dashboard;

public static class DashboardAuthorization
{
    public const string FormCode = "dashboard";

    public static bool CanRead(AuthenticatedUser authenticatedUser)
        => authenticatedUser.Permissions.Forms.TryGetValue(FormCode, out var permission)
           && permission.CanAccess
           && permission.CanView;
}
