namespace FiinGroupApp.Api.ProjectManagement;

public sealed class ProjectManagementOptions
{
    public bool Enabled { get; init; }
    public bool PmbokEnabled { get; init; }
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
    int? SourceRevision,
    string? ActualStartDate,
    string? ActualEndDate,
    int Duration,
    decimal? Effort,
    bool IsCritical,
    string? Phase,
    string? DepartmentRole,
    string? SourceUrl);

public sealed record ProjectManagementTaskAssignee(
    int Id,
    int TaskId,
    string Assignee,
    int Role);

public sealed record ProjectManagementTaskDependency(
    int Id,
    int TaskId,
    int DependsOnId,
    int DependencyType,
    int LagDays);

public sealed record ProjectManagementTaskLog(
    int Id,
    int TaskId,
    string UpdatedBy,
    string FieldName,
    string? OldValue,
    string? NewValue,
    string? Note,
    string? CreatedAt);

public sealed record ProjectManagementTaskDetails(
    ProjectManagementTask Task,
    IReadOnlyList<ProjectManagementTaskAssignee> Assignees,
    IReadOnlyList<ProjectManagementTaskDependency> Dependencies,
    IReadOnlyList<ProjectManagementTaskLog> Logs);

public sealed record ProjectManagementPlan(
    int Id,
    int Year,
    int Month,
    int Week,
    int SectionType,
    int EntryType,
    string? Customer,
    int? ProjectId,
    string TaskDescription,
    string? FromDate,
    string? ToDate,
    decimal CurrentProgress,
    decimal PlanProgress,
    decimal? ResultProgress,
    string? ResultNotes,
    string? Resource,
    string? Remarks,
    int SortOrder,
    string? CreatedBy,
    int Status);

public sealed record ProjectManagementSummary(
    long Id,
    string? ProjectManager,
    int? Year,
    string? Customer,
    int ProjectId,
    string? AnnexName,
    decimal PlanPercent,
    decimal ActualPercent,
    int? Week,
    int SectionType,
    int EntryType,
    string? StartDate,
    string? EndDate,
    string? Notes,
    string? Resources,
    string? UpdatedBy,
    int Status);

public sealed record ProjectManagementWorkspace(
    ProjectManagementProject Project,
    IReadOnlyList<ProjectManagementTaskDetails> Tasks,
    IReadOnlyList<ProjectManagementPlan> Plans,
    IReadOnlyList<ProjectManagementSummary> Summaries);

public interface IProjectManagementReader
{
    Task<IReadOnlyList<ProjectManagementProject>> GetProjectsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementTask>> GetTasksAsync(int projectId, CancellationToken cancellationToken);
    Task<ProjectManagementWorkspace> GetWorkspaceAsync(int projectId, CancellationToken cancellationToken);
    Task<ProjectManagementPmbokWorkspace> GetPmbokWorkspaceAsync(int projectId, CancellationToken cancellationToken);
}

public sealed class ProjectManagementStoreException(string message, string code, int statusCode) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}
