namespace FiinGroupApp.Api.ProjectManagement;

public sealed class ProjectManagementOptions
{
    public bool Enabled { get; init; }
    public string? ConnectionString { get; init; }
}

public sealed record ProjectManagementProject(
    int Id,
    int? SourceProjectId,
    string ProjectManager,
    string Customer,
    string? ProjectCode,
    string? AnnexNo,
    string? AnnexName,
    int Status,
    decimal Amount,
    decimal Budget,
    string? StartDate,
    string? EndDate);

public sealed record ProjectManagementTask(
    int Id,
    int ProjectId,
    int? ParentId,
    string TaskCode,
    string TaskName,
    string? Description,
    string? Product,
    string? StartDate,
    string? EndDate,
    decimal Progress,
    decimal Plan,
    int Priority,
    int TaskType,
    int Status,
    int SortOrder,
    string? CreatedBy,
    string? SourceSystem,
    string? SourceCollection,
    string? SourceProjectId,
    string? SourceId,
    int? SourceRevision);

public interface IProjectManagementReader
{
    Task<IReadOnlyList<ProjectManagementProject>> GetProjectsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementTask>> GetTasksAsync(int projectId, CancellationToken cancellationToken);
}

public sealed class ProjectManagementStoreException(string message, string code, int statusCode) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}
