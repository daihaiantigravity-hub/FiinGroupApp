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

    public static IResult WriteForbidden()
        => Results.Json(new
        {
            success = false,
            error = new { code = "TFS_WRITE_FORBIDDEN", message = "TFS task write permission is required." }
        }, statusCode: StatusCodes.Status403Forbidden);

    public static bool CanRead(AuthenticatedUser authenticatedUser, params string[] formCodes)
        => formCodes.Any(formCode => authenticatedUser.Permissions.Forms.TryGetValue(formCode, out var permission)
            && permission.CanAccess
            && permission.CanView);

    public static bool CanCreate(AuthenticatedUser authenticatedUser, params string[] formCodes)
        => formCodes.Any(formCode => authenticatedUser.Permissions.Forms.TryGetValue(formCode, out var permission)
            && permission.CanAccess
            && permission.CanAdd);

    public static bool CanEdit(AuthenticatedUser authenticatedUser, params string[] formCodes)
        => formCodes.Any(formCode => authenticatedUser.Permissions.Forms.TryGetValue(formCode, out var permission)
            && permission.CanAccess
            && permission.CanEdit);
}
