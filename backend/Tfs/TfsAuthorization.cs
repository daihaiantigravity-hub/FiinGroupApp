using FiinGroupApp.Api.Auth;

namespace FiinGroupApp.Api.Tfs;

public static class TfsAuthorization
{
    private static readonly string[] TfsReadForms = ["pm-projects", "projectmanagement", "project-tasks"];
    private static readonly string[] TfsWriteForms = ["projectmanagement", "project-tasks"];

    /// <summary>
    /// Permissions for a session authenticated directly by TFS. TFS remains
    /// the source of truth for the account's project/work-item rights; the
    /// target flag only enables the write path in this application.
    /// </summary>
    public static PermissionSet CreateTfsSessionPermissions(bool writeEnabled)
    {
        var forms = new Dictionary<string, PermissionFlags>(StringComparer.OrdinalIgnoreCase);
        var actions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var formCode in TfsReadForms)
        {
            var canWrite = writeEnabled && TfsWriteForms.Contains(formCode, StringComparer.OrdinalIgnoreCase);
            forms[formCode] = new PermissionFlags(true, true, canWrite, canWrite, false, false, false, false, false, false);
            actions.Add(formCode + ":ACCESS");
            actions.Add(formCode + ":VIEW");
            if (canWrite)
            {
                actions.Add(formCode + ":ADD");
                actions.Add(formCode + ":EDIT");
            }
        }
        return new PermissionSet(forms, actions);
    }

    /// <summary>
    /// Keep an explicitly mapped application's module boundary, but do not
    /// discard the ADD/EDIT capabilities of a TFS-authenticated session merely
    /// because the target role has no duplicated ADD row. The subsequent
    /// request is still sent to TFS with the user's credential, so TFS is the
    /// final authority for whether the work item can actually be created or edited.
    /// </summary>
    public static AuthenticatedUser GrantTfsWriteCapability(AuthenticatedUser authenticatedUser, bool writeEnabled)
    {
        if (!writeEnabled) return authenticatedUser;

        var forms = new Dictionary<string, PermissionFlags>(authenticatedUser.Permissions.Forms, StringComparer.OrdinalIgnoreCase);
        var actions = new HashSet<string>(authenticatedUser.Permissions.Actions, StringComparer.OrdinalIgnoreCase);
        var changed = false;
        foreach (var formCode in TfsWriteForms)
        {
            if (!forms.TryGetValue(formCode, out var permission) || !permission.CanAccess || !permission.CanView) continue;
            var nextPermission = permission with { CanAdd = true, CanEdit = true };
            if (nextPermission == permission) continue;
            forms[formCode] = nextPermission;
            actions.Add(formCode + ":ADD");
            actions.Add(formCode + ":EDIT");
            changed = true;
        }

        return changed
            ? authenticatedUser with { Permissions = new PermissionSet(forms, actions) }
            : authenticatedUser;
    }

    public static IResult Forbidden()
        => Results.Json(new
        {
            success = false,
            error = new { code = "TFS_FORBIDDEN", errorId = Guid.NewGuid().ToString("N"), message = "TFS project permission is required." }
        }, statusCode: StatusCodes.Status403Forbidden);

    public static IResult WriteForbidden()
        => Results.Json(new
        {
            success = false,
            error = new { code = "TFS_WRITE_FORBIDDEN", errorId = Guid.NewGuid().ToString("N"), message = "TFS task write permission is required." }
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
