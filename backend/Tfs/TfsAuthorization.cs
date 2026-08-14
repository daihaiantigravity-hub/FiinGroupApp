using FiinGroupApp.Api.Auth;

namespace FiinGroupApp.Api.Tfs;

public static class TfsAuthorization
{
    public static IResult Forbidden()
        => Results.Json(new
        {
            success = false,
            error = new { code = "TFS_FORBIDDEN", message = "TFS project permission is required." }
        }, statusCode: StatusCodes.Status403Forbidden);

    public static bool CanRead(AuthenticatedUser authenticatedUser, params string[] formCodes)
        => formCodes.Any(formCode => authenticatedUser.Permissions.Forms.TryGetValue(formCode, out var permission)
            && permission.CanAccess
            && permission.CanView);
}
