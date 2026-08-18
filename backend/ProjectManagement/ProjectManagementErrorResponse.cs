namespace FiinGroupApp.Api.ProjectManagement;

public static class ProjectManagementErrorResponse
{
    public static IResult Create(ProjectManagementStoreException exception)
        => Results.Json(new
        {
            success = false,
            error = new
            {
                code = exception.Code,
                errorId = Guid.NewGuid().ToString("N"),
                message = exception.Message
            }
        }, statusCode: exception.StatusCode);
}
